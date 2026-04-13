"""
Kindai Estimating Suite — Structured Inference Logger
=====================================================
Logs every inference call as a single JSON line to a .jsonl file.
Fields: user_id, request_time, model_version, plan_id, detections (dict),
        latency_ms, confidence_threshold, image_hash.

Usage:
    from backend.inference.logger import log_inference
    log_inference(user_id="u42", plan_id="plan-7", detections={"door": 5, "window": 12}, latency_ms=340.2)
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.config import settings

# ---------------------------------------------------------------------------
# File handler (thread-safe, append-only)
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_log_path = Path(settings.log_file)

_file_logger = logging.getLogger("kindai.inference")
_file_logger.setLevel(logging.INFO)
_file_logger.propagate = False

_handler = logging.FileHandler(_log_path, mode="a", encoding="utf-8")
_handler.setFormatter(logging.Formatter("%(message)s"))  # raw JSON lines
_file_logger.addHandler(_handler)


def _image_hash(image_bytes: bytes | None) -> str | None:
    """SHA-256 fingerprint of the input image for dedup / audit."""
    if image_bytes is None:
        return None
    return hashlib.sha256(image_bytes).hexdigest()[:16]


def log_inference(
    *,
    user_id: str,
    plan_id: str,
    detections: dict[str, int],
    latency_ms: float,
    model_version: str | None = None,
    confidence_threshold: float | None = None,
    image_bytes: bytes | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Append a structured JSON record after every model inference.

    Returns the logged record dict (handy for tests / downstream).
    """
    record: dict[str, Any] = {
        "event": "inference",
        "user_id": user_id,
        "plan_id": plan_id,
        "request_time": datetime.now(timezone.utc).isoformat(),
        "model_version": model_version or settings.model_version,
        "confidence_threshold": confidence_threshold or settings.confidence_threshold,
        "detections": detections,
        "total_items_detected": sum(detections.values()),
        "latency_ms": round(latency_ms, 2),
        "image_hash": _image_hash(image_bytes),
    }
    if extra:
        record["extra"] = extra

    line = json.dumps(record, default=str)
    with _lock:
        _file_logger.info(line)

    return record


def read_inference_logs(last_n: int = 100) -> list[dict[str, Any]]:
    """Read the most recent *last_n* inference log records."""
    if not _log_path.exists():
        return []
    lines = _log_path.read_text().strip().splitlines()
    return [json.loads(l) for l in lines[-last_n:]]
