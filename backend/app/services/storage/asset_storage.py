import concurrent.futures
import logging
import os
import re
from abc import ABC, abstractmethod
from datetime import timedelta
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

    def get_media_url(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Returns a browser-consumable public URL for an asset.

        Subclasses that back assets with a durable cloud service (e.g. Firebase
        Storage) should override this to return a freshly-generated URL so that
        media keeps working even after the local filesystem is recycled.
        """
        raise NotImplementedError

    def ensure_local_asset(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        """Ensures the asset exists locally on disk, downloading from cloud storage if needed."""
        return self.get_asset_path(project_id, asset_category, filename, owner_id)

    def upload_to_cloud(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Best-effort durable upload of an already-written local asset. Returns a
        signed/public URL when a cloud backend is available, else None.
        """
        return None


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

    def get_media_url(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        safe_name = sanitize_filename(filename)
        path = self.projects_dir / project_id / asset_category / safe_name
        if path.exists():
            return f"/media/{project_id}/{asset_category}/{safe_name}"
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
        self._url_cache: dict = {}  # {cloud_blob_path: (url, expiry_timestamp)}
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=4, thread_name_prefix="cloud_asset_uploader")

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

        # If Cloud Storage bucket is available and owner is specified, upload to Firebase Storage asynchronously in background
        if self.bucket and owner_id:
            safe_name = sanitize_filename(filename)
            cloud_blob_path = f"users/{owner_id}/projects/{project_id}/{asset_category}/{safe_name}"

            def _background_upload(b_content=content, b_type=content_type, b_path=cloud_blob_path):
                try:
                    import time
                    blob = self.bucket.blob(b_path)
                    blob.upload_from_string(b_content, content_type=b_type)
                    signed_url = blob.generate_signed_url(expiration=timedelta(days=7))
                    self._url_cache[b_path] = (signed_url, time.time() + 86400 * 6)
                except Exception:
                    # Cloud storage unavailable or bucket not configured; local storage is active fallback
                    pass

            self._executor.submit(_background_upload)

        return local_rel, local_url

    def ensure_local_asset(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        """
        Ensures the asset exists on the local container filesystem.
        If missing locally (e.g. after container restart / cold start on Render),
        retrieves the asset from Firebase Cloud Storage, restores it locally,
        and returns the Path.
        """
        safe_name = sanitize_filename(filename)
        local_path = self.local_storage.get_asset_path(project_id, asset_category, safe_name, owner_id)
        if local_path and local_path.exists():
            return local_path

        dest_path = self.local_storage.projects_dir / project_id / asset_category / safe_name

        if self.bucket:
            # Candidate cloud blob paths to check
            candidate_paths = []
            if owner_id:
                candidate_paths.append(f"users/{owner_id}/projects/{project_id}/{asset_category}/{safe_name}")
            candidate_paths.append(f"projects/{project_id}/{asset_category}/{safe_name}")

            for b_path in candidate_paths:
                try:
                    blob = self.bucket.blob(b_path)
                    if blob.exists():
                        dest_path.parent.mkdir(parents=True, exist_ok=True)
                        blob.download_to_filename(str(dest_path))
                        logger.info(f"Restored asset '{safe_name}' from Cloud Storage ({b_path}) to local disk.")
                        return dest_path
                except Exception as e:
                    logger.debug(f"Could not download blob '{b_path}': {e}")

            # If owner_id was unknown, search user storage folders for this project asset
            try:
                target_suffix = f"projects/{project_id}/{asset_category}/{safe_name}"
                blobs = self.bucket.list_blobs(prefix="users/", max_results=100)
                for b in blobs:
                    if b.name.endswith(target_suffix):
                        dest_path.parent.mkdir(parents=True, exist_ok=True)
                        b.download_to_filename(str(dest_path))
                        logger.info(f"Restored asset '{safe_name}' from Cloud Storage ({b.name}) to local disk.")
                        return dest_path
            except Exception as e:
                logger.debug(f"Cloud blob search for '{safe_name}' failed: {e}")

        return None

    def get_asset_path(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[Path]:
        return self.ensure_local_asset(project_id, asset_category, filename, owner_id)

    def get_media_url(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Returns a durable, browser-consumable URL for an asset.

        Serves the fast local `/media/...` URL whenever the file exists
        locally or can be restored locally from Cloud Storage. Otherwise
        falls back to a freshly-signed Firebase Storage URL with in-memory TTL caching.
        """
        safe_name = sanitize_filename(filename)

        local = self.local_storage.get_media_url(project_id, asset_category, safe_name)
        if local:
            return local

        # Attempt to restore from Cloud Storage to local disk
        restored = self.ensure_local_asset(project_id, asset_category, safe_name, owner_id)
        if restored and restored.exists():
            return f"/media/{project_id}/{asset_category}/{safe_name}"

        if self.bucket and owner_id:
            cloud_blob_path = f"users/{owner_id}/projects/{project_id}/{asset_category}/{safe_name}"
            import time
            now = time.time()
            cached = self._url_cache.get(cloud_blob_path)
            if cached and cached[1] > now:
                return cached[0]

            try:
                blob = self.bucket.blob(cloud_blob_path)
                if blob.exists():
                    url = blob.generate_signed_url(expiration=timedelta(days=7))
                    self._url_cache[cloud_blob_path] = (url, now + 86400 * 6)
                    return url
            except Exception as e:
                logger.warning(f"Could not generate signed URL for {asset_category}/{safe_name}: {e}")

        return None

    def upload_to_cloud(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """Uploads an asset to Firebase Storage and returns a signed URL (best-effort)."""
        safe_name = sanitize_filename(filename)
        if not (self.bucket and owner_id):
            return None
        try:
            cloud_blob_path = f"users/{owner_id}/projects/{project_id}/{asset_category}/{safe_name}"
            blob = self.bucket.blob(cloud_blob_path)
            blob.upload_from_string(content, content_type=content_type)
            logger.info(f"Uploaded asset to Firebase Storage: {cloud_blob_path}")
            return blob.generate_signed_url(expiration=timedelta(days=7))
        except Exception as e:
            logger.warning(f"Firebase durability upload failed for {asset_category}/{safe_name}: {e}")
            return None


# Global default asset storage instance
default_asset_storage = FirebaseStorageAdapter()
