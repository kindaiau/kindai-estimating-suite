# =============================================================================
# Kindai Estimating Suite — Production Dockerfile
# =============================================================================
# Multi-stage build: slim final image with only runtime deps.
# =============================================================================

# --- Stage 1: Builder --------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /build

# System deps for OpenCV, PyMuPDF, Tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Runtime --------------------------------------------------------
FROM python:3.11-slim AS runtime

LABEL maintainer="matt@kindai.com.au"
LABEL org.opencontainers.image.source="https://github.com/kindai-au/kindai-estimating-suite"

WORKDIR /app

# Runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/ backend/
COPY scripts/ scripts/
COPY data/models/ data/models/
COPY frontend/public/ frontend/public/

# Create non-root user
RUN groupadd -r kindai && useradd -r -g kindai kindai \
    && mkdir -p /app/logs /app/data/feedback \
    && chown -R kindai:kindai /app

USER kindai

# Expose API + Prometheus metrics
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

# Start the API server
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
