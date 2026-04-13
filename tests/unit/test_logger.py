"""Tests for the structured inference logger."""

import json
from pathlib import Path

from backend.inference.logger import log_inference, read_inference_logs


def test_log_inference_creates_record():
    record = log_inference(
        user_id="test-user",
        plan_id="plan-001",
        detections={"door": 3, "window": 5},
        latency_ms=250.5,
    )
    assert record["user_id"] == "test-user"
    assert record["plan_id"] == "plan-001"
    assert record["total_items_detected"] == 8
    assert record["latency_ms"] == 250.5
    assert record["event"] == "inference"
    assert "request_time" in record


def test_log_inference_with_image_hash():
    record = log_inference(
        user_id="u1",
        plan_id="p1",
        detections={"light_switch": 2},
        latency_ms=100.0,
        image_bytes=b"fake image data",
    )
    assert record["image_hash"] is not None
    assert len(record["image_hash"]) == 16


def test_read_inference_logs():
    # Write a record first
    log_inference(
        user_id="reader-test",
        plan_id="plan-read",
        detections={"smoke_detector": 1},
        latency_ms=50.0,
    )
    logs = read_inference_logs(last_n=5)
    assert len(logs) >= 1
    assert any(l["user_id"] == "reader-test" for l in logs)
