# IKTIS — Application Architecture

## 1. Technology choices

- **Frontend:** React + JavaScript + Vite
- **Styling:** Tailwind CSS, with design tokens defined as CSS variables (Apple-inspired palette)
- **Routing:** React Router
- **HTTP client:** Axios (configured with `withCredentials: true` for cookie handling and CSRF headers)
- **Backend:** Node.js + JavaScript + Express
- **Database:** MySQL
- **ORM:** Prisma (using `Decimal(10, 2)` for INR ₹ currency, canonical `@db.Date` for periods and due dates)
- **Validation:** Zod (for request bodies, query params, and route params)
- **Authentication:** Database-backed sessions (Option B). Cryptographically random opaque session tokens delivered in HTTP-only cookies, verified against SHA-256 token hashes stored in the MySQL `Session` table.
- **Security:** CSRF defense for state-changing requests, rate limiting on auth endpoints
- **Version control:** Git and GitHub

Do not use TypeScript in this project unless the user explicitly changes this decision.

## 2. High-level request flow

1. The browser renders the React interface.
2. A frontend service sends an HTTP request using Axios (`withCredentials: true`).
3. Express middleware applies security controls: rate limiting, CORS, CSRF validation, and session verification via HTTP-only cookie.
4. Route-level Zod schemas validate request input.
5. A controller delegates to dedicated service modules.
6. The service layer applies business rules (ownership checks, idempotent rent generation, FIFO payment allocations, payment void reversals) and executes queries/transactions via Prisma.
7. The API returns a consistent JSON response.
8. The frontend updates view state and handles loading, error, and empty states.

The frontend must not connect directly to MySQL, contain database credentials, or store authentication tokens in `localStorage`.

## 3. Proposed folder structure

```text
iktis/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── utils/
│       └── server.js
│
├── .gitignore
├── package.json
└── README.md
```

Create files when implementing each feature; do not create large numbers of empty placeholder files.

## 4. Backend responsibilities

- `config/`: database and runtime configuration.
- `routes/`: endpoint definitions and middleware composition.
- `controllers/`: translate HTTP requests/responses and call services.
- `services/`:
  - `authService`: password hashing, session/cookie generation, CSRF validation.
  - `propertyService` & `roomService`: property management, room operational availability flags, derived occupancy queries.
  - `tenancyService`: tenancy assignments, overlap prevention, safe prospective rent change workflow.
  - `rentService`: manual rent generation, idempotent monthly bulk generation (`YYYY-MM-01`), custom initial/final month amounts.
  - `paymentService`: manual payment recording, FIFO vs. targeted allocation, overpayment validation (strict rejection), auditable payment voiding with allocation reversal.
  - `dashboardService`: period aggregations in INR (₹) and recent activity logs.
- `validators/`: Zod schemas for request bodies, query parameters, and route parameters.
- `middleware/`: authentication (`requireAuth`), error handling, rate limiting (`authLimiter`), CSRF protection, and ownership verification.
- `utils/`: currency formatting, canonical date-only helpers, response helpers.
- `prisma/`: database schema and migrations.

Keep all financial calculations and balance logic in the backend service layer so the dashboard and detail pages use identical rules.

## 5. Frontend responsibilities

- `pages/`: route-level screens (Dashboard, Properties, Rooms, Tenants, Rent, Payments).
- `components/`: reusable inputs, buttons, tables, status badges (Paid, Partial, Overdue, Due, Voided, Occupied, Maintenance), dialogs, and feedback components.
- `layouts/`: authenticated application shell and navigation.
- `services/`: Axios instance configured with `withCredentials: true`, CSRF token interceptor, and API functions.
- `context/`: minimal shared session context (authenticated user state).
- `hooks/`: reusable React hooks.
- `utils/`: Indian Rupee formatting (`₹`), date formatting, and UI helpers.
- `index.css`: global reset, design tokens, typography, and accessible focus styles.

