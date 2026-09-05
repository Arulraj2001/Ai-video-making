import logging
import os
import sys

def setup_logging():
    """Configures structured application logging."""
    log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_name, logging.INFO)

    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True
    )

    # Set third-party loggers to reasonable levels
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("PIL").setLevel(logging.WARNING)

    logger = logging.getLogger("ai_video_maker")
    logger.info(f"Logging initialized with level: {log_level_name}")
    return logger
