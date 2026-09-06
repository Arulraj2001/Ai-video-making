import logging
import os
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Tuple

from app.configuration.config import settings
from app.configuration.firebase import get_storage_bucket

logger = logging.getLogger("scenora.storage")

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename and strips any directory path traversal characters."""
    base = Path(filename).name
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "asset"

class AssetStorage(ABC):
    """Abstract interface for storing project assets (images, audio, video renders)."""

    @abstractmethod
    def save_asset(
        self,
        project_id: str,
        asset_category: str,  # 'images', 'audio', 'renders', 'references'
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Saves asset data and returns (storage_path, public_url)."""
        pass

    @abstractmethod
    def get_asset_path(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        """Returns local file Path if available."""
        pass


class LocalAssetStorage(AssetStorage):
    """Local filesystem asset storage for local dev, offline fallback, and fast media delivery."""

    def __init__(self, root_dir: Optional[Path] = None):
        self.root_dir = root_dir or Path(getattr(settings, "STORAGE_DIR", "storage"))
        self.projects_dir = self.root_dir / "projects"
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def save_asset(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Tuple[str, str]:
        safe_name = sanitize_filename(filename)
        dest_dir = self.projects_dir / project_id / asset_category
        dest_dir.mkdir(parents=True, exist_ok=True)
        file_path = dest_dir / safe_name

        with open(file_path, "wb") as f:
            f.write(content)

        rel_path = f"storage/projects/{project_id}/{asset_category}/{safe_name}"
        url = f"/media/{project_id}/{asset_category}/{safe_name}"
        return rel_path, url

    def get_asset_path(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        safe_name = sanitize_filename(filename)
        path = self.projects_dir / project_id / asset_category / safe_name
        if path.exists():
            return path
        return None


class FirebaseStorageAdapter(AssetStorage):
    """
    Firebase Cloud Storage adapter with seamless LocalAssetStorage fallback:
    - Writes to Cloud Storage path: users/{owner_id}/projects/{project_id}/{asset_category}/{filename}
    - Also persists local copy for immediate local preview/rendering
    """

    def __init__(self, local_fallback: Optional[LocalAssetStorage] = None):
        self.local_storage = local_fallback or LocalAssetStorage()
        self.bucket = get_storage_bucket()

    def save_asset(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Tuple[str, str]:
        # Always save locally first for fast local caching & preview
        local_rel, local_url = self.local_storage.save_asset(
            project_id=project_id,
            asset_category=asset_category,
            filename=filename,
            content=content,
            content_type=content_type,
            owner_id=owner_id,
        )

        # If Cloud Storage bucket is available and owner is specified, upload to Firebase Storage
        if self.bucket and owner_id:
            try:
                safe_name = sanitize_filename(filename)
                cloud_blob_path = f"users/{owner_id}/projects/{project_id}/{asset_category}/{safe_name}"
                blob = self.bucket.blob(cloud_blob_path)
                blob.upload_from_string(content, content_type=content_type)
                cloud_url = blob.public_url
                logger.info(f"Uploaded asset to Firebase Storage: {cloud_blob_path}")
                return cloud_blob_path, local_url  # Return local_url for seamless browser serving
            except Exception as e:
                logger.warning(f"Firebase Storage upload failed, keeping local fallback: {e}")

        return local_rel, local_url

    def get_asset_path(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        return self.local_storage.get_asset_path(project_id, asset_category, filename, owner_id)


# Global default asset storage instance
default_asset_storage = FirebaseStorageAdapter()
