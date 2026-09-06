from datetime import datetime, timezone, timedelta
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional

from app.configuration.config import settings

logger = logging.getLogger(__name__)

# Daily estimates (free tier)
# Cloudflare Workers AI free tier: 10,000 neurons/day.
# FLUX.1-schnell uses ~400 neurons per generation (~25 images/day).
ESTIMATED_DAILY_LIMITS = {
    "cloudflare": 25,
}

class UsageTrackerService:
    """
    Persistently tracks provider generation usage per calendar day (UTC).
    Automatically rolls over at 00:00 UTC.
    Tracks HTTP 429 quota exhaustion events.
    """

    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir or settings.STORAGE_DIR) / "usage"
        self.usage_file = self.storage_dir / "provider_usage.json"
        self._ensure_dir()

    def _ensure_dir(self):
        try:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"Failed to create usage directory: {e}")

    def _get_today_utc_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _get_next_reset_utc(self) -> str:
        now = datetime.now(timezone.utc)
        tomorrow = now.date() + timedelta(days=1)
        reset_time = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 0, 0, tzinfo=timezone.utc)
        return reset_time.isoformat()

    def _load_data(self) -> Dict[str, Any]:
        if not self.usage_file.exists():
            return {}
        try:
            with open(self.usage_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error reading usage file {self.usage_file}: {e}")
            return {}

    def _save_data(self, data: Dict[str, Any]) -> None:
        self._ensure_dir()
        tmp_file = self.usage_file.with_suffix(".json.tmp")
        try:
            with open(tmp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_file, self.usage_file)
        except Exception as e:
            logger.warning(f"Error writing usage file {self.usage_file}: {e}")
            if tmp_file.exists():
                try:
                    tmp_file.unlink()
                except Exception:
                    pass

    def record_call(self, provider: str, success: bool = True, status_code: Optional[int] = None) -> None:
        """
        Record a provider call for today.
        If status_code is 429, marks quota_exhausted for this provider today.
        """
        provider = provider.lower()
        today = self._get_today_utc_key()
        data = self._load_data()

        if today not in data:
            data[today] = {}

        if provider not in data[today]:
            data[today][provider] = {
                "count": 0,
                "quota_exhausted": False,
                "last_call_at": None,
                "last_status": None,
            }

        entry = data[today][provider]
        if success:
            entry["count"] += 1
        entry["last_call_at"] = datetime.now(timezone.utc).isoformat()
        entry["last_status"] = status_code or (200 if success else 500)

        if status_code == 429:
            entry["quota_exhausted"] = True
            logger.info(f"Provider '{provider}' marked quota_exhausted for date {today}")

        self._save_data(data)

    def get_provider_usage(self, provider: str) -> Dict[str, Any]:
        """
        Get today's usage statistics for a specific provider.
        """
        provider = provider.lower()
        today = self._get_today_utc_key()
        data = self._load_data()

        today_data = data.get(today, {}).get(provider, {})
        used_count = today_data.get("count", 0)
        is_exhausted = today_data.get("quota_exhausted", False)
        estimated_limit = ESTIMATED_DAILY_LIMITS.get(provider)

        remaining = None
        if estimated_limit is not None:
            remaining = 0 if is_exhausted else max(0, estimated_limit - used_count)

        return {
            "provider": provider,
            "date": today,
            "used_today": used_count,
            "estimated_daily_limit": estimated_limit,
            "remaining_today": remaining,
            "is_exhausted": is_exhausted,
            "resets_at_utc": self._get_next_reset_utc(),
        }

    def get_all_usage(self) -> Dict[str, Any]:
        """
        Get usage statistics for all tracked providers.
        """
        tracked_providers = ["cloudflare", "pollinations", "sana_local"]
        return {p: self.get_provider_usage(p) for p in tracked_providers}


# Global singleton instance
usage_tracker = UsageTrackerService()
