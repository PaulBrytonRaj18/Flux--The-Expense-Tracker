#!/usr/bin/env bash
# ─── Flux — Production Start Script ───────────────────────
# Builds the frontend and starts the unified server.
# Usage: ./start.sh [--port 8000] [--skip-build]

set -euo pipefail

PORT="${PORT:-8000}"
SKIP_BUILD=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Build frontend ────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  echo "Building frontend..."
  cd "$ROOT_DIR/frontend"
  npm install --production=false
  npm run build
  echo "Frontend built → frontend/dist/"
fi

# ── 2. Install Python deps ───────────────────────────────
echo "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
if [ -d "venv" ]; then
  source venv/bin/activate
else
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
fi

# ── 3. Start server ──────────────────────────────────────
echo ""
echo "Starting Flux on http://0.0.0.0:$PORT"
echo "   API docs: http://localhost:$PORT/api/docs (dev only)"
echo ""

export STATIC_DIR="$ROOT_DIR/frontend/dist"
exec gunicorn main:app \
  --bind "0.0.0.0:$PORT" \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --timeout 30 \
  --graceful-timeout 25 \
  --keep-alive 5 \
  --access-logfile - \
  --error-logfile - \
  --log-level info
