#!/usr/bin/env bash
# ─── Flux — Development Start Script ─────────────────────
# Starts both backend and frontend dev servers concurrently.
# Usage: ./dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# ── Backend ──────────────────────────────────────────────
echo -e "${CYAN}🐍 Starting backend on :8000${NC}"
cd "$ROOT_DIR/backend"
if [ -d "venv" ]; then
  source venv/bin/activate
fi
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────
echo -e "${MAGENTA}⚡ Starting frontend on :5173${NC}"
cd "$ROOT_DIR/frontend"
npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}Flux${NC} development servers running"
echo -e "  Frontend: ${MAGENTA}http://localhost:5173${NC}"
echo -e "  Backend:  ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs: ${CYAN}http://localhost:8000/api/docs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

wait
