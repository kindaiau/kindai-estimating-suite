"""Tests for scale calibration parsing logic."""

from backend.utils.scale_calibration import (
    parse_scale_ratio,
    compute_pixels_per_meter,
    COMMON_SCALES,
)


def test_parse_scale_ratio_explicit():
    factor, conf = parse_scale_ratio("Scale 1:100")
    assert factor == 100.0
    assert conf >= 0.7


def test_parse_scale_ratio_simple():
    factor, conf = parse_scale_ratio("Drawing at 1:50")
    assert factor == 50.0
    assert conf > 0


def test_parse_scale_ratio_with_prefix():
    factor, conf = parse_scale_ratio("SC. 1:200")
    assert factor == 200.0


def test_parse_scale_ratio_no_match():
    factor, conf = parse_scale_ratio("No scale info here")
    assert factor is None
    assert conf == 0.0


def test_compute_pixels_per_meter():
    # At 1:100, 1m real = 10mm on paper
    # At 150 DPI, 10mm = 150 * 10 / 25.4 ≈ 59.06 px
    ppm = compute_pixels_per_meter(100.0, 150)
    assert 58 < ppm < 60


def test_common_scales_are_valid():
    for label, factor in COMMON_SCALES.items():
        assert factor > 0
        assert ":" in label
