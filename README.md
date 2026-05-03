# Flux — Expense Tracker for Behavioral Change

> Traditional expense trackers log transactions. Flux changes behavior.

Flux is a behavioral finance application designed to transform how people think about spending. Instead of showing pie charts and balance totals, it answers deeper questions:

- **Is this purchase actually making my life better?**
- **What am I giving up by making it?**

By combining satisfaction tracking, compound investment projections, and recurring-subscription analysis, Flux nudges users toward mindful spending through data-driven insights rather than guilt.

---

## Philosophy

> Spending awareness alone does not change behavior — *emotional awareness* does.

Every expense in Flux carries a **satisfaction score (1–5)**. This single data point powers every unique feature:

| Feature | What It Does |
|---------|-------------|
| **Emotional ROI** | Measures joy-per-dollar per category. High-ROI categories deserve continued investment; low-ROI ones are candidates for reduction. |
| **Ghost Hunter** | Detects "ghost subscriptions" — recurring expenses with declining satisfaction — and recommends cancellations with projected annual savings. |
| **Opportunity Cost** | Uses compound interest to reframe every spending decision: *"This $60 could become $516 in 32 years. Still proceed?"* |
| **Safe-to-Spend** | Real-time daily budget = Balance − Bills − Goals − Month Spent. Color-coded health: green, amber, red. |

---

## Features

- **Supabase Auth** — Email/password sign-up and sign-in, multi-user isolation
- **Auto-seeded demo data** — 90 days of realistic expenses, subscriptions, goals, and settings populated on first login
- **Safe-to-Spend dashboard** — Daily/weekly disposable budgets with trend charts and category breakdowns
- **Expense CRUD** — Full create, read, update, delete with categories, satisfaction scores, and recurring payment tracking
- **Ghost subscription detection** — Analyzes satisfaction trends to flag wasting subscriptions
- **Emotional ROI** — Ranks categories by joy-per-dollar
- **Opportunity cost calculator** — Compound interest projections based on age and retirement targets
- **Savings goals** — Track targets with progress, deadlines, and icons
- **Privacy mode** — One-tap toggle that masks all dollar amounts across the app
- **Quick entry** — Floating action button for 3-tap expense logging from any screen
- **Dark neon UI** — Cyan/magenta accents, smooth transitions, mobile-first design
- **Swagger API docs** — Interactive documentation at `/api/docs`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Chart.js, Supabase JS SDK |
| Backend | Python FastAPI, Uvicorn, SQLAlchemy, httpx, Pydantic |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (Email/Password) |
| API Docs | Swagger UI (`/api/docs`) |

---

## Architecture

### Authentication Flow

```
User signs in (frontend) → Supabase Auth → Session + access_token
Every API request → Bearer token in Authorization header
Backend → Validates token against Supabase /auth/v1/user (with anon key)
Returns user_id → All queries scoped to that user_id
```

### Multi-Tenancy

Every database record carries a `user_id` string. Auth integrity is enforced at the API layer via the `require_auth` middleware — no database-level foreign keys to Supabase's `auth` schema.

### Project Structure

```
Build-With-AI-Event/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, static file serving, routes
│   ├── database.py              # SQLAlchemy engine + session factory
│   ├── auth.py                  # JWT verification via Supabase /auth/v1/user
│   ├── datastore.py             # SQLAlchemy repository helpers (user-scoped)
│   ├── models.py                # ORM models: Category, Expense, Goal, Settings
│   ├── schemas.py               # Pydantic request/response models
│   ├── seed.py                  # Per-user demo data seeder (90-day history)
│   ├── routers/
│   │   ├── dashboard.py         # Safe-to-spend, summary, trends, ghost alerts
│   │   ├── expenses.py          # Expense CRUD + categories
│   │   ├── goals.py             # Savings goals CRUD
│   │   ├── insights.py          # Emotional ROI, opportunity cost, ghosts
│   │   └── settings.py          # Financial profile read/update
│   └── services/
│       ├── safe_to_spend.py     # Disposable income + daily/weekly budget calc
│       ├── emotional_roi.py     # Joy-per-dollar by category
│       ├── ghost_hunter.py      # Declining-satisfaction subscription detector
│       └── opportunity_cost.py  # Compound interest projection
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Router, layout, privacy mode, quick entry
│   │   ├── api/client.ts        # Centralized API client (auto-attaches JWT)
│   │   ├── context/AuthContext.tsx  # Auth provider + hooks
│   │   ├── lib/supabase.ts      # Supabase client singleton
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx     # Login / Sign-up form
│   │   │   ├── Dashboard.tsx    # Safe-to-spend, charts, ghost alerts
│   │   │   ├── Expenses.tsx     # Expense list with filters
│   │   │   ├── Goals.tsx        # Savings goal cards with progress
│   │   │   ├── Insights.tsx     # Emotional ROI + opportunity cost detail
│   │   │   └── Settings.tsx     # Financial profile configuration
│   │   └── components/
│   │       ├── Navigation.tsx   # Bottom tab navigation
│   │       ├── PrivacyShield.tsx # Privacy mode toggle
│   │       ├── QuickEntry.tsx   # Modal for rapid expense logging
│   │       └── Toast.tsx        # Notification system
│   └── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Data Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **Category** | `id`, `user_id`, `name`, `icon`, `color`, `budget_limit` | Classifies expenses |
| **Expense** | `id`, `user_id`, `amount`, `category_id`, `description`, `date`, `satisfaction_score`, `is_recurring`, `recurring_id` | Tracks every spending event |
| **Goal** | `id`, `user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `icon` | Savings targets |
| **Settings** | `id`, `user_id`, `balance`, `committed_bills`, `goal_savings`, `privacy_mode`, `investment_rate`, `user_age`, `retirement_age` | User financial profile |

