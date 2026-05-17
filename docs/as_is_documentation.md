# CG Forecast — Faith Organization Growth Forecasting System
## As-Is System Documentation · Part 1 of 3
### System Overview, Architecture, and Database Schema

---

## 1. System Overview

### 1.1 Title and Identity

- **Full System Name:** Faith Organization Growth Forecasting System
- **Short Name / Brand:** CG Forecast
- **Tagline:** *Faith Organization Growth Intelligence · SVR ML*
- **Version:** 1.0 — Production Ready
- **Prepared By:** Victor Nzwili / Antigravity Development Team
- **Date:** April 2026

### 1.2 Problem Solved

Church leadership (pastors, administrators) currently track attendance manually — via spreadsheets, paper registers, or disconnected apps. There is no mechanism to detect early warning signs of member disengagement, and no data-driven basis for pastoral intervention decisions.

CG Forecast solves this by:

1. **Centralising data collection** — Ushers log headcounts and RSVPs digitally at the point of service.
2. **Quantifying engagement** — Feedback ratings are collected alongside attendance to produce a composite engagement score.
3. **Automating intelligence** — A per-group SVR (Support Vector Regression) model predicts attendance for the next several sessions and alerts leadership when a decline pattern is detected.
4. **Enabling role-based access** — Pastors and admins see forecasts and alerts; ushers log data; members view their own group activity.

### 1.3 Technology Stack (As Implemented)

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | SPA, no router — page state via `useState` |
| Styling | CSS Variables + Tailwind | Aurora dark-mode design system |
| Charts | Recharts | AreaChart, LineChart, ResponsiveContainer |
| Toasts | Sonner | Action feedback |
| Backend | Node.js + Express 4 | REST API, auth, business logic |
| ORM | Prisma 5 | Schema management + query layer |
| Database (dev) | SQLite (`dev.db`) | File stored at `server/prisma/dev.db` |
| Database (prod target) | PostgreSQL 16 | Configured in docker-compose.yml |
| ML Engine | Python FastAPI + scikit-learn SVR | Port 5001 |
| ML Serialisation | joblib | `.pkl` bundles per group |
| Auth | JWT (jsonwebtoken) | Bearer token in Authorization header; 7-day expiry |
| Email | Nodemailer + Brevo SMTP | Verification & alert emails |
| Scheduler | node-cron | Declared as dependency; no active schedule found in codebase |
| Package Manager | npm | Both client and server |
| Containerisation | Docker Compose | postgres-only service defined |

---

## 2. Architecture

### 2.1 Tier Overview

The system is a **three-tier architecture**:

```
[ Browser / React Client ]   port 5173
          ↓  REST + JWT
[ Express.js API Server ]    port 3001
     ↓ Prisma ORM          ↓ HTTP POST
[ SQLite / PostgreSQL ]    [ FastAPI ML Service ]   port 5001
                                   ↓
                           [ models/group_N.pkl ]
```

### 2.2 Tier 1 — React Frontend (Client)

- **Entry:** `client/src/main.tsx` renders `<App />` wrapped in `<AuthProvider>`.
- **Routing:** No router library. Navigation is a single `page` state variable in `App.tsx`, switching between 8 page components via conditional rendering.
- **Auth state:** `AuthContext.jsx` persists JWT and user object to `localStorage`. On mount, reads stored user back.
- **API client:** `client/src/api/client.js` — Axios instance with `baseURL = VITE_API_URL || http://localhost:3001`. An **interceptor** attaches `Authorization: Bearer <token>` to every request. A **response interceptor** on 401 clears localStorage and redirects to `/login`.
- **Theme:** Dark/light toggle stored in `localStorage` key `app-theme`. Dark is default. Applied via `body.classList`.

### 2.3 Tier 2 — Express API Server (Backend)

- **Entry:** `server/index.js`
- **Port:** `process.env.PORT || 3001`
- **Middleware:** `cors()` (open, no origin restriction), `express.json()`
- **Global error handler:** Catches unhandled errors, returns `500 { error: 'Internal server error' }`.
- **Health check:** `GET /health` — returns `{ status: 'ok', timestamp }` with no auth required.
- **Auth middleware** (`server/middleware/auth.js`):
  - `authenticate` — Verifies JWT from `Authorization: Bearer` header; attaches decoded payload to `req.user`.
  - `requireRole(roles[])` — Factory that checks `req.user.role` is in the allowed list.
- **Email utility** (`server/utils/mailer.js`):
  - Nodemailer transporter over Brevo SMTP (STARTTLS, port 587).
  - `sendVerificationEmail(toEmail, toName, token)` — sends branded HTML verification link valid 24 hours.
  - `sendAlertEmail(toEmail, toName, alertSummary)` — sends alert digest email (called externally; not auto-triggered in current routes).
- **Route modules** (9 total — see Section 4 for full endpoint detail):
  - `/api/auth` · `/api/users` · `/api/groups` · `/api/attendance`
  - `/api/feedback` · `/api/forecast` · `/api/alerts` · `/api/admin` · `/api/ml`

### 2.4 Tier 3 — Python ML Microservice

- **Framework:** FastAPI, served by Uvicorn on port 5001.
- **Entry:** `ml/service.py`
- **CORS:** Open (`allow_origins=["*"]`).
- **Model storage:** `ml/models/group_<id>.pkl` — one file per group.
- **Endpoints:** `GET /health`, `POST /predict`, `POST /retrain`
- **Invoked by:** Express `forecast.js` route (via axios POST to `ML_SERVICE_URL`).

### 2.5 Database Layer

- **Development:** SQLite file at `server/prisma/dev.db`.
- **Production target:** PostgreSQL 16 (defined in `docker-compose.yml` as service `congregate_postgres`, credentials `postgres/congregate_pass`, database `congregate_db`, port 5432).
- **ORM:** Prisma 5 with generated client. Schema at `server/prisma/schema.prisma`.
- **ML direct access:** `pipeline.py` and `train.py` read SQLite directly via `sqlite3.connect(db_path)` — bypassing Prisma.

### 2.6 Environment Variables

Defined in root `.env`:

| Variable | Value (dev) | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:congregate_pass@localhost:5432/congregate_db` | Prisma connection (points to PG; SQLite used in dev via schema override) |
| `JWT_SECRET` | 64-char hex string | Signs all JWTs |
| `ML_SERVICE_URL` | `http://localhost:5001` | Express → FastAPI calls |
| `PORT` | `3001` | Express port |
| `NODE_ENV` | `development` | Environment flag |
| `CLIENT_URL` | `http://localhost:5173` | Email verification redirect base |
| `SMTP_HOST` | `smtp-relay.brevo.com` | Brevo SMTP relay |
| `SMTP_PORT` | `587` | STARTTLS port |
| `SMTP_USER` | `a9849f001@smtp-brevo.com` | Brevo SMTP username |
| `SMTP_PASS` | (token) | Brevo SMTP password |
| `FROM_EMAIL` | `viccreativess@gmail.com` | Sender address |

