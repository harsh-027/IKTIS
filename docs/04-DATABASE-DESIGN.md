# IKTIS — Database Design (Proposed)

## 1. Database principles

- Use **MySQL** with **Prisma**.
- The database is the source of truth; frontend state is not permanent storage.
- Use fixed-precision decimal fields for monetary values, never JavaScript floating-point arithmetic as the stored financial representation.
- Use foreign keys, appropriate indexes, and transactions for related financial updates.
- Every landlord-owned resource must be scoped to the authenticated user.
- Preserve financial and tenancy history; archive or deactivate records instead of cascading away important history.

This is a planning model. Final Prisma field types, names, constraints, and migration details must be reviewed before implementation.

## 2. Proposed entities

### User
Represents a landlord account.

Fields:
- `id`
- `name`
- `email` (unique)
- `passwordHash`
- `createdAt`
- `updatedAt`

### Session
Represents an authenticated landlord session (Option B: database-backed sessions).

Fields:
- `id`
- `userId` → User
- `tokenHash` (unique string; SHA-256 hash of the opaque session token)
- `expiresAt` (DateTime; session expiration timestamp)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `revokedAt` (nullable DateTime; set upon logout or bulk revocation)

*Security details:*
- The raw session token is an opaque, cryptographically random string stored solely in a client-side HTTP-only cookie (`SameSite: 'lax'`, `Secure: process.env.NODE_ENV === 'production'`, `Path: '/'`).
- Plaintext session tokens are never stored in the database; only `tokenHash` (SHA-256) is persisted and indexed.
- On logout, the session is explicitly invalidated (marked with `revokedAt` or deleted).
- On password change, all active sessions belonging to the `userId` are revoked in bulk.

### Property
A property owned by one user.

Fields:
- `id`
- `ownerId` → User
- `name`
- `address`
- `createdAt`
- `updatedAt`
- `archivedAt` (nullable; soft-archive to preserve historical records)

### Room
A room inside a property.

Fields:
- `id`
- `propertyId` → Property
- `label` or `roomNumber`
- `description` (optional)
- `isAvailable` (Boolean, default `true`; tracks room operational/maintenance availability)
- `createdAt`
- `updatedAt`
- `archivedAt` (nullable; soft-archive if room has past tenancies)

*Note on occupancy:* A room's current occupancy is dynamically derived from active tenancy dates (where `startDate <= TODAY` and `(endDate IS NULL OR endDate >= TODAY)`). It is not stored as an independently editable label.

### Tenant
A tenant/person record owned by a landlord.

Fields:
- `id`
- `ownerId` → User
- `fullName` (no global unique constraint; multiple tenants may share names)
- `phone` (optional, validated string format)
- `email` (optional, validated email format)
- `notes` (optional; avoid storing unnecessary sensitive information)
- `createdAt`
- `updatedAt`
- `archivedAt` (nullable; soft-archive when linked to tenancies/charges/payments)

### Tenancy
Connects a tenant to a room for a date range and records the agreed rental terms.

Fields:
- `id`
- `ownerId` → User
- `tenantId` → Tenant
- `roomId` → Room
- `startDate` (canonical date `@db.Date`)
- `endDate` (canonical date `@db.Date`, nullable while active)
- `monthlyRent` (Decimal `10, 2` in INR ₹)
- `rentDueDay` (Integer, 1–31)
- `createdAt`
- `updatedAt`

*Overlap prevention:* The backend must prevent overlapping active tenancies for the same room.
*Rent change workflow:* Rent changes must apply prospectively without rewriting historical charges. To adjust rent, conclude the current tenancy (setting `endDate`) and create a successor `Tenancy` record with updated terms.

### RentCharge
A rent amount due for a specific tenancy and rental period.

Fields:
- `id`
- `ownerId` → User
- `tenancyId` → Tenancy
- `period` (canonical date-only `@db.Date`, representing first day of the rental month `YYYY-MM-01`)
- `amountDue` (Decimal `10, 2` in INR ₹; supports custom amount for partial initial/final months)
- `dueDate` (canonical date `@db.Date`)
- `createdAt`
- `updatedAt`

*Idempotency:* A unique constraint on `(tenancyId, period)` prevents duplicate monthly charges. The bulk generation action executes idempotently by skipping existing `(tenancyId, period)` pairs.

### Payment
A manually recorded receipt of money in INR (₹).

Fields:
- `id`
- `ownerId` → User
- `tenantId` → Tenant
- `amount` (Decimal `10, 2` in INR ₹; strictly > 0)
- `paidAt` (canonical date `@db.Date` or DateTime)
- `method` (optional: Cash, UPI, Bank Transfer, Cheque, etc.)
- `reference` (optional)
- `notes` (optional)
- `createdAt`
- `updatedAt`
- `voidedAt` (nullable DateTime; set when payment is voided)
- `voidReason` (nullable String; mandatory audit explanation when voided)

A payment record means the landlord recorded a payment; it does not process an online transaction.