Do not put database or authorization logic in the frontend. Hiding a button is not a substitute for backend authorization. Do not store auth tokens in `localStorage`.

## 6. API conventions

- Use a versionable prefix such as `/api`.
- Return JSON with a consistent success/error shape.
- Use appropriate HTTP status codes.
- Validate all untrusted input on the server.
- Never trust an owner ID supplied by the browser; derive the authenticated owner from the verified session.
- Use pagination for growing lists.
- Avoid returning password hashes, tokens, or unnecessary tenant details.
- Document endpoints as they are implemented.

Example response shape:

```json
{
  "success": true,
  "data": {}
}
```

Error responses should expose a safe message and, where useful, a stable error code. Production responses must not expose stack traces.

## 7. Authentication and security

- **Password Hashing:** Passwords hashed using `bcryptjs` (salt rounds >= 12); plain-text passwords are never stored.
- **Database-Backed Session Lifecycle (Option B):**
  - An opaque, cryptographically random session token (32 bytes generated via `crypto.randomBytes(32).toString('hex')`) is generated upon login/registration.
  - The plaintext token is sent to the client solely via an HTTP-only cookie (`httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`).
  - Plaintext tokens are **never** stored in the database. Only a SHA-256 hash (`crypto.createHash('sha256').update(token).digest('hex')`) is stored in the MySQL `Session` table as `tokenHash`.
  - Server validation middleware extracts the cookie, computes its SHA-256 hash, and queries `Session` where `tokenHash = hash`, `revokedAt IS NULL`, and `expiresAt > NOW()`, eager-loading `User`.
  - On logout, the session is invalidated by setting `revokedAt = NOW()` and clearing the cookie.
  - On password change, all active sessions for the user are revoked in bulk (`UPDATE Session SET revokedAt = NOW() WHERE userId = :userId AND revokedAt IS NULL`).
- **No tokens in `localStorage` or `sessionStorage`:** Frontend JavaScript has zero access to auth tokens.
- **CSRF Defense:** Implement CSRF protection for all state-changing HTTP methods (POST, PUT, PATCH, DELETE) using a CSRF token header verified against a secure cookie (e.g. double-submit cookie pattern).
- **Rate Limiting:** Protect sensitive endpoints (`/api/auth/login`, `/api/auth/register`) with rate limiters (`express-rate-limit`).
- **Resource Ownership:** Protect every private endpoint with authentication and resource-ownership checks (`ownerId = req.user.id`).
- **Environment Secrets:** Keep real credentials in ignored environment files (`.env`). Commit only `.env.example` files containing placeholder values.

## 8. Environment configuration

Expected configuration will be documented as implementation begins. Likely values include:

- `DATABASE_URL`
- Authentication/session secret
- API port
- Frontend origin / allowed CORS origin
- Frontend API base URL

Use different local and production values. Never put backend secrets in variables exposed to the frontend build (for example, `VITE_*` variables).

## 9. Development and deployment strategy

1. Build and verify the local database connection.
2. Implement one vertical feature slice at a time: schema → API → UI → tests.
3. Use migrations for schema changes.
4. Test core workflows locally with realistic data.
5. Deploy the backend and frontend with correct environment configuration.
6. Connect the backend to a persistent production MySQL service.
7. Verify authentication, ownership isolation, payment calculations, and persistence in production.
8. Set up and test database backups before storing real rental records.

Hosting choices should be evaluated when the application is functional; student-pack benefits must be checked for current eligibility and limits rather than assumed.

## 10. Implementation milestones

1. Project scaffolding and lint/dev scripts.
2. MySQL connection and reviewed Prisma schema.
3. Authentication and account isolation.
4. Properties and rooms.
5. Tenants and tenancy history.
6. Rent charges.
7. Payments and allocations.
8. Dashboard and reporting.
9. Accessibility, responsive design, and security testing.
10. Production deployment and backups.

Do not build all screens before the API and database behavior is understood. Complete and test each workflow end to end.