---

## 3. Database Schema

**ORM:** Prisma 5. **Database (dev):** SQLite. Schema file: `server/prisma/schema.prisma`.

### 3.1 Table: `User`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `name` | `String` | NOT NULL | Full display name |
| `email` | `String` | NOT NULL, UNIQUE | Login identifier |
| `passwordHash` | `String` | NOT NULL | bcrypt, 10 rounds |
| `role` | `String` | NOT NULL | Enum: `admin`, `pastor`, `usher`, `member` |
| `church` | `String?` | nullable | Campus / church name from signup |
| `emailVerified` | `Boolean` | default `true` | `true` for seeded accounts; `false` on self-registration |
| `verificationToken` | `String?` | nullable | JWT used for email verification; set to `null` once verified |
| `createdAt` | `DateTime` | default `now()` | |

**Relations:** `groups Group[] @relation("leader")` — one user can lead many groups.

**Verification logic:** Login is blocked if `emailVerified = false AND verificationToken != null`. Seeded accounts have `emailVerified = true` and no token, so they bypass this check.

---

### 3.2 Table: `Group`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `name` | `String` | NOT NULL | Faith group name |
| `category` | `String` | NOT NULL | E.g. Youth, Bible Study, Music, Fellowship, Prayer |
| `leaderId` | `Int` | FK → User.id | Group leader |
| `createdAt` | `DateTime` | default `now()` | |

**Relations:**
- `leader User @relation("leader")` — belongs to one user.
- `attendance Attendance[]`, `feedback Feedback[]`, `features Feature[]`, `forecasts Forecast[]` — one-to-many for all data types.

---

### 3.3 Table: `Attendance`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `groupId` | `Int` | FK → Group.id | |
| `sessionDate` | `DateTime` | NOT NULL | The date of the session |
| `headcount` | `Int` | NOT NULL | Actual people present |
| `rsvpCount` | `Int` | default `0` | Number who RSVPed |
| `recordedAt` | `DateTime` | default `now()` | When the record was created |

**Unique constraint:** `@@unique([groupId, sessionDate])` — one record per group per date. Prevents duplicate logging. The `overwrite` flag in `POST /api/attendance` triggers an upsert to override.

---

### 3.4 Table: `Feedback`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `groupId` | `Int` | FK → Group.id | |
| `sessionDate` | `DateTime` | NOT NULL | Matches the session |
| `avgRating` | `Float` | NOT NULL | Aggregate average, range 1.0–5.0 |
| `responseCount` | `Int` | NOT NULL | Number of respondents |
| `createdAt` | `DateTime` | default `now()` | |

**Unique constraint:** `@@unique([groupId, sessionDate])`.

**Privacy design:** No `text`, `comment`, `name`, or `userId` column exists. Only aggregate numeric data is stored — this is intentional (see ethics_audit.md). Individual responses are never persisted.

---

### 3.5 Table: `Feature`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `groupId` | `Int` | FK → Group.id | |
| `featureDate` | `DateTime` | NOT NULL | Corresponds to the session date |
| `rollingAvg4w` | `Float` | NOT NULL | 4-week rolling average of headcount |
| `trendSlope` | `Float` | NOT NULL | Linear regression slope over last 8 weeks |
| `rsvpRate` | `Float` | NOT NULL | `rsvpCount / headcount`, clamped to [0,1] |
| `feedbackAvg` | `Float` | NOT NULL | Average session rating (defaults to 3.0 if missing) |
| `computedAt` | `DateTime` | default `now()` | When pipeline.py ran |

**Written by:** `ml/pipeline.py` directly via SQLite INSERT (not via Prisma). Read by `ml/train.py` for SVR training and by `server/routes/forecast.js` to get the latest features for a prediction request.

---

### 3.6 Table: `Forecast`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `groupId` | `Int` | FK → Group.id | |
| `forecastDate` | `DateTime` | NOT NULL | When this forecast was generated (`new Date()`) |
| `predictedHeadcount` | `Float` | NOT NULL | SVR point prediction |
| `confidenceLower` | `Float` | NOT NULL | 95% CI lower bound (bootstrap) |
| `confidenceUpper` | `Float` | NOT NULL | 95% CI upper bound (bootstrap) |
| `generatedAt` | `DateTime` | default `now()` | |

**Relations:** `alerts Alert[]` — one forecast can generate zero or one alert.

---

### 3.7 Table: `Alert`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | |
| `forecastId` | `Int` | FK → Forecast.id | Links to the triggering forecast |
| `groupId` | `Int` | NOT NULL | Denormalised for direct group queries |
| `alertType` | `String` | NOT NULL | Enum: `drop`, `growth`, `stable` |
| `message` | `String` | NOT NULL | Human-readable description |
| `recommendation` | `String` | NOT NULL | Pastoral action suggestion |
| `acknowledged` | `Boolean` | default `false` | Flipped by PATCH `/api/alerts/:id/acknowledge` |
| `createdAt` | `DateTime` | default `now()` | |

**Alert generation logic (in `forecast.js`):**
- `drop` alert: if `(rollingAvg4w - predicted) / rollingAvg4w > 0.15` → predicted is >15% lower than recent average.
- `growth` alert: if `(predicted - rollingAvg4w) / rollingAvg4w > 0.10` → predicted is >10% higher than recent average.
- No alert is created if neither threshold is crossed.

### 3.8 Entity Relationship Summary

```
User ─────────────── Group (via leaderId)
                        │
          ┌─────────────┼─────────────┬─────────────┐
          ▼             ▼             ▼             ▼
      Attendance    Feedback       Feature       Forecast
                                                    │
                                                  Alert
```

All data is group-scoped. No individual member rows exist in any table outside of `User`. All forecasting and alerting operates at the `groupId` level.

---
*Continued in Part 2: API Endpoints, ML Microservice*
# CG Forecast — As-Is System Documentation · Part 2 of 3
### API Endpoints and ML Microservice

---

## 4. API Endpoints

All routes except `GET /health`, `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/verify` require a valid JWT in the `Authorization: Bearer <token>` header. JWT expiry is **7 days**.

Base URL (dev): `http://localhost:3001`

---

### 4.1 Auth Routes — `/api/auth`

No authentication required.

#### `POST /api/auth/register`