### PaymentAllocation
Connects a payment to one or more rent charges, supporting partial payments and payments covering multiple charges.

Fields:
- `id`
- `ownerId` → User
- `paymentId` → Payment
- `rentChargeId` → RentCharge
- `amountAllocated` (Decimal `10, 2` in INR ₹)
- `createdAt`

*Allocation rules:*
- Allocations apply FIFO (oldest outstanding charge first) by default, or to specific charges selected by the landlord.
- The sum allocated from a payment must exactly equal the payment's `amount`.
- Overpayments are strictly rejected: an allocation cannot exceed the remaining balance of the targeted `RentCharge`. No tenant credit/wallet system exists in version 1.
- Voiding a payment invalidates its allocations and immediately recalculates the outstanding balances.

## 3. Relationships

- User 1 → many Sessions (cascades on user deletion).
- User 1 → many Properties.
- Property 1 → many Rooms.
- User 1 → many Tenants.
- Tenant 1 → many Tenancies over time.
- Room 1 → many historical Tenancies.
- Tenancy 1 → many RentCharges.
- Tenant 1 → many Payments.
- Payment many ↔ many RentCharges through PaymentAllocation.

## 4. Balance and status rules

For a rent charge:

`outstanding = amountDue - sum(valid non-voided allocations)`

- **Unpaid:** no valid non-voided allocation exists (`sum = 0`).
- **Partially paid:** valid allocations are greater than zero but less than `amountDue`.
- **Paid:** valid allocations equal `amountDue` (`outstanding = 0`).
- **Overdue:** the canonical `dueDate` has passed (`dueDate < CURRENT_DATE`) and an outstanding balance remains (`outstanding > 0`).

The UI displays both status and the remaining balance in INR (₹). Dashboard summaries calculate aggregate figures directly from stored charges and valid non-voided allocations for the selected canonical period.

## 5. Constraints and indexes to consider

- Unique `User.email`.
- Unique `Session.tokenHash`.
- Unique `(propertyId, label)` on `Room` to prevent duplicate room labels within a property.
- Unique `(tenancyId, period)` on `RentCharge` to enforce idempotency.
- Indexes on:
  - `Session(userId, expiresAt, revokedAt)`
  - `RentCharge(ownerId, period)`
  - `RentCharge(tenancyId, dueDate)`
  - `Payment(ownerId, paidAt)`
  - `PaymentAllocation(paymentId)`
  - `PaymentAllocation(rentChargeId)`
  - `Tenancy(roomId, startDate, endDate)`
- Verify ownership (`ownerId = req.user.id`) for every query and mutation.
- Use `prisma.$transaction` when recording payments with allocations or voiding payments.

## 6. Finalized business rules for version 1

1. **Currency:** Indian Rupee (INR, `₹`). Stored as `Decimal(10, 2)`.
2. **Rent generation:** Manual landlord action. An idempotent bulk generation endpoint creates charges for all active tenancies for a selected canonical month (`YYYY-MM-01`), safely skipping existing charges without error.
3. **Partial payments:** Supported. Multiple payments can allocate against one rent charge.
4. **Payment allocation:** FIFO by default (oldest unpaid charge first), with an option for the landlord to allocate against specific outstanding charges.
5. **Overpayments:** Strictly rejected. Total payment/allocation cannot exceed the target charge balance. No credit/wallet system in version 1.
6. **Rent changes:** Prospective only. Historical charges remain unchanged. Landlord concludes current tenancy and starts a successor tenancy with updated terms.
7. **Mid-month move-in/out:** No automatic proration in version 1. Landlord manually specifies the `amountDue` for initial or final partial-month charges.
8. **Authentication:** Database-backed sessions (Option B). Cryptographically random opaque session tokens delivered in secure HTTP-only cookies (`SameSite: 'lax'`, `Secure: process.env.NODE_ENV === 'production'`, `Path: '/'`). Plaintext tokens are never stored; only the SHA-256 hash (`tokenHash`) is stored in the MySQL `Session` table. Invalidation on logout and bulk session revocation on password change. No tokens in `localStorage`. CSRF protection for state-changing requests and rate limiting on auth endpoints.
9. **Payment corrections:** Auditable void workflow (`voidedAt`, `voidReason`). Voiding a payment releases allocations and restores rent charge balances without deleting financial history.
10. **Tenant deletion:** Soft archiving (`archivedAt`) when financial records or tenancies exist, preserving historical reports and charges.
11. **Occupancy:** Dynamically derived from tenancy dates. Room operational/maintenance availability is stored in `Room.isAvailable`.
12. **Tenant identification:** No global unique constraint on tenant names. Standard regex/Zod validation for optional phone numbers and emails.
13. **Period handling:** Canonical date-only values (`@db.Date`) for periods (`YYYY-MM-01`) and due dates avoid timezone-induced date shifts.

## 7. Status before schema file generation

All business logic, entities, field types, security specifications (Option B database sessions), and financial rules are fully finalized. The next step is reviewing the formal Prisma schema and waiting for approval before creating `prisma/schema.prisma`.
