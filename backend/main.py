import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Depends
from dotenv import load_dotenv

from routers import expenses, dashboard, insights, settings, goals
from database import init_db
from auth import require_auth
from seed import seed_user_data

load_dotenv()

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
)
logger = logging.getLogger("flux")

STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).parent.parent / "frontend" / "dist"))
ENV = os.getenv("ENV", "production")
IS_PRODUCTION = ENV == "production"


# ── Security Headers Middleware ──────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api") else "public, max-age=31536000, immutable"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


# ── Request Logging Middleware ──────────────────────────────
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"{request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"{request.method} {request.url.path} -> {response.status_code}")
        return response


# ── App Lifespan ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialized")
    yield
    from auth import _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        logger.info("HTTP client closed")


# ── App Creation ─────────────────────────────────────────────
app = FastAPI(
    title="Flux — Expense Tracker",
    description="Behavioral change through Emotional ROI and Opportunity Cost visualization",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if not IS_PRODUCTION else None,
    redoc_url="/api/redoc" if not IS_PRODUCTION else None,
    openapi_url="/api/openapi.json" if not IS_PRODUCTION else None,
)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    max_age=600,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(settings.router)
app.include_router(goals.router)


# ── Global Exception Handler ────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Health Check ─────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Flux", "version": "1.0.0"}


@app.get("/api/ready")
def readiness():
    """K8s/Cloud Run readiness probe."""
    return {"status": "ready"}


# ── Seed Endpoint ───────────────────────────────────────────
@app.post("/api/auth/seed", tags=["auth"])
async def seed_data(user_id: str = Depends(require_auth)):
    seeded = seed_user_data(user_id)
    if seeded:
        return {"ok": True, "message": "Demo data seeded"}
    return {"ok": True, "message": "Already seeded"}


# ── Static File Serving (SPA) ───────────────────────────────
if STATIC_DIR.exists() and STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