**Purpose:** Self-registration of a new user account.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@church.org",
  "password": "secret123",
  "role": "member",
  "church": "Main Campus"
}
```

**Validation:** `name`, `email`, `password`, `role` are required. `role` must be one of `admin`, `pastor`, `usher`, `member`. `church` is optional.

**Behaviour:**
1. Hashes password with bcrypt (10 rounds).
2. Signs a 24-hour JWT as `verificationToken` (purpose: `email-verify`).
3. Creates User row with `emailVerified: false`.
4. Calls `sendVerificationEmail()` non-blocking (failure does not fail registration).

**Response 201:**
```json
{ "id": 5, "name": "John Doe", "role": "member", "message": "Account created. Please check your email..." }
```

**Response 400:** Missing fields or invalid role.
**Response 409:** Email already registered (Prisma error P2002).

---

#### `GET /api/auth/verify?token=<jwt>`

**Purpose:** Email verification via link clicked from inbox.

**Behaviour:**
1. Decodes and verifies the JWT. Checks `purpose === 'email-verify'`.
2. Looks up user by email from token payload.
3. Sets `emailVerified: true` and clears `verificationToken`.
4. Redirects to `CLIENT_URL/?verified=true` (or `?verified=already` if already verified).

**Response:** HTTP 302 redirect. Error conditions return JSON 400.

---

#### `POST /api/auth/login`

**Purpose:** Authenticate and receive a JWT.

**Request body:**
```json
{ "email": "pastor@church.org", "password": "Pastor123!" }
```

**Behaviour:**
1. Looks up user by email.
2. Compares password with bcrypt.
3. Blocks login if `emailVerified = false AND verificationToken != null`.
4. Signs a 7-day JWT with payload `{ id, role, name, email }`.

**Response 200:**
```json
{ "token": "eyJ...", "role": "pastor", "name": "Rev. Samuel Njoroge", "id": 1, "email": "..." }
```

**Response 401:** Invalid credentials.
**Response 403:** `{ "error": "Please verify your email...", "needsVerification": true }`.

**Accessible by:** All (no auth required).

---

### 4.2 Users Routes — `/api/users`

All require JWT. Only admins can create users via this route.

#### `POST /api/users`

**Purpose:** Admin creates a user account (auto-verified, no email sent).

**Roles:** `admin` only.

**Request body:**
```json
{ "name": "Jane Usher", "email": "jane@church.org", "role": "usher", "password": "temp1234" }
```

**Response 201:**
```json
{ "id": 6, "name": "Jane Usher", "email": "jane@church.org", "role": "usher" }
```

**Response 409:** Email already exists.

---

### 4.3 Groups Routes — `/api/groups`

All require JWT. All authenticated roles can list/read groups. Only `admin` can create.

#### `GET /api/groups`

**Purpose:** List all groups with enriched runtime data.

**Roles:** All authenticated.

**Behaviour:** For each group, the route:
1. Fetches the last 2 attendance records to compute `memberCount` (latest headcount) and `trend` (% change).
2. Fetches unacknowledged alerts; if a `drop` alert exists, sets `status = 'alert'`.
3. If trend is negative >5% and no alert, sets `status = 'warning'`. Otherwise `status = 'active'`.

**Response 200:** Array of group objects:
```json
[{
  "id": 1, "name": "Youth Alive Fellowship", "category": "Youth",
  "leaderId": 3, "createdAt": "...",
  "leader": { "id": 3, "name": "Daniel Kamau", "role": "usher" },
  "memberCount": 138, "trend": "+8%", "status": "active"
}]
```

---

#### `POST /api/groups`

**Purpose:** Create a new faith group.

**Roles:** `admin` only.

**Request body:**
```json
{ "name": "New Group", "category": "Youth", "leaderId": 3 }
```
Or, instead of `leaderId`, pass `leader` as a name string — the route will find or create the user.

**Response 201:** The new `Group` object.

---

#### `GET /api/groups/:id`

**Purpose:** Get a single group with its leader.

**Roles:** All authenticated.

**Response 200:** Group object with `leader: { id, name }`.
**Response 404:** Group not found.

---

### 4.4 Attendance Routes — `/api/attendance`

All require JWT.

#### `POST /api/attendance`

**Purpose:** Log a headcount entry for a group session.

**Roles:** `usher`, `admin`.

**Request body:**
```json
{
  "groupId": 1,
  "sessionDate": "2026-05-11",
  "headcount": 138,
  "rsvpCount": 145,
  "overwrite": false
}
```

**`overwrite` flag:** If `false` (default), uses `prisma.attendance.create()` — returns 400 on duplicate. If `true`, uses `prisma.attendance.upsert()` — updates existing record for that group+date.

**Side effect:** After saving, fires a non-blocking POST to `ML_SERVICE_URL/retrain` to trigger model retraining.

**Response 201:** The created/updated `Attendance` record.
**Response 400:** Missing fields, or duplicate (when `overwrite: false`) — Prisma error P2002.

---

#### `GET /api/attendance/:groupId`

**Purpose:** Retrieve full attendance history for a group.

**Roles:** `usher`, `pastor`, `admin`.

**Response 200:** Array of `Attendance` records ordered by `sessionDate` ascending.

---

### 4.5 Feedback Routes — `/api/feedback`

All require JWT.

#### `POST /api/feedback`

**Purpose:** Submit aggregate session feedback (no individual text stored).

**Roles:** `member`, `usher`, `admin`.

**Request body:**
```json
{ "groupId": 1, "sessionDate": "2026-05-11", "avgRating": 4.2, "responseCount": 20 }
```

**Validation:** `avgRating` must be between 1 and 5 inclusive.

**Side effect:** Non-blocking POST to `ML_SERVICE_URL/retrain`.

**Response 201:** The created `Feedback` record.

---

#### `GET /api/feedback/:groupId`

**Purpose:** Retrieve feedback history for a group.

**Roles:** `pastor`, `admin`.

**Response 200:** Array of `Feedback` records ordered by `sessionDate` ascending.

---

### 4.6 Forecast Routes — `/api/forecast`

All require JWT. Restricted to `pastor` and `admin`.

#### `GET /api/forecast?group=<id>&horizon=<weeks>`

**Purpose:** Generate and persist a new forecast for a group; return forecast + historical data + optional alert.

**Roles:** `pastor`, `admin`.

**Query params:** `group` (required group ID), `horizon` (optional, default 4 weeks).

**Behaviour:**
1. Fetches the latest `Feature` row for the group.
2. POSTs to `http://localhost:5001/predict` with `{ group_id, features: [rollingAvg4w, trendSlope, rsvpRate, feedbackAvg] }`.
3. Persists result as a `Forecast` row.
4. Evaluates alert thresholds (>15% drop → `drop` alert; >10% growth → `growth` alert). Persists `Alert` if triggered.
5. Fetches last 12 weeks of attendance for chart context.

