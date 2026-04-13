"""
Kindai Estimating Suite — Centralised Configuration
====================================================
All tunables live here. Override via environment variables or .env file.
"""

from __future__ import annotations

import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
AUGMENTED_DIR = DATA_DIR / "augmented"
ANNOTATIONS_DIR = DATA_DIR / "annotations"
MODELS_DIR = DATA_DIR / "models"
FEEDBACK_DIR = DATA_DIR / "feedback"
LOGS_DIR = PROJECT_ROOT / "logs"

# Ensure directories exist at import time
for _d in (RAW_DIR, AUGMENTED_DIR, ANNOTATIONS_DIR, MODELS_DIR, FEEDBACK_DIR, LOGS_DIR):
    _d.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Settings (overridable via env vars)
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    """Application settings loaded from environment / .env."""

    # API
    app_name: str = "Kindai Estimating Suite"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Model
    model_weights: str = str(MODELS_DIR / "yolov5_custom.pt")
    model_version: str = "v1.2"
    confidence_threshold: float = 0.45
    iou_threshold: float = 0.50

    # Training
    train_epochs: int = 10
    train_batch_size: int = 16
    train_img_size: int = 640
    train_lr: float = 0.001
    pretrained_weights: str = "yolov5s.pt"

    # Augmentation
    augment_count: int = 5  # augmented copies per image

    # Scale calibration
    default_scale_text: str = "1:100"
    ocr_language: str = "eng"

    # Monitoring
    prometheus_port: int = 9090
    log_file: str = str(LOGS_DIR / "inference.jsonl")

    # Feedback
    feedback_csv: str = str(FEEDBACK_DIR / "feedback.csv")

    # WebSocket
    ws_poll_interval: float = 1.0  # seconds

    model_config = {
        "env_prefix": "KINDAI_",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
