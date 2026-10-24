# IKTIS — Product Requirements Document (PRD)

## 1. Product summary

**IKTIS** is a web application that helps a landlord manage rental properties and maintain reliable records of rooms, tenants, monthly rent, and manually recorded payments.

## 2. Problem

Rental details may be spread across notebooks, messages, and spreadsheets. This makes it harder to answer basic questions: who occupies each room, how much rent is due, what has been paid, and what remains outstanding.

IKTIS centralizes these records in one authenticated application.

## 3. Target users

- A landlord or property owner managing one or more properties.
- Initially, a small-scale user managing rentals for personal, family, or familiar use.

The first release is landlord-facing. It is not a public property-listing marketplace.

## 4. Goals

1. Keep property, room, and tenant records organized.
2. Track monthly rent obligations and payment history.
3. Support full and partial payments recorded manually by the landlord.
4. Show accurate paid, unpaid, and outstanding balances.
5. Preserve records across refreshes and new sessions using a persistent MySQL database.
6. Protect each landlord's data from access by other accounts.
7. Provide a clear, responsive, Apple-inspired interface without sacrificing usability.

## 5. Success criteria

The first release is considered usable when a landlord can:

- Register and sign in securely.
- Create and update a property and its rooms.
- Register a tenant and assign the tenant to a room for a period of tenancy.
- Set the agreed rent and track rent due for a month.
- Record a full or partial payment and view the payment history.
- See dashboard totals that match the stored records.
- Refresh or sign out and return without losing saved data.
- Use the app on desktop and mobile-sized screens.

## 6. Scope

### Included in the first release

- Authentication and account settings basics via secure HTTP-only cookies (SameSite, Secure), rate limiting, and CSRF protection (no tokens in `localStorage`).
- Property and room management, tracking room operational/maintenance availability separately from derived occupancy.
- Tenant records (without global unique constraint on names) and room/tenancy assignments with strict overlap prevention.
- Safe tenancy archival when financial records exist to protect historical integrity.
- Manual monthly rent charge generation with an idempotent bulk generation action for a selected month.
- Landlord-specified custom amounts for initial or final partial months (no automated proration in version 1).
- Prospective rent changes that preserve historical charges.
- Manual payment entry in Indian Rupee (INR ₹) using fixed-precision decimals, supporting full and partial payments.
- Payment allocation: FIFO by default, with an option to allocate to specific outstanding charges.
- Strict rejection of overpayments (amounts exceeding outstanding balance; no credit/wallet system in version 1).
- Auditable payment corrections through a safe void workflow preserving history.
- Payment history and outstanding balance calculations.
- Dashboard summaries (in INR ₹) and recent activity.
- Search, filtering, form validation, and useful empty/error/loading states.
- Responsive layout and accessible interactions.

### Not included initially

- Online payment gateway or collecting money through the app.
- Tenant-facing accounts or a tenant portal.
- Tenant credit, deposit holding, or wallet system (overpayments are rejected).
- Automatic mid-month proration calculations.
- Public property marketplace or listing discovery.
- Native Android/iOS app.
- Advanced accounting, tax filing, or automated legal notices.
- Real-time chat, complex notifications, or multi-role staff administration.
- AI-based rent predictions or other speculative features.

## 7. Product principles

- **Correctness first:** rent and payment totals must be traceable to stored records.
- **Simple workflow:** common landlord tasks should require as few clear steps as practical.
- **Privacy by default:** all tenant and financial records are private to the owning landlord.
- **No fake functionality:** controls should work, or clearly be marked as unavailable.
- **Progressive development:** build and test one complete workflow at a time.
- **Maintainability:** use small, understandable JavaScript modules and documented API contracts.

## 8. Primary user journey

1. Sign up and sign in (session maintained via secure HTTP-only cookie).
2. Create a property.
3. Add rooms (setting operational status).
4. Add a tenant and record their room/tenancy assignment with monthly rent (in INR ₹) and due day.
5. Review or generate monthly rent charges manually (single or idempotent bulk generation for a selected month).
6. Adjust initial partial-month charge amount if the tenant moved in mid-month.
7. Record a payment (full or partial), allocated FIFO or to specific charges.
8. Review the updated balance, payment history, and dashboard.

## 9. Finalized v1 business rules and foundational decisions

- **Currency:** Indian Rupee (INR, symbol: `₹`). Stored as fixed-precision `Decimal` in MySQL/Prisma.
- **Rent generation:** Manual landlord action. An idempotent bulk generation action creates charges for active tenancies for a selected month without duplicates.
- **Partial payments:** Fully supported; a rent charge can accept multiple partial payments.
- **Payment allocation:** FIFO (oldest outstanding charge first) by default, with an option for the landlord to allocate against specific outstanding charges.
- **Overpayments:** Payments or allocations exceeding the target outstanding balance are strictly rejected; no tenant credit or wallet system in version 1.
- **Rent changes:** Prospective only. Changing rent terms requires closing/versioning tenancy agreements so previously generated rent charges remain intact.
- **Partial months:** No automatic proration in version 1. The landlord specifies the actual amount due for initial or final partial months.
- **Authentication:** Managed via secure HTTP-only cookies with `SameSite` and `Secure` flags. No authentication tokens in `localStorage`. CSRF protection for state-changing requests and rate limiting on auth endpoints.
- **Payment corrections:** Payments cannot be silently deleted or altered. An auditable void workflow marks payments as voided with a reason and reverses associated allocations.
- **Deletion and archiving:** Soft archiving (`archivedAt`) is used for tenants, rooms, and properties with financial history to preserve integrity.
- **Occupancy vs. availability:** Occupancy is derived from active tenancy date ranges. Room operational/maintenance availability is a separate administrative field.
- **Tenant identification:** No global unique constraint on tenant names. Standard validation applies to optional phone numbers and email addresses.
- **Period handling:** Canonical date-only rent periods (e.g. `YYYY-MM-01`) and due dates avoid timezone-induced month shifting.