**Response 200:**
```json
{
  "forecast": { "id": 42, "groupId": 1, "predictedHeadcount": 131.2, "confidenceLower": 120.5, "confidenceUpper": 141.9, "forecastDate": "...", "generatedAt": "..." },
  "alert": { "id": 7, "alertType": "drop", "message": "Attendance may drop 16%...", "recommendation": "Consider hosting a reconnection event..." } | null,
  "historical": [ { "id": 1, "groupId": 1, "sessionDate": "...", "headcount": 138, "rsvpCount": 145, "recordedAt": "..." } ]
}
```

**Response 404:** No features found (pipeline not run), or no trained model for this group.
**Response 502:** ML service unreachable.

---

#### `GET /api/forecast/:groupId`

**Purpose:** Return chart-ready time-series data combining historical actuals and up to 5 sequential SVR predictions.

**Roles:** `pastor`, `admin`.

**Behaviour:**
1. Fetches last 5 historical attendance records (reversed to chronological order).
2. Fetches latest `Feature` row.
3. Calls ML `/predict` iteratively up to 5 times, advancing the date by 7 days each step. After each prediction, updates `currRolling` and `currTrend` heuristically for the next step.
4. Returns combined array.

**Response 200:** Array of chart data points:
```json
[
  { "date": "2026-04-06", "actual": 138, "predicted": null, "lowerBound": null, "upperBound": null },
  { "date": "2026-05-11", "actual": null, "predicted": 131.2, "lowerBound": 120.5, "upperBound": 141.9 }
]
```

---

### 4.7 Alerts Routes — `/api/alerts`

All require JWT. Restricted to `pastor` and `admin`.

#### `GET /api/alerts`

**Purpose:** List all alerts, with optional filtering.

**Roles:** `pastor`, `admin`.

**Query params:**
- `groupId` — filter to a specific group.
- `status=active` — filter to `acknowledged: false` only.
- `all=true` — return all regardless of status.

**Response 200:** Array of `Alert` objects, ordered by `createdAt` descending. Each alert includes an embedded `forecast` sub-object:
```json
{
  "forecast": { "predictedHeadcount": 131.2, "confidenceLower": 120.5, "confidenceUpper": 141.9 }
}
```

---

#### `PATCH /api/alerts/:id/acknowledge`

**Purpose:** Mark an alert as acknowledged (dismissed/seen).

**Roles:** `pastor`, `admin`.

**Behaviour:** Sets `acknowledged: true` on the alert. Does not delete it. Creates an audit trail.

**Response 200:** Updated `Alert` object.

---

### 4.8 Admin Routes — `/api/admin`

All require JWT.

#### `GET /api/admin/stats`

**Purpose:** Return live KPI counts for the dashboard stat cards.

**Roles:** All authenticated (no `requireRole` guard on this specific route — any JWT holder can call it).

**Behaviour:** Computes dynamically:
- `memberCount` — sum of the latest headcount across all groups.
- `groupCount` — total group count.
- `activeAlerts` — count of `acknowledged: false` alerts.

**Response 200:**
```json
{ "memberCount": 600, "groupCount": 6, "activeAlerts": 3 }
```

---

#### `POST /api/admin/import`

**Purpose:** Bulk-upsert historical attendance and feedback rows for a group.

**Roles:** `admin` only.

**Request body:**
```json
{
  "groupId": 1,
  "rows": [
    { "sessionDate": "2024-01-07", "headcount": 45, "rsvpCount": 38, "avgRating": 4.2, "responseCount": 20 }
  ]
}
```

**Behaviour:**
1. Validates group exists.
2. For each row: upserts `Attendance`; upserts `Feedback` if `avgRating` is present.
3. Counts imported vs skipped rows. Collects up to 10 error messages.
4. Triggers non-blocking POST to `ML_SERVICE_URL/retrain`.

**Response 200:**
```json
{ "imported": 8, "skipped": 0, "errors": [], "message": "Import complete. ML retrain triggered." }
```

---

#### `POST /api/admin/retrain`

**Purpose:** Manually trigger the ML pipeline retrain.

**Roles:** All authenticated (no `requireRole` guard — any JWT holder can call it).

**Behaviour:** POSTs synchronously to `ML_SERVICE_URL/retrain`. Waits for response.

**Response 200:** `{ "status": "Retrain triggered successfully", "timestamp": "..." }`
**Response 502:** ML service unreachable.

---

### 4.9 ML Routes — `/api/ml`

All require JWT.

#### `POST /api/ml/train-all`

**Purpose:** Run the full ML pipeline (feature engineering + training) synchronously via child process.

**Roles:** `admin`, `pastor`.

**Behaviour:**
1. Counts total groups.
2. Resolves the `ml/` directory path.
3. Executes `python pipeline.py && python train.py` in the `ml/` directory using `child_process.exec()`. This is **synchronous** — the HTTP request blocks until both scripts complete.

**Response 200:** `{ "success": true, "groups_trained": 6 }`
**Response 500:** If the Python process exits with an error.

---

## 5. ML Microservice

File: `ml/service.py`. Served at `http://localhost:5001`.

### 5.1 GET /health

Returns: `{ "status": "ok", "models_loaded": <count of .pkl files in models/> }`

No auth required.

---

### 5.2 POST /retrain

**Purpose:** Trigger full pipeline (feature engineering + model training) asynchronously in background.

**Behaviour:** Adds `run_ml_pipeline()` as a FastAPI `BackgroundTask`. Returns immediately.

`run_ml_pipeline()` calls `pipeline.run_pipeline()` then `train.main()` sequentially.

**Response 200:** `{ "status": "retraining started in background" }`

---

### 5.3 POST /predict

**Purpose:** Load a group's trained SVR model and return a point prediction with 95% confidence interval.

**Request body (Pydantic model `ForecastRequest`):**
```json
{ "group_id": 1, "features": [132.5, -1.8, 0.92, 4.1] }
```

Feature order (validated to exactly 4 values):
1. `rolling_avg_4w` — 4-week rolling average headcount
2. `trend_slope` — linear regression slope over last 8 weeks
3. `rsvp_rate` — RSVP conversion rate (0–1)
4. `feedback_avg` — average session rating (1–5)

**Validation:** `@field_validator('features')` enforces exactly 4 values. 422 returned otherwise.

**Behaviour:**
1. Resolves model path: `models/group_<group_id>.pkl`.
2. If file not found: raises `HTTPException(404, "No trained model for group N. Run train.py first.")`.
3. Loads bundle via `joblib.load()`: extracts `bundle['model']` (SVR estimator) and `bundle['scaler']` (StandardScaler).
4. Scales features: `X_s = scaler.transform(X.reshape(1,-1))`.
5. Predicts: `prediction = float(model.predict(X_s)[0])`, clamped to `max(0.0, prediction)`.
6. **Bootstrap CI:** Creates 200 perturbed copies of the input with Gaussian noise (mean=0, std=0.05, seed=42). Scales and predicts all 200. Computes `residual_std = std(bootstrap_preds)`. CI: `lower = max(0, pred - 1.96 * std)`, `upper = pred + 1.96 * std`.

