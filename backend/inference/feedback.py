"""
Kindai Estimating Suite — Active Learning Feedback
===================================================
Captures the diff between AI-predicted item counts and the user's
final corrected quote. Corrections are appended to a CSV for
retraining prioritisation and active learning.

Workflow:
    1. AI runs inference → produces estimated counts per item type
    2. User reviews quote, adjusts counts (adds/removes items)
    3. On quote submission, this module diffs old vs new
    4. Differences are logged to feedback.csv
    5. Training pipeline reads feedback.csv to prioritise hard examples

Usage:
    from backend.inference.feedback import record_feedback, get_feedback_stats

    corrections = record_feedback(
        plan_id="plan-42",
        user_id="u7",
        ai_counts={"door": 5, "window": 12, "power_point": 8},
        final_counts={"door": 6, "window": 12, "power_point": 7, "smoke_detector": 2},
    )
"""

from __future__ import annotations

import csv
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from backend.config import settings

# ---------------------------------------------------------------------------
# Thread-safe CSV writer
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_csv_path = Path(settings.feedback_csv)

CSV_HEADERS = [
    "timestamp",
    "plan_id",
    "user_id",
    "item_type",
    "ai_count",
    "final_count",
    "delta",
    "correction_type",  # added | removed | increased | decreased | unchanged
    "model_version",
]


def _ensure_csv():
    """Create the CSV with headers if it doesn't exist."""
    if not _csv_path.exists():
        _csv_path.parent.mkdir(parents=True, exist_ok=True)
        with open(_csv_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)


def _classify_correction(ai: int, final: int) -> str:
    """Classify the type of correction."""
    if ai == 0 and final > 0:
        return "added"
    if ai > 0 and final == 0:
        return "removed"
    if final > ai:
        return "increased"
    if final < ai:
        return "decreased"
    return "unchanged"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def record_feedback(
    *,
    plan_id: str,
    user_id: str,
    ai_counts: dict[str, int],
    final_counts: dict[str, int],
    model_version: str | None = None,
) -> list[dict[str, Any]]:
    """
    Diff AI output vs user-corrected final quote and log differences.

    Parameters
    ----------
    plan_id : str — unique plan/project identifier
    user_id : str — who made the corrections
    ai_counts : dict — item counts from AI inference
    final_counts : dict — item counts from user's final submitted quote
    model_version : str — optional, defaults to settings

    Returns
    -------
    List of correction records (only items that changed).
    """
    _ensure_csv()
    now = datetime.now(timezone.utc).isoformat()
    mv = model_version or settings.model_version

    # Union of all item types from both AI and user
    all_items = sorted(set(ai_counts.keys()) | set(final_counts.keys()))

    corrections: list[dict[str, Any]] = []
    rows_to_write: list[list] = []

    for item_type in all_items:
        ai = ai_counts.get(item_type, 0)
        final = final_counts.get(item_type, 0)
        delta = final - ai
        correction_type = _classify_correction(ai, final)

        record = {
            "timestamp": now,
            "plan_id": plan_id,
            "user_id": user_id,
            "item_type": item_type,
            "ai_count": ai,
            "final_count": final,
            "delta": delta,
            "correction_type": correction_type,
            "model_version": mv,
        }

        # Always log the row (even unchanged — useful for analysis)
        rows_to_write.append([
            now, plan_id, user_id, item_type, ai, final, delta, correction_type, mv,
        ])

        # Only return changed items as "corrections"
        if delta != 0:
            corrections.append(record)

    # Thread-safe append
    with _lock:
        with open(_csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(rows_to_write)

    if corrections:
        print(f"[feedback] Plan {plan_id}: {len(corrections)} corrections logged")
    else:
        print(f"[feedback] Plan {plan_id}: no corrections (AI was spot-on)")

    return corrections


def get_feedback_stats(last_n_days: int = 30) -> dict[str, Any]:
    """
    Analyse feedback CSV and return summary statistics.

    Useful for dashboards and deciding which classes to prioritise
    in the next training round.
    """
    if not _csv_path.exists():
        return {"total_records": 0, "message": "No feedback data yet"}

    df = pd.read_csv(_csv_path)
    if df.empty:
        return {"total_records": 0, "message": "Feedback file is empty"}

    # Filter to recent data
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    cutoff = datetime.now(timezone.utc) - pd.Timedelta(days=last_n_days)
    recent = df[df["timestamp"] >= cutoff]

    if recent.empty:
        return {"total_records": len(df), "recent_records": 0}

    # Correction frequency by item type
    changed = recent[recent["correction_type"] != "unchanged"]
    correction_freq = (
        changed.groupby("item_type")["delta"]
        .agg(["count", "mean", "sum"])
        .rename(columns={"count": "corrections", "mean": "avg_delta", "sum": "total_delta"})
        .sort_values("corrections", ascending=False)
    )

    # Accuracy per item type (% unchanged)
    accuracy = (
        recent.groupby("item_type")
        .apply(lambda g: (g["correction_type"] == "unchanged").mean())
        .sort_values()
    )

    # Items the model struggles with most
    worst_items = accuracy.head(10).to_dict()

    return {
        "total_records": len(df),
        "recent_records": len(recent),
        "unique_plans": recent["plan_id"].nunique(),
        "correction_frequency": correction_freq.to_dict("index") if not correction_freq.empty else {},
        "worst_accuracy_items": worst_items,
        "overall_accuracy": float((recent["correction_type"] == "unchanged").mean()),
    }


def get_hard_examples(min_corrections: int = 3) -> list[str]:
    """
    Return plan_ids that had the most corrections — candidates for
    active learning (re-annotate and add to training set).
    """
    if not _csv_path.exists():
        return []

    df = pd.read_csv(_csv_path)
    changed = df[df["correction_type"] != "unchanged"]

    plan_corrections = changed.groupby("plan_id").size().sort_values(ascending=False)
    hard = plan_corrections[plan_corrections >= min_corrections]

    return hard.index.tolist()
