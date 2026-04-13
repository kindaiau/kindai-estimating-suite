#!/usr/bin/env python3
"""
Kindai Estimating Suite — Scale Calibration
============================================
Auto-reads the scale from a PDF title block using OCR and known
dimension patterns. Computes pixels-per-meter for accurate
real-world measurements from floorplan images.

Workflow:
    1. Extract the title block region from the PDF (typically bottom-right)
    2. OCR the title block text
    3. Parse scale notation (e.g. "1:100", "Scale 1:50", "10m")
    4. If a known reference dimension is found, compute px/m
    5. Fall back to common construction scales if OCR fails

Usage:
    from backend.utils.scale_calibration import calibrate_scale

    result = calibrate_scale("path/to/floorplan.pdf")
    print(result.pixels_per_meter)
    print(result.scale_ratio)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

from backend.config import settings


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ScaleResult:
    """Result of scale calibration."""
    scale_ratio: str          # e.g. "1:100"
    scale_factor: float       # e.g. 100.0 (1 unit on plan = 100 units real)
    pixels_per_meter: float   # computed px/m at the rendered DPI
    dpi: int                  # rendering DPI used
    confidence: float         # 0.0–1.0 confidence in the detected scale
    method: str               # "ocr_ratio", "ocr_dimension", "default"
    raw_text: str             # OCR text from title block
    title_block_bbox: list[float] = field(default_factory=list)

    def meters_to_pixels(self, meters: float) -> float:
        return meters * self.pixels_per_meter

    def pixels_to_meters(self, pixels: float) -> float:
        if self.pixels_per_meter == 0:
            return 0.0
        return pixels / self.pixels_per_meter

    def to_dict(self) -> dict[str, Any]:
        return {
            "scale_ratio": self.scale_ratio,
            "scale_factor": self.scale_factor,
            "pixels_per_meter": round(self.pixels_per_meter, 2),
            "dpi": self.dpi,
            "confidence": round(self.confidence, 3),
            "method": self.method,
        }


# ---------------------------------------------------------------------------
# Common construction scales (fallback)
# ---------------------------------------------------------------------------
COMMON_SCALES = {
    "1:50": 50.0,
    "1:100": 100.0,
    "1:200": 200.0,
    "1:500": 500.0,
    "1:20": 20.0,
    "1:25": 25.0,
    "1:75": 75.0,
    "1:150": 150.0,
    "1:250": 250.0,
}

# Regex patterns for scale detection
SCALE_RATIO_PATTERN = re.compile(
    r"(?:scale|sc\.?|@)\s*[:\-]?\s*1\s*[:\-]\s*(\d+)",
    re.IGNORECASE,
)
SCALE_SIMPLE_PATTERN = re.compile(
    r"1\s*:\s*(\d+)",
)
DIMENSION_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(m|mm|cm|metres?|meters?)\b",
    re.IGNORECASE,
)
SCALE_BAR_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\s*(?:scale\s*bar)?",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# PDF → Image rendering
# ---------------------------------------------------------------------------

def render_pdf_page(pdf_path: str | Path, page_num: int = 0, dpi: int = 150) -> np.ndarray:
    """Render a PDF page to a numpy array at the given DPI."""
    doc = fitz.open(str(pdf_path))
    page = doc[page_num]
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    if pix.n == 4:  # RGBA → RGB
        img = img[:, :, :3]
    doc.close()
    return img


def extract_title_block_region(
    image: np.ndarray,
    position: str = "bottom-right",
    width_frac: float = 0.35,
    height_frac: float = 0.25,
) -> tuple[np.ndarray, list[float]]:
    """
    Crop the title block region from a floorplan image.

    Most Australian construction plans have the title block in the
    bottom-right corner, occupying roughly 35% width × 25% height.
    """
    h, w = image.shape[:2]

    if position == "bottom-right":
        x1 = int(w * (1 - width_frac))
        y1 = int(h * (1 - height_frac))
        x2, y2 = w, h
    elif position == "bottom-left":
        x1, y1 = 0, int(h * (1 - height_frac))
        x2 = int(w * width_frac)
        y2 = h
    elif position == "top-right":
        x1 = int(w * (1 - width_frac))
        y1 = 0
        x2, y2 = w, int(h * height_frac)
    else:
        # Full bottom strip
        x1, y1 = 0, int(h * (1 - height_frac))
        x2, y2 = w, h

    crop = image[y1:y2, x1:x2]
    bbox = [float(x1), float(y1), float(x2), float(y2)]
    return crop, bbox


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

def ocr_image(image: np.ndarray) -> str:
    """Run Tesseract OCR on a numpy image array."""
    try:
        import pytesseract
        pil_img = Image.fromarray(image)
        text = pytesseract.image_to_string(
            pil_img,
            lang=settings.ocr_language,
            config="--psm 6",  # assume uniform block of text
        )
        return text.strip()
    except Exception as exc:
        print(f"[scale_cal] OCR failed: {exc}")
        return ""


def extract_text_pymupdf(pdf_path: str | Path, page_num: int = 0) -> str:
    """Extract embedded text from PDF (faster than OCR if text is embedded)."""
    doc = fitz.open(str(pdf_path))
    page = doc[page_num]
    text = page.get_text("text")
    doc.close()
    return text.strip()


# ---------------------------------------------------------------------------
# Scale parsing
# ---------------------------------------------------------------------------

def parse_scale_ratio(text: str) -> tuple[float | None, float]:
    """
    Try to find a scale ratio like "1:100" in the text.
    Returns (scale_factor, confidence).
    """
    # Try explicit "Scale 1:100" pattern first
    match = SCALE_RATIO_PATTERN.search(text)
    if match:
        factor = float(match.group(1))
        if 10 <= factor <= 1000:
            return factor, 0.9

    # Try simple "1:100" pattern
    match = SCALE_SIMPLE_PATTERN.search(text)
    if match:
        factor = float(match.group(1))
        if 10 <= factor <= 1000:
            return factor, 0.75

    return None, 0.0


def parse_dimension_reference(
    text: str,
    image_width_px: int,
) -> tuple[float | None, float]:
    """
    Try to find a known dimension like "10m" and estimate scale.
    This is less reliable but useful as a secondary signal.
    """
    matches = DIMENSION_PATTERN.findall(text)
    if not matches:
        return None, 0.0

    for value_str, unit in matches:
        value = float(value_str)
        # Convert to meters
        if unit.lower() in ("mm",):
            value /= 1000
        elif unit.lower() in ("cm",):
            value /= 100

        # Skip unreasonable dimensions
        if value < 0.5 or value > 200:
            continue

        # Rough heuristic: assume the dimension spans ~60% of the page width
        # This is very approximate — scale ratio is much more reliable
        estimated_px_per_m = (image_width_px * 0.6) / value
        return estimated_px_per_m, 0.4

    return None, 0.0


def compute_pixels_per_meter(scale_factor: float, dpi: int) -> float:
    """
    Convert a scale ratio to pixels-per-meter at a given DPI.

    At 1:100 scale, 1 meter real = 10mm on paper.
    At 150 DPI, 10mm = 150 * 10 / 25.4 ≈ 59.06 pixels.
    """
    mm_on_paper = 1000.0 / scale_factor  # 1m real → mm on paper
    pixels = mm_on_paper * dpi / 25.4    # mm → pixels at given DPI
    return pixels


# ---------------------------------------------------------------------------
# Main calibration function
# ---------------------------------------------------------------------------

def calibrate_scale(
    pdf_path: str | Path,
    page_num: int = 0,
    dpi: int = 150,
    title_block_position: str = "bottom-right",
) -> ScaleResult:
    """
    Auto-calibrate the scale of a construction PDF floorplan.

    Strategy:
        1. Try embedded PDF text first (fast)
        2. Fall back to OCR on the title block region
        3. Parse scale ratio (1:100) or dimension reference (10m)
        4. Fall back to default scale if nothing found

    Parameters
    ----------
    pdf_path : path to the PDF floorplan
    page_num : which page to analyse (0-indexed)
    dpi : rendering DPI for pixel calculations
    title_block_position : where to look for the title block

    Returns
    -------
    ScaleResult with all calibration data.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    # --- Step 1: Try embedded text ---
    embedded_text = extract_text_pymupdf(pdf_path, page_num)
    scale_factor, confidence = parse_scale_ratio(embedded_text)

    if scale_factor and confidence >= 0.7:
        ppm = compute_pixels_per_meter(scale_factor, dpi)
        return ScaleResult(
            scale_ratio=f"1:{int(scale_factor)}",
            scale_factor=scale_factor,
            pixels_per_meter=ppm,
            dpi=dpi,
            confidence=confidence,
            method="embedded_text_ratio",
            raw_text=embedded_text[:500],
        )

    # --- Step 2: Render and OCR the title block ---
    full_image = render_pdf_page(pdf_path, page_num, dpi)
    title_block, bbox = extract_title_block_region(
        full_image, position=title_block_position
    )
    ocr_text = ocr_image(title_block)

    # Combine embedded + OCR text for parsing
    combined_text = f"{embedded_text}\n{ocr_text}"

    # --- Step 3: Parse scale ratio ---
    scale_factor, confidence = parse_scale_ratio(combined_text)
    if scale_factor and confidence >= 0.5:
        ppm = compute_pixels_per_meter(scale_factor, dpi)
        return ScaleResult(
            scale_ratio=f"1:{int(scale_factor)}",
            scale_factor=scale_factor,
            pixels_per_meter=ppm,
            dpi=dpi,
            confidence=confidence,
            method="ocr_ratio",
            raw_text=combined_text[:500],
            title_block_bbox=bbox,
        )

    # --- Step 4: Try dimension reference ---
    ppm_from_dim, dim_confidence = parse_dimension_reference(
        combined_text, full_image.shape[1]
    )
    if ppm_from_dim and dim_confidence > 0:
        # Reverse-engineer the scale factor
        approx_factor = 1000.0 / (ppm_from_dim * 25.4 / dpi)
        # Snap to nearest common scale
        best_scale = min(COMMON_SCALES.items(), key=lambda kv: abs(kv[1] - approx_factor))
        return ScaleResult(
            scale_ratio=best_scale[0],
            scale_factor=best_scale[1],
            pixels_per_meter=compute_pixels_per_meter(best_scale[1], dpi),
            dpi=dpi,
            confidence=dim_confidence,
            method="ocr_dimension",
            raw_text=combined_text[:500],
            title_block_bbox=bbox,
        )

    # --- Step 5: Default fallback ---
    default_text = settings.default_scale_text
    default_factor = float(default_text.split(":")[1]) if ":" in default_text else 100.0
    ppm = compute_pixels_per_meter(default_factor, dpi)

    return ScaleResult(
        scale_ratio=default_text,
        scale_factor=default_factor,
        pixels_per_meter=ppm,
        dpi=dpi,
        confidence=0.1,
        method="default",
        raw_text=combined_text[:500] if combined_text.strip() else "(no text found)",
        title_block_bbox=bbox,
    )


