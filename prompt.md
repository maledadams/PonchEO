PonchEO - Complete Execution Plan
Context
A small company (10-60 employees) needs a system to register clock-in/clock-out (punch), manage fixed/rotating/night shifts, calculate worked hours, tardiness, and overtime, and generate weekly/biweekly payroll summaries (calculation only, no payments). The system must handle real-world edge cases: forgotten punch-outs with auditable corrections, daily shift changes, Dominican Republic holiday/overtime labor rules, and supervisor approval workflows. This plan is for a team of 3 developers over 3 one-week sprints using Agile Scrum.

Current state: The repo is empty — only a README (punch-in system), MIT LICENSE (Copyright Lucia. A), and .gitattributes. No code, no tech stack, no dependencies.

1. Problem Breakdown
Core Problem
Build an employee time-tracking and payroll calculation system that handles the messy reality of shift work: people forget to clock out, shifts rotate, holidays have special pay rates, and corrections need supervisor approval with a full audit trail.

Constraints
Team of 3 developers, 3 weeks of sprints
Must be technically defensible in a class presentation
10-60 employees (low scale — optimize for developer speed, not performance)
Dominican Republic labor code (Ley 16-92) governs overtime/night/holiday rules
Calculation only — no payment processing, no deductions, no taxes
Assumptions
Single timezone (UTC-4, no daylight saving — Dominican Republic)
One company, no multi-tenancy
Two roles only: Employee and Supervisor
Internet-connected devices (no offline punch hardware)
Spanish-speaking users (but code/API in English, UI labels can be bilingual)
Measurable Success Criteria
Employee can clock in/out and see their punch history
Supervisor can assign shifts (fixed, rotating, night) per employee per day
System detects and flags incomplete punches; auto-closes after 14 hours
Employee can request a correction; supervisor can approve/reject with reason
Payroll calculation correctly applies: 44h regular, 135% overtime (44-68h), 200% excessive (68h+), 15% night premium, 200% holiday rate
Every mutation is captured in an audit log (who, what, when, old/new values)
Full documentation: README, ERD, business rules, Swagger, error strategy
2. Technical Architecture
Tech Stack
Layer	Technology	Why
Runtime	Node.js 20 LTS	Team familiarity from bootcamp
Framework	Express.js 4.x	Simple, massive docs, middleware pattern fits audit logging
Language	TypeScript 5.x	Type safety for 8+ entity data model, Prisma type generation
ORM	Prisma 5.x	Schema-first (one source of truth), auto-migrations, Studio GUI, readable query API
Database	PostgreSQL 16	timestamptz for punch timestamps, NUMERIC for payroll decimals, jsonb for audit log snapshots
Frontend	React 18 + Vite 5	Team is learning React; Vite for instant hot-reload
Styling	TailwindCSS 3 + daisyUI	No designer — utility classes produce polished UI fast
Auth	bcrypt + jsonwebtoken	Only 2 roles, no OAuth/SSO needed — ~50 lines of code
Validation	Zod	Runtime schema validation that mirrors TypeScript types
API Docs	swagger-jsdoc + swagger-ui-express	Auto-generated live docs at /api-docs (required deliverable)
Testing	Vitest + Supertest	Fast, Vite-compatible, same API as Jest
Cron	node-cron	Lightweight — auto-close orphan punches nightly
High-Level System Design

[React SPA (Vite)]
       |
       | HTTP/JSON + JWT Bearer token
       v
[Express.js API]
  ├── cors → json parser → auth middleware → validate (Zod) → route handler
  ├── audit middleware (captures old/new values on all mutations)
  └── error middleware (standardized AppError responses)
       |
       v
[Service Layer] ← All business logic (payroll engine, punch rules, corrections)
       |
       v
[Prisma Client] ← Generated from schema.prisma
       |
       v
[PostgreSQL] (timestamptz, numeric, jsonb)
Data flow for a clock-in:

Employee taps "Clock In" → POST /api/punches/clock-in (userId from JWT)
Service checks: open punch exists? → 409 error if yes
Service gets today's ShiftAssignment → 400 error if none
Creates Punch with clockIn = now(), calculates tardiness vs shift start + grace period
Returns punch record; audit middleware logs the creation
Data flow for payroll:

