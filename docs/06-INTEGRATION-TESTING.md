# Safe Database-Backed Integration Testing

IKTIS integration tests write users, sessions, properties, rooms, tenants, tenancies, rent charges, payments, and payment allocations. Run them only against a disposable MySQL database created specifically for testing.

The password recovery feature also requires these production-only backend variables:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
```

Keep the Resend API key private. `RESEND_FROM_EMAIL` must be a sender address verified with Resend.
Password recovery is disabled unless `PASSWORD_RECOVERY_ENABLED=true`. When disabled, the recovery endpoints return `503 PASSWORD_RECOVERY_DISABLED` before any database lookup.

## 1. Create a dedicated MySQL database

Create a separate database or MySQL service named something like `iktis_integration_test`. Do not use the development database or the production Aiven database.

Create a MySQL connection URL for that database:

```text
mysql://<test-user>:<test-password>@<test-host>:<test-port>/iktis_integration_test
```

For a TLS-enabled provider, include that provider's required TLS query parameters. Keep the URL private.

## 2. Configure the test process

Open PowerShell and run:

```powershell
Set-Location 'D:\Iktis\backend'
$env:NODE_ENV = 'test'
$env:TEST_DATABASE_URL = '<dedicated-test-database-connection-string>'
$env:FRONTEND_URL = 'http://localhost:5173'
```

Do not set `TEST_DATABASE_URL` to the development or production `DATABASE_URL`. The application rejects a test URL that exactly matches `DATABASE_URL`.

The test URL is selected explicitly by the Prisma client when `NODE_ENV=test`. Tests never fall back to `DATABASE_URL`.

## 3. Apply the existing Prisma migration

The Prisma CLI reads `DATABASE_URL` from `schema.prisma`, while the application test client intentionally reads `TEST_DATABASE_URL`. Temporarily point the CLI variable at the same dedicated test database:

```powershell
$env:DATABASE_URL = $env:TEST_DATABASE_URL
npx prisma migrate deploy
Remove-Item Env:DATABASE_URL
```

This command creates the schema in the database named by `TEST_DATABASE_URL`, including the password-reset token table from the latest migration. Removing `DATABASE_URL` is important: it prevents the application test client from seeing an identical `DATABASE_URL`, which the safety guard rejects. It does not modify the application schema. Never run `prisma migrate reset` against a shared or production database.

## 4. Run the tests

Run one suite:

```powershell
npm run test:auth
```

Run all database-backed suites sequentially:

```powershell
npm run test:all
```

The database-backed npm scripts refuse to run unless `NODE_ENV=test` and `TEST_DATABASE_URL` are set. They also refuse to run with `NODE_ENV=production`.

The suites run sequentially and clean up records belonging to their generated test users. If a process is terminated abruptly, inspect the dedicated test database and remove leftover test records before the next run. Do not reuse the database for application development or production.

## Required variables

| Variable | Required for database-backed tests | Purpose |
|---|---:|---|
| `NODE_ENV` | Yes | Must be `test` |
| `TEST_DATABASE_URL` | Yes | Dedicated disposable MySQL database |
| `FRONTEND_URL` | Recommended | Local CORS origin; `http://localhost:5173` is the default in test mode |

`DATABASE_URL` is not used by the Prisma client in test mode. `PORT`, `VITE_API_BASE_URL`, `VITE_APP_TITLE`, `SESSION_SECRET`, and `COOKIE_SECRET` are not required by the database-backed test scripts.
