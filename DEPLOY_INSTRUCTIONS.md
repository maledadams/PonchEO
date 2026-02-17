# Deploy Instructions - PonchEO (Vercel + Supabase)

Purpose: deploy backend and frontend to Vercel using Supabase Postgres.

## Important security note

If credentials were exposed in any file or chat, rotate them now:
- Supabase database password
- `JWT_SECRET`
- `CRON_SECRET`

Never commit real secrets to GitHub.

## Prerequisites

- Node.js 20+
- Git
- Vercel account
- Supabase project

## Required values

Use placeholders like these (do not hardcode real values in docs):

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require
JWT_SECRET=<long-random-secret>
CRON_SECRET=<long-random-secret>
```

## Step 1 - Local setup

From repo root:

```bash
npm install
```

Create local env files:

- `packages/backend/.env`
- `packages/frontend/.env.local`

Backend example (`packages/backend/.env`):

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=24h
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
AUTO_CLOSE_CRON=0 2 * * *
AUTO_CLOSE_THRESHOLD_HOURS=14
CRON_SECRET=<long-random-secret>
```

Frontend example (`packages/frontend/.env.local`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Step 2 - Database sync (Supabase)

Run from repo root:

```bash
npx prisma generate --schema packages/backend/prisma/schema.prisma
npx prisma db push --schema packages/backend/prisma/schema.prisma
npm run db:seed -w packages/backend
```

## Step 3 - Local validation

```bash
npm run build
npm run lint
npm run test
```

## Step 4 - Deploy backend to Vercel

Create Vercel project from same repo:

- Root Directory: `packages/backend`
- Framework: Other
- Build Command: `npm run build`

Set backend env vars in Vercel (Production):

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=24h`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://<frontend-domain>.vercel.app`
- `CRON_SECRET`
- `AUTO_CLOSE_THRESHOLD_HOURS=14`
- `AUTO_CLOSE_CRON=0 2 * * *`

Deploy and copy backend URL:

`https://<backend-domain>.vercel.app`

## Step 5 - Deploy frontend to Vercel

Create second Vercel project from same repo:

- Root Directory: `packages/frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set frontend env var:

- `VITE_API_BASE_URL=https://<backend-domain>.vercel.app/api`

Deploy and copy frontend URL:

`https://<frontend-domain>.vercel.app`

## Step 6 - Verify

Backend health:

```bash
curl https://<backend-domain>.vercel.app/api/health
```

Expected:

```json
{"status":"ok","timestamp":"..."}
```

Frontend login test:

- Open frontend URL
- Login with seeded user:
  - `supervisor@poncheo.com`
  - `password123`

## Step 7 - Cron auto-close

`packages/backend/vercel.json` already defines the cron path:

- `POST /api/jobs/auto-close`

The endpoint accepts:
- `Authorization: Bearer <CRON_SECRET>` (recommended, Vercel Cron style)
- or `x-cron-secret: <CRON_SECRET>`

So keep `CRON_SECRET` configured in Vercel backend env vars.

## Troubleshooting

1. Build fails in Vercel:
   - Check Vercel deployment logs
   - Verify root directory is correct

2. Database errors:
   - Verify `DATABASE_URL`
   - Ensure `sslmode=require`

3. CORS errors:
   - Verify backend `CORS_ORIGIN` matches frontend URL exactly

4. Frontend cannot call API:
   - Verify `VITE_API_BASE_URL` points to `/api` on backend domain

## Files to know

- `packages/backend/vercel.json`
- `packages/frontend/vercel.json`
- `packages/backend/prisma/schema.prisma`
- `docs/postman/PonchEO.postman_collection.json`
- `docs/postman/PonchEO.local.postman_environment.json`