Supervisor hits "Generate" → POST /api/payroll/generate { periodStart, periodEnd }
Service reads DailyTimesheets for all employees in the period
For each employee: classifies minutes into regular/overtime/excessive/night/holiday buckets
Applies multipliers from OvertimeRule table (not hardcoded)
Creates PayrollSummary records with all breakdowns
3. Key Design Decisions
Shift Modeling: ShiftTemplate + ShiftAssignment (shifts-per-day)
ShiftTemplate defines reusable shift definitions (name, startTime "08:00", endTime "16:00", type DIURNA/NOCTURNA/MIXTA, break minutes, grace period).

ShiftAssignment links one employee to one shift template on one specific date. Unique constraint: [employeeId, date] — one shift per employee per day.

Shift Type	How It Works
Fixed	Bulk-assign "Morning" template Mon-Fri for 4 weeks
Rotating	Assign "Morning" Mon-Wed, "Night" Thu-Fri; reverse next week
Night	Template has startTime "21:00", endTime "05:00", type NOCTURNA. Assignment date = date shift starts. Clock-out on next calendar day handled by DateTime arithmetic
Why this beats alternatives: Single query to answer "what shift does Employee X have today?" No rule parser, no polymorphic tables, no UNION queries. Swapping one day's shift = one UPDATE.

Incomplete Punch Handling: Three-Layer Defense
Block on next clock-in: If open punch exists → 409 error with clear message and open punch ID
Nightly auto-close (node-cron, 2:00 AM): Punches open >14 hours get closed with the shift's scheduled end time (not current time). Marked AUTO_CLOSED + isAutoCompleted = true
Supervisor dashboard alert: Prominently shows open punches, auto-closed punches needing review, and pending corrections
Audit/Correction Strategy: Both Tables (Different Purposes)
Correction Table	AuditLog Table
Purpose	Business workflow (who requested, who approved)	Technical record (what changed in the database)
Audience	Supervisors, employees	Developers, auditors
Populated by	Explicit API calls	Automatic middleware on every mutation
Correction workflow: Employee creates correction (stores original + corrected values + reason) → Supervisor approves/rejects → If approved: punch updated, DailyTimesheet recalculated, audit log captures the change.

Overtime/Holiday Rules: Database Table (Not Hardcoded)
Seeded OvertimeRule table with Dominican Republic Ley 16-92 rules:

Rule	Threshold	Multiplier
Standard Rate	0-2640 min (44h)	1.00x
Standard Overtime	2640-4080 min (44-68h)	1.35x
Excessive Overtime	4080+ min (68h+)	2.00x
Night Premium	N/A (time-based)	1.15x
Holiday Work	N/A (date-based)	2.00x
Rest Day Work	N/A (day-of-week)	2.00x
Why configurable: Labor laws change. A rules table means updating a row, not redeploying code. Strong talking point for the presentation.

Data Model: Hybrid (Events + Timesheets)
Punches (events) are the source of truth — raw clock-in/clock-out timestamps.
DailyTimesheet is an auto-calculated cache per employee per day (totalWorkedMinutes, nightMinutes, tardinessMinutes, isHoliday, isRestDay). Recalculated on every clock-out or correction.
PayrollSummary is generated per employee per period from DailyTimesheets. Simple summation + rule application.


Punch (event, immutable) → triggers → DailyTimesheet (calculated cache)
                                              ↓
                                       PayrollSummary (generated report)
4. Data Model (12 Entities)
Tables and Key Fields
Employee: id, employeeCode (unique, "EMP-001"), firstName, lastName, email (unique), passwordHash, role (EMPLOYEE|SUPERVISOR), departmentId?, hireDate, hourlyRate (Decimal 10,2), isActive (soft delete)

Department: id, name (unique)

ShiftTemplate: id, name, startTime ("HH:mm" string), endTime, shiftType (DIURNA|NOCTURNA|MIXTA), breakMinutes (default 60), gracePeriodMinutes (default 10), isActive

ShiftAssignment: id, employeeId, shiftTemplateId, date (Date type). @@unique([employeeId, date])

Punch: id, employeeId, shiftAssignmentId?, clockIn (DateTime), clockOut (DateTime?), isAutoCompleted, tardinessMinutes, workedMinutes?, status (OPEN|CLOSED|AUTO_CLOSED|CORRECTED), notes. @@index([employeeId, clockIn])

