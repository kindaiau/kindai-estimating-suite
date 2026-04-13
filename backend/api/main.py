"""
Kindai Estimating Suite — FastAPI Application
==============================================
Main API server with:
- REST endpoints for upload, inference, quotes, feedback
- WebSocket endpoint for real-time job status updates
- Prometheus metrics at /metrics
- Health check at /health
"""

from __future__ import annotations

import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator

from backend.config import settings, PROJECT_ROOT
from backend.monitoring.metrics import (
    ACTIVE_JOBS,
    QUOTES_SUBMITTED,
    CORRECTIONS_TOTAL,
    CALIBRATION_REQUESTS,
    CALIBRATION_CONFIDENCE,
)

# ---------------------------------------------------------------------------
# Job tracking (in-memory for now — swap for Redis in production)
# ---------------------------------------------------------------------------

class JobStatus:
    """Tracks the status of an async processing job."""

    def __init__(self, job_id: str, plan_id: str, user_id: str):
        self.job_id = job_id
        self.plan_id = plan_id
        self.user_id = user_id
        self.status = "queued"  # queued → processing → complete → error
        self.progress = 0.0     # 0.0 – 1.0
        self.stage = "Waiting in queue"
        self.estimated_seconds: float | None = None
        self.started_at: float | None = None
        self.completed_at: float | None = None
        self.result: dict[str, Any] | None = None
        self.error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        elapsed = None
        if self.started_at:
            end = self.completed_at or time.time()
            elapsed = round(end - self.started_at, 1)
        return {
            "job_id": self.job_id,
            "plan_id": self.plan_id,
            "status": self.status,
            "progress": round(self.progress, 2),
            "stage": self.stage,
            "estimated_seconds": self.estimated_seconds,
            "elapsed_seconds": elapsed,
            "result": self.result,
            "error": self.error,
        }


# Global job store
_jobs: dict[str, JobStatus] = {}

# WebSocket connections per job_id
_ws_connections: dict[str, list[WebSocket]] = {}

# Historical latencies for time estimation
_latency_history: list[float] = []


async def notify_ws(job_id: str, data: dict):
    """Push status update to all WebSocket subscribers for a job."""
    connections = _ws_connections.get(job_id, [])
    dead = []
    for ws in connections:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


def estimate_time() -> float:
    """Estimate processing time based on recent history."""
    if not _latency_history:
        return 15.0  # default estimate for first run
    # Use rolling average of last 20 jobs
    recent = _latency_history[-20:]
    return round(sum(recent) / len(recent), 1)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[api] Kindai Estimating Suite v{settings.model_version} starting...")
    yield
    print("[api] Shutting down...")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-native construction estimating — reads plans, detects items, generates quotes",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

# Serve frontend static files
frontend_dir = PROJECT_ROOT / "frontend" / "public"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class QuoteSubmission(BaseModel):
    plan_id: str
    user_id: str
    final_counts: dict[str, int]


class FeedbackResponse(BaseModel):
    plan_id: str
    corrections: list[dict[str, Any]]
    total_corrections: int


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "model_version": settings.model_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Upload & Process
# ---------------------------------------------------------------------------

