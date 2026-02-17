# PonchEO

Sistema de control de asistencia, turnos y calculo de nomina (sin pagos), con reglas de Republica Dominicana.

## Stack

- Backend: Node.js + Express + TypeScript + Prisma
- DB: PostgreSQL (local o Supabase)
- Frontend: React + Vite + Tailwind + daisyUI
- Auth: JWT
- Docs API: Swagger en `/api-docs`

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL local o Supabase

## Setup local rapido

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea `.env` a partir de `.env.example`.
3. Levanta Postgres local (opcional):
   ```bash
   docker compose up -d
   ```
4. Migra y genera cliente Prisma:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
5. Ejecuta app:
   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`  
Swagger: `http://localhost:3000/api-docs`

## Credenciales demo

- Supervisor: `supervisor@poncheo.com` / `password123`
- Empleado: `carlos@poncheo.com` / `password123`

## Postman

Coleccion y environment listos:

- `docs/postman/PonchEO.postman_collection.json`
- `docs/postman/PonchEO.local.postman_environment.json`

Pasos:

1. Importa ambos archivos en Postman.
2. Selecciona el environment.
3. Ejecuta `POST /api/auth/login` para autoguardar `token`.
4. Ejecuta el resto de requests.

## Variables importantes

Backend (`.env`):

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `CRON_SECRET`
- `AUTO_CLOSE_CRON`

Frontend (Vercel o `.env` en `packages/frontend`):

- `VITE_API_BASE_URL` (ej: `https://tu-backend.vercel.app/api`)

## Despliegue Vercel + Supabase

### 1) Supabase

1. Crea proyecto en Supabase.
2. Toma la cadena de conexion Postgres (pooler recomendado).
3. Coloca `DATABASE_URL` en Vercel backend.

### 2) Backend en Vercel

1. Crea proyecto Vercel con root `packages/backend`.
2. Usa `vercel.json` incluido en `packages/backend/vercel.json`.
3. Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=24h`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://<frontend-domain>`
   - `CRON_SECRET=<secreto-fuerte>`
4. Ejecuta migraciones en la DB de Supabase desde local o CI:
   ```bash
   npm run db:migrate -w packages/backend
   npm run db:seed -w packages/backend
   ```

### 3) Frontend en Vercel

1. Crea proyecto Vercel con root `packages/frontend`.
2. Variable:
   - `VITE_API_BASE_URL=https://<backend-domain>/api`
3. Deploy.

## Scripts utiles

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run db:migrate`
- `npm run db:seed`

## Documentacion adicional

- `docs/ERD.md`
- `docs/BUSINESS_RULES.md`
- `docs/API.md`
- `docs/ARGUMENTACION_TECNICA.md`