**Response 200:**
```json
{ "predicted_headcount": 131.2, "confidence_lower": 120.5, "confidence_upper": 141.9 }
```

**Response 404:** No model file found.
**Response 422:** Invalid features array.

---

### 5.4 Feature Engineering Pipeline — `ml/pipeline.py`

**Entry point:** `run_pipeline()` — can be called from `service.py` or run as `python pipeline.py`.

**Data source:** Reads directly from SQLite via `sqlite3`. SQL joins `Attendance` LEFT JOIN `Feedback` on `(groupId, sessionDate)`. Missing feedback defaults to `avgRating = 3.0`.

**Features computed per group per session:**

| Feature | Formula |
|---|---|
| `rolling_avg_4w` | 4-week rolling mean of `headcount` (`min_periods=2`) |
| `trend_slope` | `numpy.polyfit` slope over last 8 sessions (`min_periods=3`). Returns 0.0 if fewer than 3 points. |
| `rsvp_rate` | `rsvpCount / headcount`, fillna(0), clipped to [0, 1] |
| `feedback_avg` | `avg_rating` column (defaulted to 3.0 from SQL COALESCE) |

**Output:** INSERTs rows into the `Feature` table. Note: uses raw SQLite INSERT — not an upsert. Running the pipeline multiple times will create duplicate Feature rows for the same group and date.

**Minimum data:** Rows with null `rolling_avg_4w` are dropped. Requires at least 2 attendance records before any feature rows are produced.

---

### 5.5 Model Training — `ml/train.py`

**Entry point:** `main()`.