# ---------------------------------------------------------------------------
# Batch calibration
# ---------------------------------------------------------------------------

def calibrate_batch(
    pdf_dir: str | Path,
    dpi: int = 150,
) -> list[dict[str, Any]]:
    """Calibrate all PDFs in a directory."""
    pdf_dir = Path(pdf_dir)
    results = []

    for pdf_path in sorted(pdf_dir.glob("*.pdf")):
        try:
            result = calibrate_scale(pdf_path, dpi=dpi)
            results.append({
                "file": pdf_path.name,
                **result.to_dict(),
            })
        except Exception as exc:
            results.append({
                "file": pdf_path.name,
                "error": str(exc),
            })

    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Kindai scale calibration")
    parser.add_argument("pdf", type=str, help="Path to PDF floorplan")
    parser.add_argument("--page", type=int, default=0, help="Page number (0-indexed)")
    parser.add_argument("--dpi", type=int, default=150, help="Rendering DPI")
    parser.add_argument("--position", type=str, default="bottom-right",
                        choices=["bottom-right", "bottom-left", "top-right", "bottom-strip"],
                        help="Title block position")
    args = parser.parse_args()

    result = calibrate_scale(args.pdf, args.page, args.dpi, args.position)
    print(json.dumps(result.to_dict(), indent=2))
    print(f"\nRaw OCR text:\n{result.raw_text[:300]}")
