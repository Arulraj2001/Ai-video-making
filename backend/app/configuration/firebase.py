import json
import logging
import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.configuration.config import settings

logger = logging.getLogger("scenora.firebase")

_app: Optional[firebase_admin.App] = None

def initialize_firebase() -> Optional[firebase_admin.App]:
    """
    Initializes the Firebase Admin SDK for server-side verification,
    Firestore persistence, and Firebase Storage operations.
    """
    global _app
    if _app is not None:
        return _app

    if len(firebase_admin._apps) > 0:
        _app = firebase_admin.get_app()
        return _app

    options = {
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
    }

    try:
        cred = None
        key_env = settings.FIREBASE_SERVICE_ACCOUNT_KEY
        if key_env:
            key_clean = key_env.strip()
            backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            candidate_path = os.path.join(backend_root, key_clean) if not os.path.isabs(key_clean) else key_clean
            if os.path.exists(key_clean):
                cred = credentials.Certificate(key_clean)
            elif os.path.exists(candidate_path):
                cred = credentials.Certificate(candidate_path)
            else:
                try:
                    cred_dict = json.loads(key_clean)
                    cred = credentials.Certificate(cred_dict)
                except Exception:
                    logger.warning("FIREBASE_SERVICE_ACCOUNT_KEY was provided but not valid JSON or file path.")

        if cred:
            _app = firebase_admin.initialize_app(cred, options)
        else:
            # Initialize with project ID for token verification against Google public certs
            _app = firebase_admin.initialize_app(options=options)

        logger.info(f"Firebase Admin initialized for project '{settings.FIREBASE_PROJECT_ID}'")
        return _app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return None

def get_firestore_client():
    """Returns Cloud Firestore client if available."""
    try:
        initialize_firebase()
        return firestore.client()
    except Exception as e:
        logger.warning(f"Cloud Firestore client unavailable: {e}")
        return None

def get_storage_bucket():
    """Returns Cloud Storage bucket reference if available."""
    try:
        initialize_firebase()
        return storage.bucket()
    except Exception as e:
        logger.warning(f"Cloud Storage bucket unavailable: {e}")
        return None
