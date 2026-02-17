# API Guide

Base URL local: `http://localhost:3000`  
Swagger: `http://localhost:3000/api-docs`

## Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

## Core

- `POST /api/punches/clock-in`
- `POST /api/punches/clock-out`
- `GET /api/punches`
- `GET /api/punches/:id`
- `GET /api/punches/open` (supervisor)

## Corrections

- `POST /api/corrections` (employee)
- `GET /api/corrections`
- `GET /api/corrections/:id`
- `POST /api/corrections/:id/approve` (supervisor)
- `POST /api/corrections/:id/reject` (supervisor)

## Catalogs

- `GET/POST/PUT/DELETE /api/employees` (CUD supervisor)
- `GET/POST/PUT/DELETE /api/departments` (CUD supervisor)
- `GET/POST/PUT/DELETE /api/shift-templates` (CUD supervisor)
- `GET/POST/PUT/DELETE /api/shift-assignments` (CUD supervisor)
- `POST /api/shift-assignments/bulk` (supervisor)
- `GET/POST/PUT/DELETE /api/holidays` (CUD supervisor)
- `POST /api/holidays/seed/:year` (supervisor)
- `GET /api/overtime-rules`
- `PUT /api/overtime-rules/:id` (supervisor)

## Reports

- `GET /api/daily-timesheets`
- `POST /api/payroll/generate` (supervisor)
- `GET /api/payroll` (supervisor)
- `GET /api/payroll/export/csv` (supervisor)
- `GET /api/payroll/:id` (supervisor)
- `PUT /api/payroll/:id/finalize` (supervisor)
- `PUT /api/payroll/:id/revert` (supervisor)

## Dashboard & Audit

- `GET /api/dashboard/employee`
- `GET /api/dashboard/supervisor` (supervisor)
- `GET /api/audit-logs` (supervisor)

## Jobs

- `POST /api/jobs/auto-close`
  - Header requerido: `x-cron-secret`
  - pensado para cron serverless (Vercel Cron)

## Response shape

Exito:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```