**Data source:** Reads from SQLite. Joins `Feature` table to `Attendance` on `(groupId, sessionDate)`. Shifts headcount by -1 to create `target_headcount` (predicts *next* session's attendance, not current).

**Minimum records:** `MIN_RECORDS = 10` — groups with fewer joined feature+attendance rows are skipped.

**Train/test split:** Time-series aware — first 80% for training, last 20% for evaluation. No shuffling.

**Feature scaling:** `StandardScaler` — fit on training set only, applied to test set.

**Model:** `SVR(kernel='rbf')` with `GridSearchCV`:

| Hyperparameter | Search Space |
|---|---|
| `C` | [1, 10, 100] |
| `gamma` | ['scale', 'auto'] |
| `epsilon` | [0.1, 0.5] |

**Cross-validation:** `TimeSeriesSplit(n_splits=min(5, len(X_train)-1))`.

**Scoring:** `neg_mean_absolute_error`. Best estimator is refit on full training set.

**Evaluation:** MAE on held-out test set is printed.

**Serialisation:** `joblib.dump({'model': model, 'scaler': scaler}, 'models/group_<id>.pkl')`. One bundle per group, overwriting previous. Baseline models (mean, linear) are not stored — SVR is the only persisted model.

---

### 5.6 SUS Score Utility — `ml/sus_score.py`

Standalone utility for computing the **System Usability Scale** score from questionnaire responses.

- Takes a list of lists: each inner list is 10 integers in [1,5] from one respondent.
- Odd items (1,3,5,7,9): `value - 1`. Even items (2,4,6,8,10): `5 - value`. Sum × 2.5 → score per user.
- Returns mean across all respondents. Range: 0–100. Target: ≥ 68.
- `interpret_sus(score)` grades: ≥85.5 = Excellent, ≥72.6 = Good, ≥52.0 = OK, ≥38.0 = Poor, else Awful.

Not integrated into the running system — used for evaluation/reporting only.

---

### 5.7 Python Dependencies (`ml/requirements.txt`)

```
fastapi==0.115.6
uvicorn[standard]==0.32.1
scikit-learn==1.6.1
pandas==2.2.3
psycopg2-binary==2.9.10
joblib==1.4.2
statsmodels==0.14.4
pytest==8.3.4
httpx==0.28.1
numpy==1.26.4
python-dotenv==1.0.1
```

Note: `psycopg2-binary` and `statsmodels` are listed as dependencies but are not used in the current implementation.

---
*Continued in Part 3: Frontend Screens, Data Flow, Actors, Diagrams*
# CG Forecast — As-Is System Documentation · Part 3 of 3
### Frontend Screens, Data Flow, System Actors, Data Collection, Diagrams

---

## 6. Frontend Screens

The frontend is a React 18 SPA (Vite + TypeScript). There is no URL router. Navigation is managed by a `page` state variable in `App.tsx`. The `Navbar` component renders the sidebar. All pages receive `user` as a prop.

### 6.1 App Shell

**File:** `client/src/App.tsx`

- If `user` is null (not logged in), renders `<LoginPage>` only (with aurora background div).
- If logged in, renders `<Navbar>` + `<main class="page-canvas">` containing the active page component.
- Theme state (`dark`/`light`) is stored in `localStorage` key `app-theme`. Dark is default.
- `toggleTheme()` adds/removes `light-theme` class on `document.body`.

---

### 6.2 Navbar (Sidebar)

**File:** `client/src/components/Navbar.tsx`

**Structure:** Fixed left sidebar with three nav groups — Main, Intelligence, System.

**Navigation items and role access:**

| Item | Icon | Roles |
|---|---|---|
| Dashboard | ▦ | admin, pastor, usher, member |
| Attendance | ✔ | admin, pastor, usher |
| Feedback | ◎ | admin, pastor, usher, member |
| AI Forecast | ⟋ | admin, pastor |
| Alerts | ◈ | admin, pastor |
| Settings | ◻ | admin, pastor (System group) |
| Sign Out | ⇥ | all |

**Alert badge:** For `admin` and `pastor` roles, calls `GET /api/alerts?status=active` on mount and on every page change. Displays a `nav-pill` count badge next to the Alerts item if count > 0.

**Footer:** Displays role tag, user avatar (initials), name, and email.

---

### 6.3 Login Page

**File:** `client/src/pages/LoginPage.tsx`

**Modes:** Three UI states managed by `mode` state: `'login'`, `'signup'`, `'verification'`.

**Login mode components:**
- Logo (⛪ icon + "CG Forecast" title + "Faith Organization Growth Intelligence" subtitle)
- Email and password inputs with Enter-key submit
- "Sign In" button with loading state
- Error notice banner on failure
- "Don't have an account? Create one" link
- Separator with demo account pills (4 pre-defined accounts: Rev. Samuel Njoroge/pastor, Admin Grace Wanjiku/admin, Usher Daniel Kamau/usher, Mary Otieno/member). Clicking a pill auto-fills email and password fields.
- Email-verified success banner (shown when `?verified=true` in URL query string)

**Signup mode components:**
- Full Name, Email Address, Password fields
- Role dropdown (member, usher, pastor, administrator)
- Church/Campus text field (required in UI validation)
- "Sign Up" button; calls `POST /api/auth/register`
- On success, transitions to `verification` mode

**Verification mode:** Static screen showing email address. One button: "(Simulate) I've verified my email →" which returns to login mode.

**Demo passwords** (hardcoded in LoginPage):
- admin → `Admin1234!`
- pastor → `Pastor123!`
- usher → `Usher1234!`
- member → `Member123!`

---

### 6.4 Dashboard Page

**File:** `client/src/pages/DashboardPage.tsx`

**Access:** All roles.

**Data fetched on mount:**
- `GET /api/groups` → group list
- `GET /api/admin/stats` → `{ memberCount, groupCount, activeAlerts }`
- `GET /api/alerts` → finds first `alertType === 'drop'` for critical banner
- `GET /api/ml/accuracy` → SVR accuracy metrics
- `GET /api/admin/recent?limit=4` → recent attendance logs

**Components:**

1. **Page header** — "Good day, [FirstName]" greeting + current date (locale: `en-KE`).
2. **Alert banner** — shown if a `drop` alert exists; displays message, recommendation, "View Alerts" button. Styled as `notice notice-warn`.
3. **Bento stat cards (4):**
   - Total Members (from API `memberCount`)
   - Active Groups (from API `groupCount`)
   - Active Alerts (from API `activeAlerts`)
   - SVR Accuracy — dynamically derived from overall MAE via `/api/ml/accuracy`
4. **View toggle** — Cards / Table (inline tab strip).
5. **Cards view** — CSS grid. Each card shows: group name, status tag, dynamic member count and trend based on API data, and a 10-point sparkline generated programmatically.
6. **Table view** — `data-tbl` table with columns: Group, Category, Leader, Members, Trend, Status.
7. **Right sidebar (300px):**
   - Quick Actions: Log Attendance, Submit Feedback, AI Forecast, Manage Alerts
   - SVR Model Health: progress bars generated from real model accuracy data via `/api/ml/accuracy`.
   - Recent Activity: dynamically fetched from `/api/admin/recent`.
### 6.5 Attendance Page

**File:** `client/src/pages/AttendancePage.tsx`

**Access:** usher, pastor (via nav), admin.

**Two tabs:** Log Session | History

**Log Session tab — form fields:**
- **Onboarding Banner:** "New to the system? Start by importing your existing records via Data Import before logging new sessions."
- Faith Group (dropdown, from `GET /api/groups`)
- Session Date (date picker, defaults today, max = today)
- Headcount (number input, min 0, required)
- RSVP Count (number input, min 0, optional)
- Session Notes (textarea, UI-only)
- Submit and Clear buttons

**Validation:**
- Warning if headcount > RSVP count
- Duplicate detection: overwrite confirmation modal

**Real-time Rate Preview panel:**
- Shows `rate = headcount / rsvpCount * 100` with progress bar.

**History tab:**
- Group selector dropdown
- `GET /api/attendance/:groupId`
- Table: Date, Headcount, RSVP, Rate
- Export CSV button
### 6.6 Forecast Page

**File:** `client/src/pages/ForecastPage.tsx`

**Access:** pastor, admin only.

**Data flow:**
1. On mount: `GET /api/groups` and `GET /api/ml/accuracy`.
2. On group change: `GET /api/forecast?group=<id>` → receives `{ forecast, alert, historical }`.
3. Builds chart data.
4. Fetches forecasts for all groups in parallel for comparison table.

**Components:**

1. **Control row (glass panel):**
   - Group selector dropdown
   - KPI strip: Current attendance, 6-Week Predicted, Outlook %, Accuracy (dynamically derived)
2. **Forecast chart (Recharts AreaChart):**
   - X-axis: session dates
   - Series: `actual`, `predicted`, `hi`/`lo` confidence band
3. **Model Details (collapsible panel):**
   - Shows MAE, RMSE, Best Params, and Last Trained timestamp fetched from `/api/ml/accuracy`.
4. **Insight cards (3-column bento):**
   - Trend Direction, Confidence Interval, AI Recommendation
5. **Insufficient data empty state:** Needs at least 5 records or prompts user to use Data Import.
6. **All Groups Comparison table:** Group, Latest Actual, SVR Predicted, Change, Confidence Range.
### 6.7 Alerts Page

**File:** `client/src/pages/AlertsPage.tsx`

**Access:** pastor, admin only.

**Data fetched:** `GET /api/alerts?all=true` + `GET /api/groups` (to resolve group names from IDs).

**Components:**

1. **Header:** Title, subtitle, unacknowledged count badge (rose pill with pulsing dot).

2. **Filter bar:**
   - Status tabs: All | Pending (active) | Acknowledged (done)
   - Type buttons: All | ↘ Decline | ↗ Growth | → Stable

3. **Alert cards:** Each card shows:
   - Color-coded left accent border (rose=drop, emerald=growth, amber=stable)
   - Type icon + group name + type tag + "Acknowledged" tag if done + "⚡ Critical" pulsing tag if drop and not acked
   - Alert message and recommendation
   - "Generated: [date]"
   - "✓ Acknowledge" button (calls `PATCH /api/alerts/:id/acknowledge`, uses sonner toast)
   - "View Group" button (currently shows `alert()` placeholder)

4. **Empty state:** Icon + "No alerts" + "No alerts match your filters" + "Clear filters" button.

---

### 6.8 Feedback Page

**File:** `client/src/pages/FeedbackPage.tsx`

**Access:** All roles.

**Two tabs:** Submit | History

**Submit tab:**
- Faith Group (dropdown)
- Session Date
- Average Session Rating (1–5 star widget)
- Number of Respondents
- Key Themes / Notes
- Submit and Clear buttons

**Right sidebar:**
- Top Rated panel: dynamically fetches top groups based on feedback history.

**History tab:**
- Table: Group, Date, Avg Rating, Responses, Sentiment tag
### 6.9 Settings Page

**File:** `client/src/pages/SettingsPage.tsx`

**Access:** admin, pastor.

**Sidebar tabs:** My Profile | Notifications | ML Parameters | About System

**Profile tab:** Name and email inputs, Church Profile saving capabilities hooked to API.
**Notifications tab:** Checkbox toggles for system alerts.
**ML Parameters tab (admin-only):** Manual Retrain section.
**About System tab:** System metadata and scoping rules for Nairobi evangelical churches.
### 6.10 Import Page

**File:** `client/src/pages/ImportPage.tsx`

**Access:** admin only.

**4-step wizard:**

**Step 1 — Upload CSV:**
- Faith Group selector
- Textarea for CSV paste / Load 6-Month Sample
- "Map Columns →" button

**Step 2 — Church Profile:**
- Column Mapping (matching CSV headers to expected system fields)
- Church Profile form: Church Name, Active Membership, Primary Location, Years of Digital Records, Tech Stack.
- Saves profile demographic data via `POST /api/church/profile`.

**Step 3 — Review:**
- Table preview of mapped rows.
- "⚡ Import N Rows & Train SVR" button (calls `POST /api/admin/import`).

**Step 4 — Done:**
- Success celebration with import stats.
- Notice that SVR Retraining was triggered.

---

## 7. Data Flow — End to End

### 7.1 Attendance Submission to Forecast on Dashboard

```
1. USHER opens AttendancePage
   → UI fetches GET /api/groups (all groups, enriched)
   → Usher selects group, enters headcount + RSVP, clicks Submit

2. POST /api/attendance
   → Express authenticate middleware verifies JWT
   → requireRole(['usher','admin']) passes
   → Prisma upsert/create inserts Attendance row into SQLite
   → Non-blocking: axios.post("http://localhost:5001/retrain")
   → FastAPI /retrain: runs pipeline.run_pipeline() + train.main() in background
     → pipeline.py: reads Attendance + Feedback from SQLite
     → Computes rolling_avg_4w, trend_slope, rsvp_rate, feedback_avg
     → INSERTs rows into Feature table
     → train.py: reads Feature JOIN Attendance from SQLite
     → Scales features with StandardScaler
     → GridSearchCV with TimeSeriesSplit on SVR(kernel='rbf')
     → Saves models/group_<id>.pkl (model + scaler bundle)
   → Express responds 201 with Attendance record

3. USHER sees toast "Attendance logged"
   → AttendancePage switches to History tab
   → GET /api/attendance/:groupId refreshes history table

4. PASTOR navigates to ForecastPage
   → UI fetches GET /api/groups → selects group
   → UI calls GET /api/forecast?group=1

5. Express forecast.js GET handler:
   → Fetches latest Feature row for groupId from Prisma
   → axios.post("http://localhost:5001/predict", {
       group_id: 1,
       features: [rollingAvg4w, trendSlope, rsvpRate, feedbackAvg]
     })
   → FastAPI /predict:
     → Loads models/group_1.pkl via joblib
     → Scales input with stored StandardScaler
     → SVR.predict(X_scaled) → point prediction
     → Bootstrap 200 perturbations → std → 95% CI
     → Returns { predicted_headcount, confidence_lower, confidence_upper }
   → Express creates Forecast row in SQLite
   → Evaluates alert thresholds:
     - If drop > 15%: creates Alert row (alertType='drop')
     - If growth > 10%: creates Alert row (alertType='growth')
   → Fetches last 12 Attendance rows for chart context
   → Returns { forecast, alert, historical }

6. PASTOR sees ForecastPage render:
   → Recharts AreaChart shows historical actuals (green) + predicted point (dashed indigo) + CI band
   → KPI strip shows current, predicted, % change, 93.7% accuracy
   → Insight cards show trend direction, confidence range, AI recommendation

7. PASTOR navigates to AlertsPage
   → GET /api/alerts?all=true returns alerts including the newly created one
   → Alert card shown with ⚡ Critical tag
   → Pastor clicks "✓ Acknowledge"
   → PATCH /api/alerts/:id/acknowledge → sets acknowledged=true
   → Toast "Alert acknowledged"
   → Badge count decrements
```

---

## 8. System Actors

| Role | Who | Capabilities |
|---|---|---|
| **admin** | System administrator (e.g. Admin Grace Wanjiku) | Full access to all pages and API routes. Can create groups, create users (POST /api/users), bulk-import data, trigger retraining, access Settings > ML Parameters and Import Data. |
| **pastor** | Lead pastor / overseer (e.g. Rev. Samuel Njoroge) | Can view Dashboard, Attendance (read), Feedback (read+submit), AI Forecast, Alerts (acknowledge), Settings (notifications + ML retrain trigger). Cannot create groups or import data. |
| **usher** | Session doorkeeper / greeter (e.g. Usher Daniel Kamau) | Can view Dashboard, log Attendance (POST), submit Feedback. Cannot see Forecast or Alerts pages. Cannot create groups. |
| **member** | Faith organization member (e.g. Mary Otieno) | Can view Dashboard, submit Feedback. Cannot see Attendance history, Forecast, or Alerts. |

**Role enforcement is dual-layered:**
1. **Frontend (Navbar):** Nav items are filtered by role — ushers and members never see links to Forecast/Alerts.
2. **Backend (middleware):** Every protected route applies `requireRole([...])`. A usher JWT calling `GET /api/forecast` receives HTTP 403.

---

## 9. Current Data Collection Logic

### 9.1 Primary Input — Attendance Logger (UI form)

The main data entry path is the **Attendance Page** (`AttendancePage.tsx`). An usher or admin:
1. Selects a faith group from a dropdown.
2. Enters the session date (defaults to today, cannot be future).
3. Enters headcount (actual number present).
4. Optionally enters RSVP count.
5. Submits — data sent to `POST /api/attendance`.

No Google Forms integration exists in the current codebase. Data entry is entirely through the application UI.

### 9.2 RSVP Collection

RSVP count is entered manually alongside headcount in the same attendance form. There is no automated RSVP collection or webhook from external RSVP tools. The field is optional — if omitted, `rsvpCount` defaults to 0.

### 9.3 Feedback Collection

**Feedback Page** (`FeedbackPage.tsx`). Any authenticated user (member, usher, admin) can:
1. Select a group and date.
2. Choose a star rating (1–5).
3. Enter respondent count.
4. Add notes (textarea — displayed only in UI, not persisted).
5. Submit — sent to `POST /api/feedback`.

Only the aggregate rating and respondent count are stored. No individual text, no names.

### 9.4 Historical Data Import

Admins can bulk-import past data via the **Import Page** (`ImportPage.tsx`):
1. Paste a CSV with columns: `sessionDate`, `headcount`, `rsvpCount` (optional), `avgRating` (optional), `responseCount` (optional).
2. Preview rows in a table.
3. Confirm import — calls `POST /api/admin/import` which upserts attendance and feedback rows.
4. ML retraining is automatically triggered after import.

### 9.5 Automated Retraining Triggers

ML retraining (`POST /retrain` on the FastAPI service) is triggered automatically after:
- Every successful `POST /api/attendance`
- Every successful `POST /api/feedback`
- Every successful `POST /api/admin/import`

All three fire the retrain call non-blocking (`.catch()` swallows errors silently).

Manual retraining is available via:
- `POST /api/admin/retrain` (from Settings page or direct API call)
- `POST /api/ml/train-all` (runs pipeline + train synchronously via child process)

No scheduled cron job is active in the current code (`node-cron` is a listed dependency but no schedule is registered in `index.js`).

---

## 10. Diagrams Described in Text

### 10.1 Use Case Diagram

**Actors:** Admin, Pastor, Usher, Member (inheriting from authenticated User).

**Use cases by actor:**
- **All authenticated:** Login, Logout, View Dashboard, View Group List
- **Usher:** Log Attendance Session, Submit Session Feedback
- **Member:** Submit Session Feedback
- **Pastor:** View AI Forecast (per group), View Alert List, Acknowledge Alert, View Feedback History, Trigger Manual Retrain
- **Admin:** All Pastor use cases PLUS: Create Faith Group, Create User Account, Bulk Import Historical Data, Access ML Parameters Settings

**Include/extend relationships:**
- "Log Attendance" includes "Trigger ML Retrain" (async post-submission)
- "Submit Feedback" includes "Trigger ML Retrain"
- "View AI Forecast" includes "Persist Forecast Record" and conditionally extends "Generate Alert"

### 10.2 Data Flow Diagram (DFD) — Level 0

**External entities:** Usher, Member, Pastor/Admin, Email Server (Brevo SMTP)

**Single process:** CG Forecast System

**Data flows:**
- Usher → System: Session headcount + RSVP data
- Member → System: Session feedback ratings
- System → Pastor/Admin: Attendance history, forecasts, alerts
- System → Email Server: Verification emails, alert digest emails
- Email Server → Usher/Member: Verification link

### 10.3 DFD Level 1

**Processes:**
1. Authentication (Register, Verify Email, Login)
2. Attendance Management (Log, History, Export)
3. Feedback Management (Submit, History)
4. Feature Engineering (pipeline.py — rolling avg, slope, RSVP rate, feedback avg)
5. Model Training (train.py — GridSearchCV SVR per group)
6. Forecast Generation (load .pkl, predict, bootstrap CI, persist)
7. Alert Management (threshold check, create alert, acknowledge)

**Data stores:** User table, Group table, Attendance table, Feedback table, Feature table, Forecast table, Alert table, File system (models/*.pkl)

### 10.4 Sequence Diagram — Attendance Submission

```
Usher → AttendancePage: Fill form + click Submit
AttendancePage → Express POST /api/attendance: { groupId, sessionDate, headcount, rsvpCount, overwrite }
Express → authenticate middleware: verify JWT
Express → Prisma: attendance.create() or upsert()
Prisma → SQLite: INSERT or UPDATE
Express ->> FastAPI POST /retrain: (async, non-blocking)
FastAPI ->> pipeline.py: run_pipeline()
FastAPI ->> train.py: main()
Express → AttendancePage: 201 { Attendance record }
AttendancePage → Usher: Toast "Attendance logged"
```

### 10.5 Sequence Diagram — Forecast Request

```
Pastor → ForecastPage: Select group
ForecastPage → Express GET /api/forecast?group=1: JWT in header
Express → Prisma: feature.findFirst({ where: { groupId: 1 }, orderBy: featureDate desc })
Express → FastAPI POST /predict: { group_id: 1, features: [...] }
FastAPI → models/group_1.pkl: joblib.load()
FastAPI → SVR.predict(): point prediction
FastAPI → Bootstrap CI: 200 perturbations → std → lower/upper
FastAPI → Express: { predicted_headcount, confidence_lower, confidence_upper }
Express → Prisma: forecast.create()
Express → Prisma: alert.create() (if threshold crossed)
Express → Prisma: attendance.findMany() (last 12 for chart)
Express → ForecastPage: { forecast, alert, historical }
ForecastPage → Pastor: Recharts AreaChart + KPI strip + insight cards
```

### 10.6 Activity Diagram — ML Pipeline Full Cycle

```
START
→ New attendance OR feedback submitted via UI
→ POST /api/attendance or /api/feedback succeeds
→ Non-blocking POST to FastAPI /retrain
→ FastAPI BackgroundTasks: run_ml_pipeline()
  → pipeline.run_pipeline():
    → For each group:
      → Query Attendance LEFT JOIN Feedback
      → Compute rolling_avg_4w (4-week window)
      → Compute trend_slope (8-week polyfit)
      → Compute rsvp_rate (clamp 0-1)
      → Set feedback_avg (COALESCE default 3.0)
      → INSERT into Feature table
  → train.main():
    → For each group:
      → Query Feature JOIN Attendance (target = next session headcount)
      → IF rows < 10: SKIP group
      → 80/20 time-series split
      → StandardScaler fit on train set
      → GridSearchCV(SVR(rbf), {C, gamma, epsilon}, TimeSeriesSplit)
      → Evaluate MAE on test set
      → joblib.dump({model, scaler}, models/group_N.pkl)
→ Next GET /api/forecast uses updated .pkl
END
```

### 10.7 Entity Relationship Diagram (ERD)

```
USER ||--o{ GROUP : "leads (leaderId)"

GROUP ||--o{ ATTENDANCE   : "groupId"
GROUP ||--o{ FEEDBACK     : "groupId"
GROUP ||--o{ FEATURE      : "groupId"
GROUP ||--o{ FORECAST     : "groupId"
GROUP ||--o{ ALERT        : "groupId (denormalised)"

FORECAST ||--o{ ALERT : "forecastId"

ATTENDANCE: id, groupId, sessionDate*, headcount, rsvpCount, recordedAt
            unique(groupId, sessionDate)

FEEDBACK:   id, groupId, sessionDate*, avgRating, responseCount, createdAt
            unique(groupId, sessionDate)

FEATURE:    id, groupId, featureDate, rollingAvg4w, trendSlope,
            rsvpRate, feedbackAvg, computedAt

FORECAST:   id, groupId, forecastDate, predictedHeadcount,
            confidenceLower, confidenceUpper, generatedAt

ALERT:      id, forecastId, groupId, alertType, message,
            recommendation, acknowledged, createdAt
```

---

## 11. Anonymisation / Privacy Design

As documented in `docs/ethics_audit.md`:

| Principle | Implementation in Code |
|---|---|
| Data Minimisation | Only aggregate headcounts and average ratings stored — no individual survey responses |
| Anonymity | `Feedback` table has no `text`, `name`, `comment`, or `userId` column |
| Group-level Forecasting | All SVR predictions use `groupId` — no individual-level inference possible |
| Right to Erasure | No PII in feedback data; `User.name`/`User.email` exist only in User table for auth purposes |
| Aggregated Feedback | `POST /api/feedback` validates `avgRating ∈ [1,5]` — only accepts aggregate values |
| ML Models | `.pkl` bundles contain only fitted SVR + StandardScaler objects — no raw training data |
| RBAC | JWT-gated endpoints prevent members from accessing forecast, alert, or other users' data |

---

*End of CG Forecast As-Is Documentation — Parts 1, 2, 3*
