# ── Stage 1: Build Frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Production Server ───────────────────────────────
FROM python:3.12-slim AS production

WORKDIR /app

# Install system deps + curl for healthcheck in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

ENV STATIC_DIR=/app/frontend/dist
ENV PYTHONUNBUFFERED=1
ENV ENV=production

# Cloud Run sets PORT to 8080 by default
EXPOSE 8080

# Gunicorn with Uvicorn workers — production-grade async workers
# --workers 2: balances concurrency with Cloud Run memory limits (512MB-2GB)
# --timeout 30: handles slow DB queries without hanging
# --keep-alive 5: connection reuse for better latency
# --graceful-timeout 25: allows in-flight requests to finish on shutdown
CMD ["sh", "-c", "cd /app/backend && gunicorn main:app \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 30 \
    --graceful-timeout 25 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level info"]
