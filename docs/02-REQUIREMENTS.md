# IKTIS — Functional and Non-Functional Requirements

## 1. Functional requirements

### FR-01: Authentication
- A user can register, sign in, and sign out.
- Passwords are hashed; plain-text passwords are never stored.
- Protected API routes require a valid authenticated session.
- Authentication sessions are managed using secure HTTP-only cookies with appropriate `SameSite` and `Secure` settings.
- Do not store authentication tokens in `localStorage` or `sessionStorage`.
- Implement CSRF protection for all state-changing requests and rate limiting for authentication endpoints.
- Invalid credentials and expired sessions produce clear, non-sensitive errors.

### FR-02: Data ownership
- Each property and every related room, tenant, tenancy, rent charge, and payment belongs to a landlord account.
- The backend verifies ownership on every read, update, and delete.
- Knowing or guessing an ID must never allow access to another landlord's data.

### FR-03: Properties
- Create, view, edit, and archive/delete a property subject to relationship and history rules.
- Store a property name and address; optional fields may be added only when needed.
- Show the property's rooms, operational availability, and occupancy summary.
- Properties with linked tenancy or financial history must be soft-archived rather than hard-deleted.

### FR-04: Rooms
- Create, view, edit, and archive rooms. A room belongs to one property.
- Room operational/maintenance availability is stored as a distinct field (`isAvailable` / operational status).
- Room occupancy is dynamically derived from active tenancy date ranges covering the current date, never from a manually edited label.
- Prevent duplicate room identifiers within the same property.
- Rooms with historical tenancies or charges must be soft-archived rather than hard-deleted.

### FR-05: Tenants and tenancies
- Create, view, edit, and archive tenant records.
- Tenant identification: Do not impose a global unique constraint on tenant names. Define sensible validation for optional phone numbers and email addresses.
- Tenant deletion: Use archiving (`archivedAt`) where records have financial history, preserving associated rent charges, payments, and tenancies.
- Record tenancy: connect tenant to room with start date, optional end date, monthly rent in INR (₹), and rent due day.
- Overlap prevention: Validate dates and strictly prevent overlapping active tenancy assignments for the same room.
- Mid-month move-in/out: Do not automatically prorate rent in version 1. Allow the landlord to specify the actual amount due for an initial or final partial month.
- Rent changes: Must apply prospectively without modifying previously generated historical charges. A rent change is executed by closing the current tenancy (`endDate`) and initiating a successor tenancy with the updated monthly rent.

### FR-06: Rent charges
- The landlord manually generates monthly rent charges.
- Provide an idempotent bulk generation action for a selected month that generates charges for all active tenancies without creating duplicate charges.
- Canonical date-only rent periods (e.g. first day of rental month `YYYY-MM-01`) and due dates to avoid timezone-dependent month shifts.
- Store `amountDue` in INR (₹) using fixed-precision Decimal values.
- Enforce a unique constraint on `(tenancyId, period)` to prevent duplicate monthly charges.
- Support landlord-specified custom amounts for initial or final partial months.
- Historical rent charges remain immutable when tenancy terms change.

### FR-07: Payments
- Allow the landlord to manually record a payment in Indian Rupee (INR ₹).
- Store amount (fixed-precision Decimal), payment date, method/reference if provided, notes if needed, and the landlord/tenant relationship.
- Support partial payments and multiple payments against one rent charge.
- Overpayments: Reject payments or allocations that exceed the applicable outstanding balance. Do not introduce a tenant credit or wallet system in version 1.
- Payment corrections: Preserve an audit trail. Implement a safe void workflow (`voidedAt`, `voidReason`) so an incorrect payment cannot silently alter or erase historical records. Voiding a payment reverses its allocations and recalculates charge balances.
- Reject zero, negative, malformed, or excess amounts.
- Clearly distinguish recording a payment from processing an online transaction.

### FR-08: Balances and statuses
- Calculate outstanding balance: `outstanding = amountDue - sum(valid non-voided allocations)`.
- Payment allocation: FIFO (oldest outstanding charge first) by default, with an option for the landlord to allocate against specific outstanding charges.
- Support unpaid, partially paid, paid, and overdue states.
- Allocations must never exceed the remaining balance of a rent charge.
- Dashboard totals must use the same calculation and allocation rules as detail pages.

