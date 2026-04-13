"""
Kindai Estimating Suite — Prometheus Metrics
=============================================
Defines all application metrics exposed at /metrics.
"""

from prometheus_client import Counter, Histogram, Gauge, Info

# ---------------------------------------------------------------------------
# Inference metrics
# ---------------------------------------------------------------------------
INFERENCE_LATENCY = Histogram(
    "kindai_inference_latency_seconds",
    "Time taken for a single model inference",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

INFERENCE_REQUESTS = Counter(
    "kindai_inference_requests_total",
    "Total number of inference requests",
)

INFERENCE_ERRORS = Counter(
    "kindai_inference_errors_total",
    "Total number of failed inference requests",
)

DETECTIONS_TOTAL = Counter(
    "kindai_detections_total",
    "Total number of objects detected across all inferences",
)

# ---------------------------------------------------------------------------
# Quote / feedback metrics
# ---------------------------------------------------------------------------
QUOTES_SUBMITTED = Counter(
    "kindai_quotes_submitted_total",
    "Total quotes submitted by users",
)

CORRECTIONS_TOTAL = Counter(
    "kindai_corrections_total",
    "Total item corrections made by users (active learning signal)",
)

# ---------------------------------------------------------------------------
# Scale calibration metrics
# ---------------------------------------------------------------------------
CALIBRATION_REQUESTS = Counter(
    "kindai_calibration_requests_total",
    "Total scale calibration requests",
)

CALIBRATION_CONFIDENCE = Histogram(
    "kindai_calibration_confidence",
    "Confidence distribution of scale calibrations",
    buckets=[0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
)

# ---------------------------------------------------------------------------
# System metrics
# ---------------------------------------------------------------------------
ACTIVE_JOBS = Gauge(
    "kindai_active_jobs",
    "Number of currently processing jobs",
)

MODEL_INFO = Info(
    "kindai_model",
    "Current model metadata",
)

# Set model info at import time
from backend.config import settings
MODEL_INFO.info({
    "version": settings.model_version,
    "weights": settings.model_weights,
    "confidence_threshold": str(settings.confidence_threshold),
})