---

## Core Algorithms

### Safe-to-Spend

```
remaining = balance - committed_bills - goal_savings - month_spent
daily     = remaining / days_left_in_month
weekly    = daily × 7

Healthy (>50%)  → Green
Caution (20-50%) → Amber
Danger  (<20%)   → Red
```

### Emotional ROI

```
For each category:
  avg_satisfaction = sum(scores) / count
  joy_per_dollar   = avg_satisfaction / (total_spent / 100)
  → Ranked highest to lowest
```

### Ghost Hunter

```
For each recurring_id with ≥2 payments:
  Get last 3 satisfaction scores
  If scores are monotonically declining:
    Flag as ghost subscription
    Report annual_cost = monthly × 12
```

### Opportunity Cost

```
FV = PV × (1 + r)^n
  PV = spending amount
  r  = annual investment rate (default 7%)
  n  = retirement_age - user_age

→ "This $60 could become $516 in 32 years. Still proceed?"
```

---

## Seed Data (Demo Mode)

On first login, the backend auto-seeds:

| Type | Details |
|------|---------|
| **Categories** | 8 categories: Food & Dining, Transport, Entertainment, Shopping, Subscriptions, Health, Education, Groceries |
| **Expenses** | ~180 expenses over 90 days (1–3/day), drawn from 21 templates with randomized amounts and satisfaction scores |
| **Subscriptions** | 5 recurring: Netflix ($15.99), Spotify ($9.99), Cloud Storage ($2.99), Gym App Pro ($12.99), News App ($9.99) — each with 6 months of payment history and satisfaction trends |
| **Goals** | Emergency Fund ($10k), Japan Trip ($5k), New Laptop ($2k) |
| **Settings** | $5,200 balance, $1,350 committed bills, $500 goal savings, 7% investment rate, age 28, retirement age 60 |

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
# Edit backend/.env — set DATABASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY

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

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | Supabase PostgreSQL URI (`postgresql://...`) |
| `SUPABASE_URL` | **Yes** | — | Supabase project URL (for token verification) |
| `SUPABASE_ANON_KEY` | **Yes** | — | Supabase anon/public key (required for `/auth/v1/user`) |
| `PORT` | No | `8000` | Server port |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |

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

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/seed` | **Yes** | Seed demo data for authenticated user |
| `GET` | `/api/dashboard` | **Yes** | Safe-to-spend, summary, trends, ghost alerts |
| `GET` | `/api/expenses` | **Yes** | List expenses (`?regret=true`, `?category_id=N`, `?search=...`) |
| `POST` | `/api/expenses` | **Yes** | Create expense |
| `PUT` | `/api/expenses/{id}` | **Yes** | Update expense |
| `DELETE` | `/api/expenses/{id}` | **Yes** | Delete expense |
| `GET` | `/api/expenses/categories` | **Yes** | List categories |
| `GET` | `/api/insights` | **Yes** | Emotional ROI + opportunity costs + ghost subscriptions |
| `GET` | `/api/insights/opportunity-cost?amount=N` | **Yes** | Calculate opportunity cost for a specific amount |
| `GET` | `/api/settings` | **Yes** | Get user settings |
| `PUT` | `/api/settings` | **Yes** | Update user settings |
| `GET` | `/api/goals` | **Yes** | List goals |
| `POST` | `/api/goals` | **Yes** | Create goal |
| `PUT` | `/api/goals/{id}` | **Yes** | Update goal |
| `DELETE` | `/api/goals/{id}` | **Yes** | Delete goal |
| `GET` | `/api/docs` | No | Interactive Swagger API documentation |

---

## Deploying to GCP Cloud Run (Free Tier)

### 1. Enable APIs

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### 2. Build and push Docker image

```bash
docker build -t gcr.io/YOUR-PROJECT/flux:latest .
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
  --set-env-vars="DATABASE_URL=${DATABASE_URL},SUPABASE_URL=${SUPABASE_URL},SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}"
```

### 4. Alternative: Compute Engine f1-micro

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

Then SSH into the VM, install Docker, copy the project, configure `.env` files, and run `docker compose up`.

---

## Frontend Pages

| Page | Tab | Content |
|------|-----|---------|
| **Auth** | `/` (unauthenticated) | Login / Sign-up form with Supabase |
| **Dashboard** | Dashboard | Safe-to-spend gauge, spending summary, category breakdown, trend chart, ghost alerts |
| **Expenses** | Expenses | Full expense list with category filter, search, regret filter, add/edit/delete |
| **Goals** | Goals | Savings goal cards with progress bars and deadlines |
| **Insights** | Insights | Emotional ROI rankings, opportunity cost projections, ghost subscription details |
| **Settings** | Settings | Balance, bills, goal savings, investment rate, age, retirement age, privacy mode |

---

## What Makes Flux Different

1. **Emotional ROI** — No other tracker measures how much *joy* you get per dollar spent. This turns spending data into behavioral insight.
2. **Ghost Hunter** — Actively identifies subscriptions you're paying for but no longer enjoy, with concrete annual savings numbers.
3. **Opportunity Cost** — Every spending decision is reframed through compound interest, showing the invisible cost of impulse purchases.
4. **Safe-to-Spend** — Not just a balance, but a real-time daily budget that accounts for bills, goals, and month-to-date spending.
5. **Privacy Mode** — Built for real-world use in public spaces. One tap masks every dollar amount on screen.

---

## License

MIT