Correction: id, punchId (unique — one per punch), requestedById, reason (required), originalClockIn, originalClockOut, correctedClockIn, correctedClockOut, status (PENDING|APPROVED|REJECTED)

Approval: id, correctionId (unique), supervisorId, decision (APPROVED|REJECTED), comments?, decidedAt

AuditLog: id, userId, action (CREATE|UPDATE|DELETE), entityType, entityId, oldValues (Json?), newValues (Json?), ipAddress?, timestamp. Append-only. @@index([entityType, entityId]), @@index([userId]), @@index([timestamp])

Holiday: id, date (unique), name, isRecurring, year?

OvertimeRule: id, name (unique), description, thresholdMinutes?, maxMinutes?, multiplier (Decimal 4,2), isActive, priority

DailyTimesheet: id, employeeId, date, totalWorkedMinutes, regularMinutes, overtimeMinutes, nightMinutes, tardinessMinutes, isHoliday, isRestDay, status (DRAFT|FINALIZED). @@unique([employeeId, date])

PayrollSummary: id, employeeId, periodStart, periodEnd, periodType (WEEKLY|BIWEEKLY), totalWorkedMinutes, regularMinutes, overtimeMinutes, nightMinutes, holidayMinutes, totalTardinessMinutes, regularPay, overtimePay, nightPremiumPay, holidayPay, grossPay (all Decimal 10,2), status (DRAFT|FINALIZED), generatedById. @@unique([employeeId, periodStart, periodEnd])

5. API Design (~40 Endpoints)
Auth
POST /api/auth/login — returns JWT + user info
POST /api/auth/me — current user from token
CRUD Resources (all follow same pattern: GET list, GET :id, POST, PUT :id, DELETE :id)
/api/employees — [SUPERVISOR] for CUD, self-read for employees
/api/departments — [SUPERVISOR]
/api/shift-templates — [SUPERVISOR] for CUD
/api/shift-assignments — [SUPERVISOR] + POST /bulk for batch creation
/api/holidays — [SUPERVISOR] + POST /seed/:year for DR holidays
/api/overtime-rules — [SUPERVISOR] for updates only (seeded, not user-created)
Core Business
POST /api/punches/clock-in — userId from JWT
POST /api/punches/clock-out — userId from JWT
GET /api/punches — filter by employeeId, date range, status
GET /api/punches/open — [SUPERVISOR] all currently open punches
POST /api/corrections — [EMPLOYEE] create correction request
POST /api/corrections/:id/approve — [SUPERVISOR]
POST /api/corrections/:id/reject — [SUPERVISOR]
Reports
GET /api/daily-timesheets — filter by employeeId, date range
POST /api/payroll/generate — [SUPERVISOR] { periodStart, periodEnd, periodType }
GET /api/payroll — list summaries with filters
PUT /api/payroll/:id/finalize — lock for payroll
PUT /api/payroll/:id/revert — unlock back to draft
Dashboard
GET /api/dashboard/supervisor — open punches, pending corrections, auto-closed today
GET /api/dashboard/employee — today's status, week hours, pending corrections
Audit
GET /api/audit-logs — [SUPERVISOR] filter by userId, entityType, date range
6. Error Handling Strategy
Standardized AppError class with: statusCode, code (machine-readable), message (human-readable), details (optional context).

Code	HTTP	When
VALIDATION_ERROR	400	Zod schema validation fails
PUNCH_ALREADY_OPEN	409	Clock-in with existing open punch
PUNCH_NOT_FOUND	404	Clock-out with no open punch
NO_SHIFT_ASSIGNED	400	Clock-in on a day with no shift
SHIFT_CONFLICT	409	Overlapping shift assignment
CORRECTION_ALREADY_REVIEWED	409	Re-approving/rejecting a decided correction
UNAUTHORIZED	401	Missing/invalid JWT
FORBIDDEN	403	Employee trying supervisor-only action
All errors return: { "success": false, "error": { "code": "...", "message": "...", "details": {...} } }

7. Folder Structure

