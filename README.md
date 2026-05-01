# Flux — Expense Tracker for Behavioral Change

A production-ready expense tracker with **Supabase Auth** that drives behavioral change through **Emotional ROI**, **Opportunity Cost visualization**, **Ghost Subscription detection**, and a **Safe-to-Spend** gauge. Each user has their own isolated data.

## Features

- 🔐 **Multi-user Auth** — Email/password sign up via Supabase Auth
- 💰 **Safe-to-Spend Gauge** — Know your daily spending limit at a glance
- 💎 **Emotional ROI** — Track joy-per-dollar across categories
- 📈 **Opportunity Cost** — See what your spending could become if invested
- 👻 **Ghost Hunter** — Detect subscriptions with declining satisfaction
- 🎯 **Savings Goals** — Track progress toward financial targets
- 🔒 **Privacy Mode** — Blur sensitive amounts with one tap
- ⚡ **Quick Entry** — Add expenses in 3 taps with behavioral nudges

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite 8, Chart.js, Supabase JS |
| Backend | Python FastAPI, Uvicorn, SQLAlchemy, httpx |
| Database | Supabase (PostgreSQL) + Row Level Security |
| Auth | Supabase Auth (Email/Password) — verified via `/auth/v1/user` |
| Deployment | Docker, single-container |

---

## Quick Start

### Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable **Email Auth**: Authentication → Providers → Email → Enable
3. Run the SQL migration: **SQL Editor** → paste contents of `backend/migrations/001_add_user_auth.sql` → Run

### Development (two servers, hot reload)

```bash
cd Build-With-AI-Event

# Backend config
cp .env.example backend/.env
# Edit backend/.env — set DATABASE_URL and SUPABASE_URL

# Frontend config
cp frontend/.env.example frontend/.env
# Edit frontend/.env — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Install deps
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && npm install

# Start dev servers
./dev.sh
```

### Production (single server)

```bash
./start.sh
```

### Docker

```bash
docker compose up -d
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | Supabase PostgreSQL URI |
| `SUPABASE_URL` | **Yes** | Supabase project URL (for token verification) |
| `PORT` | No (8000) | Server port |
| `CORS_ORIGINS` | No | Allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | **Yes** | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public API key |

### Where to find these values

- **DATABASE_URL**: Settings → Database → Connection string → URI
- **SUPABASE_URL**: Settings → API → Project URL
- **VITE_SUPABASE_URL**: Same as SUPABASE_URL
- **VITE_SUPABASE_ANON_KEY**: Settings → API → Project API keys → `anon` / `public` key

---

## Deploying to GCP Cloud Run (Free Tier)

### 1. Enable APIs

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### 2. Build and push Docker image

```bash
docker build \
  -t gcr.io/YOUR-PROJECT/flux:latest .

docker push gcr.io/YOUR-PROJECT/flux:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy flux \
  --image gcr.io/YOUR-PROJECT/flux:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --max-instances 1 \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},SUPABASE_URL=${SUPABASE_URL}"
```

### 4. Free tier: Compute Engine f1-micro

```bash
# Create VM
gcloud compute instances create flux-server \
  --machine-type=f1-micro \
  --zone=us-central1-a \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --tags=http-server

# Firewall rule
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

Then SSH into the VM, install Docker, and run `docker compose up`.

---

## Project Structure

```
Build-With-AI-Event/
├── backend/
│   ├── main.py              # FastAPI app + static file serving
│   ├── database.py          # SQLAlchemy engine + Supabase connection
│   ├── auth.py              # JWT verification via /auth/v1/user
│   ├── datastore.py         # SQLAlchemy repository (user-scoped)
│   ├── models.py            # SQLAlchemy ORM models (with user_id)
│   ├── schemas.py           # Pydantic request/response models
│   ├── seed.py              # Per-user demo data seeder
│   ├── migrations/
│   │   └── 001_add_user_auth.sql  # RLS policies + user_id columns
│   ├── routers/
│   │   ├── dashboard.py     # Safe-to-spend, category breakdown, trends
│   │   ├── expenses.py      # CRUD + categories
│   │   ├── goals.py         # Savings goals CRUD
│   │   ├── insights.py      # Emotional ROI, opportunity cost, ghost hunter
│   │   └── settings.py      # Financial profile configuration
│   └── services/
│       ├── emotional_roi.py
│       ├── ghost_hunter.py
│       ├── opportunity_cost.py
│       └── safe_to_spend.py
├── frontend/
│   ├── src/
│   │   ├── api/client.ts     # API client (auto-attaches JWT)
│   │   ├── context/AuthContext.tsx  # Auth provider + hooks
│   │   ├── lib/supabase.ts   # Supabase client
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx  # Login/Signup page
│   │   │   ├── Dashboard.tsx
│   │   │   └── ...
│   │   └── components/
│   └── .env.example
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/seed` | **Yes** | Seed demo data for authenticated user |
| GET | `/api/dashboard` | **Yes** | Dashboard data |
| GET/POST | `/api/expenses` | **Yes** | List / Create expenses |
| PUT/DELETE | `/api/expenses/{id}` | **Yes** | Update / Delete expense |
| GET | `/api/expenses/categories` | **Yes** | List categories |
| GET | `/api/insights` | **Yes** | Emotional ROI + Opportunity Cost + Ghosts |
| GET | `/api/insights/opportunity-cost?amount=N` | **Yes** | Opportunity cost for amount |
| GET/PUT | `/api/settings` | **Yes** | Read / Update settings |
| GET/POST | `/api/goals` | **Yes** | List / Create goals |
| PUT/DELETE | `/api/goals/{id}` | **Yes** | Update / Delete goal |
| GET | `/api/docs` | No | Interactive API documentation |

## License

MIT
