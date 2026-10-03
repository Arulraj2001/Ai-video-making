"""Shared rate-limit buckets with a safe local fallback."""

import hashlib
import threading
import time
from collections import defaultdict, deque
from typing import Optional

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client


class RateLimitService:
    def __init__(self, limit: int, window_seconds: int, backend: Optional[str] = None):
        self.limit = max(1, limit)
        self.window_seconds = max(1, window_seconds)
        self.backend = (backend or settings.RATE_LIMIT_STORAGE_BACKEND).lower()
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> tuple[bool, int]:
        if self.backend == "firestore":
            result = self._allow_firestore(key)
            if result is not None:
                return result
        return self._allow_memory(key)

    def _allow_memory(self, key: str) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= self.limit:
                return False, max(1, int(events[0] + self.window_seconds - now))
            events.append(now)
            if len(self._events) > 10000:
                self._events.pop(next(iter(self._events)))
            return True, 0

    def _allow_firestore(self, key: str) -> Optional[tuple[bool, int]]:
        db = get_firestore_client()
        if not db:
            return None
        try:
            from firebase_admin import firestore

            doc_id = hashlib.sha256(key.encode("utf-8")).hexdigest()
            ref = db.collection("rate_limit_buckets").document(doc_id)
            transaction = db.transaction()
            now = time.time()

            @firestore.transactional
            def reserve(txn):
                snapshot = ref.get(transaction=txn)
                events = list((snapshot.to_dict() or {}).get("events", [])) if snapshot.exists else []
                cutoff = now - self.window_seconds
                events = [float(value) for value in events if float(value) > cutoff]
                if len(events) >= self.limit:
                    return False, max(1, int(events[0] + self.window_seconds - now))
                events.append(now)
                txn.set(ref, {"events": events, "updated_at": now})
                return True, 0

            return reserve(transaction)
        except Exception:
            return None