PonchEO/
├── package.json              # npm workspaces: ["packages/*"]
├── .env.example
├── docker-compose.yml        # PostgreSQL only
├── docs/
│   ├── ERD.md               # Mermaid diagram
│   ├── BUSINESS_RULES.md    # Human-language rules (DR labor code)
│   └── API.md
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # ALL 12 entities — single source of truth
│   │   │   └── seed.ts          # Departments, shifts, holidays, rules, demo users
│   │   └── src/
│   │       ├── index.ts / app.ts
│   │       ├── config/          # env.ts, database.ts (Prisma singleton)
│   │       ├── middleware/      # auth, audit, error, validate, role
│   │       ├── shared/          # AppError, time.utils, date.utils, response.utils
│   │       ├── jobs/            # autoClosePunches.job.ts (node-cron)
│   │       └── modules/         # Feature-based: each has routes/controller/service/schema
│   │           ├── auth/
│   │           ├── employees/
│   │           ├── departments/
│   │           ├── shifts/
│   │           ├── shift-assignments/
│   │           ├── punches/
│   │           ├── corrections/
│   │           ├── holidays/
│   │           ├── overtime-rules/
│   │           ├── timesheets/
│   │           ├── payroll/      # THE calculation engine
│   │           ├── audit/
│   │           └── dashboard/
│   │   └── tests/
│   │       ├── unit/            # payroll.service.test, time.utils.test
│   │       └── integration/     # punch.flow.test, correction.flow.test
│   └── frontend/
│       └── src/
│           ├── api/             # Axios client + per-resource API modules
│           ├── context/         # AuthContext (JWT + user state)
│           ├── components/      # layout/, common/, forms/
│           └── pages/           # Login, Dashboard, Employees, Shifts, Punch,
│                                # Corrections, Payroll, Holidays, AuditLog
Why feature-based modules: Each developer owns 4-5 modules without merge conflicts. Adding a feature = adding a folder.

8. Agile Execution Plan
Team Roles
Developer	Primary	Secondary
Dev A (Lead)	Backend architecture, auth, middleware, infra	Code reviews, integration help
Dev B	Backend business logic (punches, corrections, payroll engine)	Schema, seed data, unit tests
Dev C	Frontend (all pages)	API integration, documentation
Sprint 0: Setup (Day 0 — everyone together, 1 day)
Init monorepo, TypeScript, ESLint, Prettier
Write schema.prisma with ALL 12 entities, run prisma migrate dev
Create seed script (3 departments, 4 shift templates, DR 2026 holidays, overtime rules, 5 demo employees)
Express skeleton + health check, Vite+React skeleton + login shell
Everyone runs locally, confirms it works
Git: main + feature branches, PRs required
Sprint 1: Foundation (Week 1)
Goal: "An employee can log in, clock in, and clock out. A supervisor can manage employees and shifts."

Dev	Tasks
A	Auth module (login, JWT, middleware) · Error handling middleware + AppError · Audit middleware · Swagger setup · Employee CRUD · Department CRUD
B	ShiftTemplate CRUD · ShiftAssignment CRUD + bulk assign · Punch clock-in/clock-out logic · Tardiness detection · DailyTimesheet recalc on clock-out
C	Login page + auth context + token storage · Dashboard layout (sidebar, header, protected routes) · Employee list page (table + modal) · Punch page (clock in/out buttons + status) · Axios client with JWT interceptor
Definition of Done: Employee can log in, clock in/out. Supervisor can CRUD employees and assign shifts. Swagger at /api-docs.

Sprint 2: Business Logic (Week 2)
Goal: "Corrections workflow end-to-end. Payroll calculation works."

Dev	Tasks
A	Correction create endpoint · Approve/reject endpoints · Punch update on approval · Timesheet recalc on correction · Audit log query endpoint · Holiday CRUD + seed
B	Auto-close orphan punches job · Overtime rules CRUD · Payroll calculation engine · Payroll generate endpoint · Night minutes utility · Unit tests for payroll
C	Shift calendar page · Corrections page (create + approve/reject) · Punch history (table + filters) · Holiday page · Dashboard alerts (open punches, pending corrections)
Definition of Done: Correction flow works end-to-end. Payroll correctly applies all DR overtime rules. Auto-close job works.

Sprint 3: Polish & Demo Prep (Week 3)
Goal: "Demo-ready with reports, docs, no critical bugs."

Dev	Tasks
A	Payroll report endpoint (by dept/period) · Integration tests (auth, punch, correction flows) · README (setup, decisions, how to run) · BUSINESS_RULES.md
B	Edge case fixes (night shift midnight, holiday+rest day overlap) · Payroll finalize/revert · Validation edge cases · ERD diagram · Enhanced seed data (2 weeks of realistic demo data)
C	Payroll page (generate, view, finalize) · Audit log viewer · Supervisor dashboard (charts) · Responsive design fixes · Demo script prep
Definition of Done: All CRUD works UI→DB→UI. Payroll reports correct. No critical bugs. Full documentation. 15-minute demo runs smooth.

