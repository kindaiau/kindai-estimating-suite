"""Tests for the active learning feedback module."""

from backend.inference.feedback import record_feedback, _classify_correction


def test_classify_correction():
    assert _classify_correction(0, 5) == "added"
    assert _classify_correction(5, 0) == "removed"
    assert _classify_correction(3, 5) == "increased"
    assert _classify_correction(5, 3) == "decreased"
    assert _classify_correction(5, 5) == "unchanged"


def test_record_feedback_detects_changes():
    corrections = record_feedback(
        plan_id="test-plan-1",
        user_id="test-user",
        ai_counts={"door": 5, "window": 10},
        final_counts={"door": 6, "window": 10, "smoke_detector": 2},
    )
    # door: 5→6 (increased), window: unchanged, smoke_detector: 0→2 (added)
    assert len(corrections) == 2
    types = {c["item_type"] for c in corrections}
    assert "door" in types
    assert "smoke_detector" in types


def test_record_feedback_no_changes():
    corrections = record_feedback(
        plan_id="test-plan-2",
        user_id="test-user",
        ai_counts={"door": 5, "window": 10},
        final_counts={"door": 5, "window": 10},
    )
    assert len(corrections) == 0
