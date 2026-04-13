"""Tests for the FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "model_version" in data


def test_metrics_endpoint():
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "kindai_inference_requests_total" in resp.text


def test_upload_rejects_invalid_file():
    resp = client.post(
        "/api/v1/upload",
        files={"file": ("test.txt", b"not an image", "text/plain")},
    )
    assert resp.status_code == 400


def test_job_not_found():
    resp = client.get("/api/v1/jobs/nonexistent-id")
    assert resp.status_code == 404


def test_feedback_stats_empty():
    resp = client.get("/api/v1/feedback/stats")
    assert resp.status_code == 200