Definition of Done (Global)
Code compiles with no TypeScript errors
Endpoint has Zod validation on request body
Endpoint returns standardized response shape
Mutation is captured in audit log
PR reviewed by at least one other dev
Works in both employee and supervisor roles
9. Risk Analysis
Risk	Probability	Impact	Mitigation
Night shift crossing midnight breaks date logic	High	High	Use full DateTime for clockIn/clockOut, never date strings. ShiftAssignment date = date shift starts. Write specific unit test for 21:00-05:00 shift.
Timezone bugs	High	High	ALL timestamps stored as UTC (PostgreSQL timestamptz). API uses ISO 8601. Frontend converts for display only. DR is UTC-4 with no DST (simplifies).
Payroll rounding errors	Medium	High	Prisma Decimal type (PostgreSQL NUMERIC). Never use JS float for money. Round to 2 decimals only at final result.
Payroll engine takes longer than expected	High	High	Dev B starts it Day 1 of Sprint 2. Pure function (timesheets + rules → summary), testable in isolation with hardcoded data. Write tests first (TDD for this module).
Frontend falls behind	Medium	Medium	Prioritize: Login → Punch → Payroll view. Corrections and shift calendar can be demoed via Swagger if needed.
Scope creep	High	Medium	Strict no to: email notifications, PDF export, mobile app, real-time updates. Each adds a week.
Race condition on concurrent clock-in	Low	Medium	@@unique constraint on ShiftAssignment + open-punch check in service. For 60 employees, true concurrency is unlikely. Use Prisma $transaction if needed.
10. Testing Strategy
Priority 1 (Must Have): Payroll Engine Unit Tests
44h exactly → all regular, 0 overtime
50h → 44 regular + 6 overtime at 1.35x
70h → 44 regular + 24 overtime at 1.35x + 2 excessive at 2.00x
Night shift → 15% premium
Holiday work → 200% rate
Post-correction recalculation
Priority 2 (Should Have): Integration Tests
Clock-in → 201; clock-in again → 409
Clock-out → 200, workedMinutes calculated
Create correction → approve → punch updated → timesheet recalculated
Generate payroll → correct totals
Priority 3 (Nice to Have): Time Utility Unit Tests
Night minutes calculation (fully night, partially night, day-only)
Tardiness (within grace, beyond grace)
Worked minutes with break deduction
Coverage targets: Payroll service 90%+, time utilities 90%+, other services 50%+. No frontend unit tests (manual testing within timeline).

11. Deployment Plan
Development
PostgreSQL via Docker (docker-compose.yml) or Neon free tier (cloud, no Docker)
Backend: npm run dev (ts-node-dev with auto-restart)
Frontend: npm run dev (Vite dev server proxied to backend)
Demo Day: Railway.app or Render.com
Connect GitHub repo → auto-build → auto-deploy
Single server: Express serves React build (express.static) + API routes + Swagger
Managed PostgreSQL (free tier)
Environment: DATABASE_URL, JWT_SECRET, PORT, NODE_ENV=production
Why single server: Splitting frontend/backend adds CORS config, two pipelines, two URLs. For a bootcamp demo, serving everything from Express is simpler.

12. Verification Plan
Seed and boot: npm run seed → npm run dev → hit GET /api/health → 200
Auth flow: Login as supervisor → get JWT → use in subsequent requests
Shift setup: Create shift template → bulk-assign to employee for a week
Punch cycle: Clock in as employee → verify tardiness calc → clock out → verify workedMinutes and DailyTimesheet
Incomplete punch: Clock in, don't clock out → trigger auto-close job → verify AUTO_CLOSED status and assumed end time
Correction flow: Create correction → login as supervisor → approve → verify punch updated and timesheet recalculated
Payroll: Generate for a weekly period → verify regular/overtime/night/holiday breakdowns match manual calculation
Audit trail: Check GET /api/audit-logs → every mutation from steps 3-7 should appear
Swagger: Visit /api-docs → all endpoints documented and testable
Frontend: Walk through Login → Dashboard → Punch → Corrections → Payroll pages