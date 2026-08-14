# ArtNovaX Mental Health Foundation — Website

Full-stack website for ArtNovaX, built with React + Tailwind on the frontend and FastAPI + MongoDB on the backend.

## Project layout

```text
artnovax-website/
├── backend/
│   ├── app/                 shared configuration, database, security and utilities
│   ├── tests/               backend smoke tests
│   ├── server.py            FastAPI routes
│   ├── requirements.txt     runtime Python dependencies
│   ├── requirements-dev.txt development/test dependencies
│   └── .env.example
├── frontend/
│   ├── public/              favicon, manifest and local ArtNovaX logos
│   ├── src/                 React application
│   ├── package.json
│   └── .env.example
├── compose.yaml             local MongoDB service
└── .gitignore
```

## Prerequisites

- Python 3.10+
- Node.js 20+
- Yarn 1.x
- Docker Desktop (recommended for local MongoDB)

## 1. Start MongoDB

From the project root:

```powershell
docker compose up -d mongo
```

Verify it is running:

```powershell
docker ps
```

MongoDB is available at `mongodb://localhost:27017` and uses the persistent Docker volume `artnovax-mongo-data`.

## 2. Start the backend

```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` before using admin, Stripe, Resend or M-Pesa features. At minimum, replace `ADMIN_TOKEN` with a strong random token.

Start FastAPI:

```powershell
uvicorn server:app --reload --port 8001
```

Health check:

```text
http://localhost:8001/api/
```

Expected response:

```json
{"message":"ArtNovaX API is up."}
```

## 3. Start the frontend

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
yarn install
yarn start
```

Open `http://localhost:3000`.

`yarn install` will create a fresh `yarn.lock`; commit that lockfile with the repository after the first successful install.

## 4. Admin dashboard

Open `http://localhost:3000/admin` and use the `ADMIN_TOKEN` from `backend/.env`.

The dashboard can manage events, articles, products, founders and volunteer roles, and review orders, donations, newsletter subscribers, contact messages, registrations, volunteer applications and partnership inquiries.

## 5. Optional integrations

### Stripe

Set `STRIPE_SECRET_KEY` in `backend/.env`. Without it, payment routes return a configuration error while the rest of the site continues to work.

### Resend

Set `RESEND_API_KEY`, `FROM_EMAIL` and `TEAM_EMAIL`. Without a Resend key, transactional email is skipped.

### M-Pesa / Daraja

Set the Daraja values in `backend/.env`. If the credentials are absent, the checkout flow uses the local M-Pesa simulator.

## 6. Tests and builds

Backend smoke test:

```powershell
cd backend
pip install -r requirements-dev.txt
pytest
```

Frontend production build:

```powershell
cd frontend
yarn build
```

## Security notes

- Never commit `.env` files.
- Do not use a predictable `ADMIN_TOKEN` outside throwaway local development.
- Use production-specific CORS origins instead of `*` when deploying.
- Set `PUBLIC_ORIGIN`, `BACKEND_PUBLIC_URL` and `BRAND_LOGO_URL` to deployed public URLs before enabling transactional email.

## Tech stack

- Frontend: React, React Router, Tailwind CSS, lucide-react, axios
- Backend: FastAPI, Motor/MongoDB, Pydantic, Stripe, httpx/Resend
- Local database: MongoDB 7 via Docker Compose
