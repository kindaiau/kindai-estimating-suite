#!/usr/bin/env python3
"""
Kindai Estimating Suite — Data Augmentation Pipeline
=====================================================
Augments floorplan training images using Albumentations with
bounding-box-safe transforms. Generates multiple augmented copies
per original image while preserving YOLO-format annotations.

Usage:
    python -m backend.training.augment                              # defaults
    python -m backend.training.augment --input data/annotations/train --copies 10
    python -m backend.training.augment --preview                    # show one sample

Data layout:
    input_dir/
    ├── images/  (*.jpg, *.png)
    └── labels/  (*.txt — YOLO format: class x_center y_center w h)

Output:
    output_dir/
    ├── images/  (original + augmented)
    └── labels/  (matching labels)
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import albumentations as A
import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from backend.config import settings, ANNOTATIONS_DIR, AUGMENTED_DIR


# ---------------------------------------------------------------------------
# Augmentation transforms — tuned for construction floorplans
# ---------------------------------------------------------------------------

def get_train_transforms(img_size: int = 640) -> A.Compose:
    """
    Returns an Albumentations pipeline with bounding-box-aware transforms.

    Design rationale for floorplans:
    - Rotation: ±15° — plans can be scanned at slight angles
    - Scale: 0.8–1.2 — simulate different print sizes
    - Blur: Gaussian + Motion — simulate scan quality
    - Brightness/Contrast: simulate different paper/lighting
    - CLAHE: enhance faded prints
    - NO vertical flip (floorplans have orientation)
    - Horizontal flip OK (mirror image of a plan is valid)
    """
    return A.Compose(
        [
            # Geometric
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=15, border_mode=cv2.BORDER_CONSTANT, value=(255, 255, 255), p=0.6),
            A.Affine(
                scale=(0.8, 1.2),
                translate_percent={"x": (-0.1, 0.1), "y": (-0.1, 0.1)},
                shear=(-5, 5),
                mode=cv2.BORDER_CONSTANT,
                cval=(255, 255, 255),
                p=0.5,
            ),
            A.Perspective(scale=(0.02, 0.06), p=0.3),

            # Pixel-level (simulate scan quality)
            A.OneOf(
                [
                    A.GaussianBlur(blur_limit=(3, 7), p=1.0),
                    A.MotionBlur(blur_limit=(3, 7), p=1.0),
                    A.MedianBlur(blur_limit=5, p=1.0),
                ],
                p=0.4,
            ),
            A.OneOf(
                [
                    A.GaussNoise(var_limit=(10.0, 50.0), p=1.0),
                    A.ISONoise(p=1.0),
                ],
                p=0.3,
            ),

            # Colour / brightness
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
            A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=0.3),
            A.HueSaturationValue(hue_shift_limit=5, sat_shift_limit=20, val_shift_limit=20, p=0.3),

            # Simulate partial occlusion (coffee stains, folds)
            A.CoarseDropout(
                max_holes=4,
                max_height=int(img_size * 0.05),
                max_width=int(img_size * 0.05),
                fill_value=200,
                p=0.2,
            ),

            # Final resize
            A.LongestMaxSize(max_size=img_size),
            A.PadIfNeeded(
                min_height=img_size,
                min_width=img_size,
                border_mode=cv2.BORDER_CONSTANT,
                value=(255, 255, 255),
            ),
        ],
        bbox_params=A.BboxParams(
            format="yolo",
            label_fields=["class_labels"],
            min_area=100,           # drop tiny boxes after transform
            min_visibility=0.3,     # drop heavily occluded boxes
        ),
    )


def get_val_transforms(img_size: int = 640) -> A.Compose:
    """Minimal transforms for validation — just resize + pad."""
    return A.Compose(
        [
            A.LongestMaxSize(max_size=img_size),
            A.PadIfNeeded(
                min_height=img_size,
                min_width=img_size,
                border_mode=cv2.BORDER_CONSTANT,
                value=(255, 255, 255),
            ),
        ],
        bbox_params=A.BboxParams(
            format="yolo",
            label_fields=["class_labels"],
        ),
    )


# ---------------------------------------------------------------------------
# YOLO label I/O
# ---------------------------------------------------------------------------

def read_yolo_labels(label_path: Path) -> tuple[list[list[float]], list[int]]:
    """Read YOLO-format label file → (bboxes, class_ids)."""
    bboxes: list[list[float]] = []
    class_ids: list[int] = []

    if not label_path.exists():
        return bboxes, class_ids

    for line in label_path.read_text().strip().splitlines():
        parts = line.strip().split()
        if len(parts) != 5:
            continue
        cls = int(parts[0])
        bbox = [float(x) for x in parts[1:]]
        # Clamp to [0, 1]
        bbox = [max(0.0, min(1.0, v)) for v in bbox]
        # Skip degenerate boxes
        if bbox[2] > 0.001 and bbox[3] > 0.001:
            bboxes.append(bbox)
            class_ids.append(cls)

    return bboxes, class_ids


def write_yolo_labels(label_path: Path, bboxes: list, class_ids: list[int]) -> None:
    """Write YOLO-format label file."""
    lines = []
    for bbox, cls in zip(bboxes, class_ids):
        x, y, w, h = bbox
        lines.append(f"{cls} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
    label_path.write_text("\n".join(lines) + "\n" if lines else "")


# ---------------------------------------------------------------------------
# Main augmentation loop
# ---------------------------------------------------------------------------

def augment_dataset(
    input_dir: Path,
    output_dir: Path,
    copies: int = 5,
    img_size: int = 640,
) -> dict:
    """
    Augment all images in input_dir, write to output_dir.

    Returns stats dict.
    """
    img_dir = input_dir / "images"
    lbl_dir = input_dir / "labels"
    out_img_dir = output_dir / "images"
    out_lbl_dir = output_dir / "labels"

    out_img_dir.mkdir(parents=True, exist_ok=True)
    out_lbl_dir.mkdir(parents=True, exist_ok=True)

    image_files = sorted(list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.png")))
    if not image_files:
        print(f"[augment] No images found in {img_dir}")
        return {"images_found": 0, "augmented": 0}

    transform = get_train_transforms(img_size)

    stats = {
        "images_found": len(image_files),
        "copies_per_image": copies,
        "augmented": 0,
        "skipped_empty": 0,
        "bbox_dropped": 0,
    }

    print(f"[augment] Processing {len(image_files)} images × {copies} copies...")

    for img_path in image_files:
        stem = img_path.stem
        suffix = img_path.suffix

        # Read image
        image = cv2.imread(str(img_path))
        if image is None:
            print(f"[augment] WARNING: Could not read {img_path}")
            continue
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Read labels
        label_path = lbl_dir / f"{stem}.txt"
        bboxes, class_ids = read_yolo_labels(label_path)

        # Copy original (resized)
        shutil.copy2(img_path, out_img_dir / f"{stem}{suffix}")
        if label_path.exists():
            shutil.copy2(label_path, out_lbl_dir / f"{stem}.txt")

        # Generate augmented copies
        for c in range(copies):
            try:
                result = transform(
                    image=image,
                    bboxes=bboxes,
                    class_labels=class_ids,
                )
                aug_image = result["image"]
                aug_bboxes = result["bboxes"]
                aug_classes = result["class_labels"]

                if len(aug_bboxes) == 0 and len(bboxes) > 0:
                    stats["skipped_empty"] += 1
                    continue

                bbox_diff = len(bboxes) - len(aug_bboxes)
                if bbox_diff > 0:
                    stats["bbox_dropped"] += bbox_diff

                # Save augmented image
                aug_name = f"{stem}_aug{c:03d}"
                aug_img_bgr = cv2.cvtColor(aug_image, cv2.COLOR_RGB2BGR)
                cv2.imwrite(str(out_img_dir / f"{aug_name}{suffix}"), aug_img_bgr)

                # Save augmented labels
                write_yolo_labels(
                    out_lbl_dir / f"{aug_name}.txt",
                    aug_bboxes,
                    aug_classes,
                )
                stats["augmented"] += 1

            except Exception as exc:
                print(f"[augment] WARNING: Failed on {stem} copy {c}: {exc}")
                continue

    total = stats["images_found"] + stats["augmented"]
    print(f"[augment] Done — {total} total images ({stats['augmented']} augmented)")
    if stats["bbox_dropped"] > 0:
        print(f"[augment] Note: {stats['bbox_dropped']} bounding boxes dropped (too small/occluded after transform)")

    return stats


def preview_augmentation(input_dir: Path, img_size: int = 640) -> None:
    """Show a side-by-side preview of original vs augmented (requires display)."""
    img_dir = input_dir / "images"
    lbl_dir = input_dir / "labels"
    image_files = sorted(list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.png")))

    if not image_files:
        print("[augment] No images to preview")
        return

    img_path = image_files[0]
    image = cv2.imread(str(img_path))
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    label_path = lbl_dir / f"{img_path.stem}.txt"
    bboxes, class_ids = read_yolo_labels(label_path)

    transform = get_train_transforms(img_size)
    result = transform(image=image, bboxes=bboxes, class_labels=class_ids)

    # Draw bboxes on both
    def draw_boxes(img, boxes, h, w):
        for bbox in boxes:
            cx, cy, bw, bh = bbox
            x1 = int((cx - bw / 2) * w)
            y1 = int((cy - bh / 2) * h)
            x2 = int((cx + bw / 2) * w)
            y2 = int((cy + bh / 2) * h)
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        return img

    h, w = image.shape[:2]
    orig_drawn = draw_boxes(image.copy(), bboxes, h, w)
    aug_h, aug_w = result["image"].shape[:2]
    aug_drawn = draw_boxes(result["image"].copy(), result["bboxes"], aug_h, aug_w)

    # Save preview
    preview_path = input_dir / "augmentation_preview.jpg"
    combined = np.hstack([
        cv2.resize(orig_drawn, (img_size, img_size)),
        cv2.resize(aug_drawn, (img_size, img_size)),
    ])
    cv2.imwrite(str(preview_path), cv2.cvtColor(combined, cv2.COLOR_RGB2BGR))
    print(f"[augment] Preview saved → {preview_path}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Kindai data augmentation pipeline")
    parser.add_argument("--input", type=str, default=str(ANNOTATIONS_DIR / "train"),
                        help="Input directory with images/ and labels/")
    parser.add_argument("--output", type=str, default=str(AUGMENTED_DIR / "train"),
                        help="Output directory")
    parser.add_argument("--copies", type=int, default=settings.augment_count,
                        help="Augmented copies per image")
    parser.add_argument("--img-size", type=int, default=settings.train_img_size,
                        help="Target image size")
    parser.add_argument("--preview", action="store_true",
                        help="Generate a visual preview instead of full augmentation")
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    if args.preview:
        preview_augmentation(input_dir, args.img_size)
    else:
        stats = augment_dataset(input_dir, output_dir, args.copies, args.img_size)
        print(f"\n[augment] Stats: {stats}")


if __name__ == "__main__":
    main()