@app.post("/api/v1/upload")
async def upload_plan(
    file: UploadFile = File(...),
    user_id: str = "anonymous",
):
    """
    Upload a floorplan PDF/image and start async processing.
    Returns a job_id for status tracking via WebSocket or polling.
    """
    # Validate file type
    allowed = {".pdf", ".png", ".jpg", ".jpeg", ".tiff"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(400, f"Unsupported file type: {suffix}. Allowed: {allowed}")

    # Save uploaded file
    job_id = str(uuid.uuid4())
    plan_id = Path(file.filename or job_id).stem
    upload_dir = PROJECT_ROOT / "data" / "uploads" / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / file.filename

    content = await file.read()
    file_path.write_bytes(content)

    # Create job
    job = JobStatus(job_id=job_id, plan_id=plan_id, user_id=user_id)
    job.estimated_seconds = estimate_time()
    _jobs[job_id] = job

    # Start background processing
    asyncio.create_task(_process_job(job, file_path, content))

    return {
        "job_id": job_id,
        "plan_id": plan_id,
        "status": "queued",
        "estimated_seconds": job.estimated_seconds,
        "ws_url": f"/ws/jobs/{job_id}",
        "poll_url": f"/api/v1/jobs/{job_id}",
    }


async def _process_job(job: JobStatus, file_path: Path, raw_bytes: bytes):
    """Background task: run inference pipeline on uploaded plan."""
    ACTIVE_JOBS.inc()
    job.status = "processing"
    job.started_at = time.time()

    try:
        # Stage 1: Scale calibration (if PDF)
        job.stage = "Calibrating scale from title block"
        job.progress = 0.1
        await notify_ws(job.job_id, job.to_dict())
        await asyncio.sleep(0.1)  # yield to event loop

        scale_result = None
        if file_path.suffix.lower() == ".pdf":
            try:
                from backend.utils.scale_calibration import calibrate_scale
                CALIBRATION_REQUESTS.inc()
                scale_result = calibrate_scale(file_path)
                CALIBRATION_CONFIDENCE.observe(scale_result.confidence)
            except Exception as exc:
                print(f"[api] Scale calibration warning: {exc}")

        # Stage 2: Convert PDF to image if needed
        job.stage = "Preparing image for analysis"
        job.progress = 0.3
        await notify_ws(job.job_id, job.to_dict())

        from PIL import Image
        import numpy as np

        if file_path.suffix.lower() == ".pdf":
            from backend.utils.scale_calibration import render_pdf_page
            image_array = render_pdf_page(file_path, dpi=150)
            image = Image.fromarray(image_array)
        else:
            image = Image.open(file_path).convert("RGB")

        # Stage 3: Run inference
        job.stage = "AI detecting items on floorplan"
        job.progress = 0.5
        await notify_ws(job.job_id, job.to_dict())

        from backend.inference.engine import run_inference
        result = run_inference(
            image,
            user_id=job.user_id,
            plan_id=job.plan_id,
            image_bytes=raw_bytes,
        )

        # Stage 4: Compile results
        job.stage = "Compiling quote"
        job.progress = 0.9
        await notify_ws(job.job_id, job.to_dict())

        job.result = {
            "counts": result.counts,
            "total_items": sum(result.counts.values()),
            "detections": result.detections[:100],  # cap for response size
            "latency_ms": round(result.latency_ms, 2),
            "image_shape": list(result.image_shape),
            "scale": scale_result.to_dict() if scale_result else None,
        }

        job.status = "complete"
        job.progress = 1.0
        job.stage = "Done"
        job.completed_at = time.time()

        # Track latency for future estimates
        elapsed = job.completed_at - job.started_at
        _latency_history.append(elapsed)

    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
        job.stage = "Failed"
        job.completed_at = time.time()

    finally:
        ACTIVE_JOBS.dec()
        await notify_ws(job.job_id, job.to_dict())


# ---------------------------------------------------------------------------
# Job status (polling)
# ---------------------------------------------------------------------------

@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Poll for job status. Alternative to WebSocket."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, f"Job {job_id} not found")
    return job.to_dict()


# ---------------------------------------------------------------------------
# WebSocket for real-time status
# ---------------------------------------------------------------------------

@app.websocket("/ws/jobs/{job_id}")
async def ws_job_status(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for real-time job status updates.
    Client connects and receives JSON status messages as the job progresses.
    """
    await websocket.accept()

    # Register connection
    if job_id not in _ws_connections:
        _ws_connections[job_id] = []
    _ws_connections[job_id].append(websocket)

    try:
        # Send current status immediately
        job = _jobs.get(job_id)
        if job:
            await websocket.send_json(job.to_dict())
        else:
            await websocket.send_json({"error": f"Job {job_id} not found"})
            return

        # Keep connection alive until job completes or client disconnects
        while True:
            try:
                # Wait for client messages (keepalive pings)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Client can send "status" to get current state
                if data == "status":
                    job = _jobs.get(job_id)
                    if job:
                        await websocket.send_json(job.to_dict())
            except asyncio.TimeoutError:
                # Send heartbeat
                job = _jobs.get(job_id)
                if job:
                    await websocket.send_json({"heartbeat": True, **job.to_dict()})
                    if job.status in ("complete", "error"):
                        break

    except WebSocketDisconnect:
        pass
    finally:
        if job_id in _ws_connections:
            _ws_connections[job_id] = [
                ws for ws in _ws_connections[job_id] if ws != websocket
            ]


# ---------------------------------------------------------------------------
# Quote submission & feedback
# ---------------------------------------------------------------------------

@app.post("/api/v1/quotes/submit", response_model=FeedbackResponse)
async def submit_quote(submission: QuoteSubmission):
    """
    Submit the user's final corrected quote.
    Diffs against AI predictions and logs feedback for active learning.
    """
    QUOTES_SUBMITTED.inc()

    # Find the original AI predictions for this plan
    ai_counts: dict[str, int] = {}
    for job in _jobs.values():
        if job.plan_id == submission.plan_id and job.result:
            ai_counts = job.result.get("counts", {})
            break

    if not ai_counts:
        # No AI prediction found — just log the final counts
        ai_counts = {}

    from backend.inference.feedback import record_feedback

    corrections = record_feedback(
        plan_id=submission.plan_id,
        user_id=submission.user_id,
        ai_counts=ai_counts,
        final_counts=submission.final_counts,
    )

    CORRECTIONS_TOTAL.inc(len(corrections))

    return FeedbackResponse(
        plan_id=submission.plan_id,
        corrections=corrections,
        total_corrections=len(corrections),
    )


# ---------------------------------------------------------------------------
# Feedback stats
# ---------------------------------------------------------------------------

@app.get("/api/v1/feedback/stats")
async def feedback_stats(days: int = 30):
    """Get feedback/correction statistics for the model monitoring dashboard."""
    from backend.inference.feedback import get_feedback_stats
    return get_feedback_stats(last_n_days=days)


@app.get("/api/v1/feedback/hard-examples")
async def hard_examples(min_corrections: int = 3):
    """Get plan IDs that had the most corrections (active learning candidates)."""
    from backend.inference.feedback import get_hard_examples
    return {"hard_examples": get_hard_examples(min_corrections=min_corrections)}


# ---------------------------------------------------------------------------
# Scale calibration endpoint
# ---------------------------------------------------------------------------

@app.post("/api/v1/calibrate")
async def calibrate(file: UploadFile = File(...)):
    """Standalone scale calibration for a PDF floorplan."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files supported for scale calibration")

    CALIBRATION_REQUESTS.inc()

    # Save temp file
    tmp_path = PROJECT_ROOT / "data" / "uploads" / f"cal_{uuid.uuid4().hex[:8]}.pdf"
    tmp_path.parent.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    tmp_path.write_bytes(content)

    try:
        from backend.utils.scale_calibration import calibrate_scale
        result = calibrate_scale(tmp_path)
        CALIBRATION_CONFIDENCE.observe(result.confidence)
        return result.to_dict()
    finally:
        tmp_path.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# Inference logs
# ---------------------------------------------------------------------------

@app.get("/api/v1/logs")
async def get_logs(last_n: int = 50):
    """Get recent inference logs for debugging/monitoring."""
    from backend.inference.logger import read_inference_logs
    return {"logs": read_inference_logs(last_n=last_n)}
