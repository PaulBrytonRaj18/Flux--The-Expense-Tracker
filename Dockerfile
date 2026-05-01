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
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Remove build-only deps (gcc)
RUN apt-get purge -y gcc && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

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

# Cloud Run sets PORT to 8080 by default; this lets it override
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

EXPOSE 8080

CMD ["sh", "-c", "cd /app/backend && python -m uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 4"]
