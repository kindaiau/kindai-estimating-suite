"""
Kindai Estimating Suite — Inference Engine
==========================================
Wraps YOLOv5 (via ultralytics) for floorplan object detection.
Handles model loading, inference, result aggregation, and logging.
"""

from __future__ import annotations

import time
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from backend.config import settings
from backend.inference.logger import log_inference
from backend.monitoring.metrics import (
    INFERENCE_LATENCY,
    INFERENCE_REQUESTS,
    INFERENCE_ERRORS,
    DETECTIONS_TOTAL,
)

# ---------------------------------------------------------------------------
# Lazy model singleton
# ---------------------------------------------------------------------------
_model = None


def _load_model():
    """Load YOLOv5 model weights (lazy, first-call only)."""
    global _model
    if _model is not None:
        return _model

    weights = Path(settings.model_weights)
    if not weights.exists():
        # Fall back to pretrained yolov5s for dev / CI
        weights = Path(settings.pretrained_weights)

    try:
        import torch

        _model = torch.hub.load(
            "ultralytics/yolov5",
            "custom" if Path(settings.model_weights).exists() else "yolov5s",
            path=str(weights) if Path(settings.model_weights).exists() else None,
            trust_repo=True,
        )
        _model.conf = settings.confidence_threshold
        _model.iou = settings.iou_threshold
    except Exception:
        # Ultralytics v8 fallback
        from ultralytics import YOLO

        _model = YOLO(str(weights) if weights.exists() else "yolov5su.pt")

    return _model


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class DetectionResult:
    """Structured result from a single inference run."""

    def __init__(
        self,
        detections: list[dict[str, Any]],
        counts: dict[str, int],
        latency_ms: float,
        image_shape: tuple[int, int],
    ):
        self.detections = detections  # list of {label, confidence, bbox}
        self.counts = counts          # e.g. {"door": 5, "window": 12}
        self.latency_ms = latency_ms
        self.image_shape = image_shape

    def to_dict(self) -> dict[str, Any]:
        return {
            "detections": self.detections,
            "counts": self.counts,
            "total_items": sum(self.counts.values()),
            "latency_ms": round(self.latency_ms, 2),
            "image_shape": list(self.image_shape),
        }


def run_inference(
    image: Image.Image | np.ndarray,
    *,
    user_id: str = "anonymous",
    plan_id: str = "unknown",
    image_bytes: bytes | None = None,
) -> DetectionResult:
    """
    Run YOLOv5 inference on a single floorplan image.

    Parameters
    ----------
    image : PIL Image or numpy array
    user_id : str — for audit logging
    plan_id : str — plan/project identifier
    image_bytes : optional raw bytes for hashing in logs

    Returns
    -------
    DetectionResult with bounding boxes, counts, and timing.
    """
    INFERENCE_REQUESTS.inc()
    model = _load_model()

    t0 = time.perf_counter()
    try:
        results = model(image)
        latency_ms = (time.perf_counter() - t0) * 1000
    except Exception as exc:
        INFERENCE_ERRORS.inc()
        raise RuntimeError(f"Inference failed: {exc}") from exc

    # Parse results — handle both torch hub and ultralytics formats
    detections: list[dict[str, Any]] = []
    counts: Counter[str] = Counter()

    try:
        # Ultralytics v5 torch hub format
        df = results.pandas().xyxy[0]
        for _, row in df.iterrows():
            label = row["name"]
            det = {
                "label": label,
                "confidence": round(float(row["confidence"]), 4),
                "bbox": [
                    round(float(row["xmin"]), 1),
                    round(float(row["ymin"]), 1),
                    round(float(row["xmax"]), 1),
                    round(float(row["ymax"]), 1),
                ],
            }
            detections.append(det)
            counts[label] += 1
    except (AttributeError, IndexError):
        # Ultralytics v8 format
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id] if hasattr(model, "names") else str(cls_id)
                det = {
                    "label": label,
                    "confidence": round(float(box.conf[0]), 4),
                    "bbox": [round(float(c), 1) for c in box.xyxy[0].tolist()],
                }
                detections.append(det)
                counts[label] += 1

    # Determine image shape
    if isinstance(image, np.ndarray):
        img_shape = (image.shape[0], image.shape[1])
    else:
        img_shape = (image.height, image.width)

    # Record Prometheus metrics
    INFERENCE_LATENCY.observe(latency_ms / 1000)  # histogram in seconds
    DETECTIONS_TOTAL.inc(sum(counts.values()))

    # Structured log
    log_inference(
        user_id=user_id,
        plan_id=plan_id,
        detections=dict(counts),
        latency_ms=latency_ms,
        image_bytes=image_bytes,
    )

    return DetectionResult(
        detections=detections,
        counts=dict(counts),
        latency_ms=latency_ms,
        image_shape=img_shape,
    )
