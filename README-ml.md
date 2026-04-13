# Kindai Estimating Suite

**AI-native construction estimating platform.**

The Kindai Estimating Suite is a production-ready AI platform designed to read construction floorplans, detect items (doors, windows, power points, etc.), and generate accurate quotes. It uses YOLOv5 for object detection, features an active learning feedback loop, and includes a full monitoring and CI/CD pipeline.

---

## 🏗️ Architecture & Components

This repository implements all 8 core technical requirements:

1. **CI/CD Pipeline** (`.github/workflows/ci.yaml`)
   - Automated linting, testing, and model evaluation on every push.
   - Builds and pushes a production Docker image to GitHub Container Registry.

2. **Inference Logging** (`backend/inference/logger.py`)
   - Structured JSON logging (`inference.jsonl`) capturing user ID, request time, model version, item counts, and latency.

3. **Fine-Tune Model** (`backend/training/fine_tune.py`)
   - PyTorch/Ultralytics pipeline to fine-tune YOLOv5 on custom floorplan images.
   - Supports 25+ construction classes (doors, windows, GPOs, etc.).

4. **Active Learning Feedback** (`backend/inference/feedback.py`)
   - Captures user corrections by diffing AI output against the final submitted quote.
   - Logs deltas to `feedback.csv` to prioritise hard examples for retraining.

5. **Data Augmentation Pipeline** (`backend/training/augment.py`)
   - Uses Albumentations to generate robust training data.
   - Applies bounding-box-safe transforms: rotation, scaling, blur, and contrast adjustments tailored for scanned floorplans.

6. **Scale Calibration** (`backend/utils/scale_calibration.py`)
   - Auto-reads the scale from PDF title blocks using PyMuPDF and Tesseract OCR.
   - Computes pixels-per-meter to allow accurate real-world measurements from the image.

7. **User Interface** (`frontend/public/index.html`)
   - Clean, responsive web interface for uploading plans.
   - Real-time processing status, progress bar, and time estimation via **WebSockets** (with polling fallback).

8. **Model Monitoring Dashboard** (`dashboards/kindai-dashboard.json`)
   - Prometheus metrics exposed at `/metrics` (latency, request counts, error rates, active learning signals).
   - Pre-configured Grafana dashboard for real-time observability.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (if running outside Docker)

### 1. Spin up the stack
The easiest way to run the entire suite (API, Prometheus, Grafana) is via Docker Compose:

```bash
cd docker
docker compose up --build
```

This will start:
- **Kindai API & UI**: [http://localhost:8000](http://localhost:8000)
- **Prometheus**: [http://localhost:9090](http://localhost:9090)
- **Grafana**: [http://localhost:3000](http://localhost:3000) *(User: `admin`, Pass: `kindai2024`)*

### 2. Access the UI
Open your browser to [http://localhost:8000/static/index.html](http://localhost:8000/static/index.html) to use the drag-and-drop interface.

---

## 🧠 Model Training & Data

### Directory Structure
Place your training data in the `data/annotations/` directory:
```text
data/annotations/
├── train/
│   ├── images/   (*.jpg, *.png)
│   └── labels/   (*.txt — YOLO format)
└── val/
    ├── images/
    └── labels/
```

### Data Augmentation
To augment your training set (generates 5 variations per image by default):
```bash
python -m backend.training.augment --input data/annotations/train --output data/augmented/train
```

### Fine-Tuning
To train the YOLOv5 model on your annotated floorplans:
```bash
python -m backend.training.fine_tune --epochs 50 --batch 16
```
The best weights will be saved to `data/models/yolov5_custom.pt`.

---

## 📊 Monitoring & Active Learning

### Grafana Dashboard
The Grafana instance comes pre-provisioned with the **Kindai Model Monitoring** dashboard. It tracks:
- Inference latency (p50, p95, p99)
- Request and error rates
- Total items detected
- User correction frequency (Active Learning signal)
- Scale calibration confidence

### Active Learning Loop
When a user submits a corrected quote via the UI/API, the system diffs the final counts against the AI's original prediction.
- Corrections are appended to `data/feedback/feedback.csv`.
- You can query the hardest plans via the API: `GET /api/v1/feedback/hard-examples`
- Use these plans for the next round of manual annotation and fine-tuning.

---

## 🛠️ API Endpoints

- `POST /api/v1/upload` — Upload a plan and start async inference.
- `GET /ws/jobs/{job_id}` — WebSocket for real-time processing status.
- `GET /api/v1/jobs/{job_id}` — Polling fallback for job status.
- `POST /api/v1/quotes/submit` — Submit final quote and log active learning feedback.
- `POST /api/v1/calibrate` — Standalone PDF scale calibration.
- `GET /metrics` — Prometheus metrics.
- `GET /health` — System health check.

---

*Built for Matthew Symons and the Kindai team.*