### FR-09: Dashboard
- Show key totals for the selected canonical period: rent due, payments received, outstanding balance, and occupancy rate.
- Display all financial totals formatted in Indian Rupee (INR ₹).
- Show recent payment/activity records, including voided state indicators where applicable.
- Provide useful empty states when no properties or payments exist.
- Label the date range and currency used for totals.

### FR-10: Search and filtering
- Search tenants (by name, phone, or email) and properties by name/address.
- Filter rent records by period and payment status.
- Use pagination or another bounded result strategy when lists grow.

### FR-11: User experience
- Forms provide client-side feedback and server-side validation using Zod.
- Buttons show a pending state during requests and prevent accidental duplicate submissions.
- Errors are understandable without exposing stack traces or secrets.
- Layout works at desktop, tablet, and mobile widths.
- Important actions are keyboard accessible.

## 2. Non-functional requirements

### Security and privacy
- Keep secrets in environment variables; commit only `.env.example` placeholders.
- Hash passwords with a suitable password-hashing library (e.g. bcrypt).
- Authentication sessions managed via secure HTTP-only cookies with `SameSite` and `Secure` flags.
- Do not store authentication tokens in `localStorage`.
- Implement CSRF protection for all cookie-authenticated state-changing requests.
- Rate-limit sensitive endpoints such as login and registration.
- Use HTTPS in production.
- Configure CORS for the known frontend origin.
- Avoid logging passwords, session tokens, or unnecessary tenant personal data.
- Use server-side authorization for every resource.

### Data integrity
- Use foreign keys and appropriate unique constraints (e.g. `(tenancyId, period)`).
- Use database transactions (`prisma.$transaction`) for operations that record payments, allocations, or void events.
- Store money using fixed-precision Decimal types (`Decimal(10, 2)`), never floating-point values.
- Currency is standardized to INR (₹).
- Use canonical date-only storage (`@db.Date`) for periods and due dates to avoid timezone-induced month shifts.
- Define soft-archiving rules (`archivedAt`) for properties, rooms, and tenants linked to financial history.

### Reliability
- Show an actionable message when the API or database is unavailable.
- Keep production data in a persistent database.
- Plan and periodically test database backups before relying on the app for real records.

### Maintainability
- Use JavaScript modules with clear responsibilities.
- Keep routes, controllers, validation, and database access organized.
- Keep API responses consistent.
- Document important schema and API changes.

### Performance
- Avoid fetching all records when only a summary or page of results is required.
- Index common relationship, period, and status queries where justified.
- Optimize only after measuring real bottlenecks.

## 3. Acceptance tests for the first release

- A user cannot view another landlord's records by changing an ID in a request.
- A room cannot have two overlapping active tenancies.
- Room occupancy correctly reflects active tenancy date ranges while room operational availability remains an independent toggle.
- A rent charge cannot be duplicated for the same tenancy and period upon repeating the bulk generation action (idempotency).
- Landlord can specify a custom charge amount for an initial or final partial month without automated proration errors.
- Two partial payments correctly reduce the same rent balance.
- Payment allocation applies to oldest charge first (FIFO) unless specific charges are selected.
- A payment or allocation exceeding the outstanding balance is rejected with an actionable error.
- A payment cannot be recorded with a negative or zero amount.
- Voiding a payment marks it voided with a reason, reverses allocations, restores the charge balance, and preserves the audit record.
- Tenant with financial history is archived (`archivedAt`) rather than deleted; past charges and payments remain intact.
- Dashboard totals match the underlying rent charges and payments for the selected canonical period in INR (₹).
- Refreshing the page does not erase saved records or lose authentication state.
- Authentication cookies are HTTP-only; no tokens are found in `localStorage`.
- Signing out prevents access to protected API data.
- Empty, loading, validation-error, and server-error states are handled.
- The main workflows remain usable on a narrow mobile viewport.
