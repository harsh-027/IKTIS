# IKTIS

IKTIS is a landlord-focused rent-management web application for tracking properties, rooms, tenants, monthly rent, manual payments, outstanding balances, and rental activity.

> IKTIS is the new project name replacing **Rentit**. Use IKTIS in new UI copy, documentation, repository descriptions, and branding.

## Planned technology

- **Frontend:** React with JavaScript, Vite, and Tailwind CSS
- **Backend:** Node.js with JavaScript and Express
- **Database:** MySQL
- **Database access:** Prisma ORM
- **Validation:** Zod
- **Authentication:** Secure server-managed authentication using HTTP-only cookies
- **Version control:** Git and GitHub

TypeScript is not part of the planned stack.

## Core workflow

1. A landlord creates an account and signs in securely (HTTP-only cookie session).
2. The landlord creates properties and rooms (tracking operational availability).
3. The landlord registers tenants and records room/tenancy assignments (occupancy is dynamically derived).
4. The landlord manually generates monthly rent charges (with idempotent bulk generation for a chosen month).
5. The landlord manually records full or partial payments in INR (₹), allocated FIFO or to specific charges.
6. The dashboard shows collected rent, outstanding balances, occupancy, and recent activity.

The first release does **not** include an online payment gateway, tenant marketplace, native mobile app, or complex accounting features.

## Documentation

- [`docs/01-PRD.md`](docs/01-PRD.md) — product vision and scope
- [`docs/02-REQUIREMENTS.md`](docs/02-REQUIREMENTS.md) — functional and non-functional requirements
- [`docs/03-UI-DESIGN.md`](docs/03-UI-DESIGN.md) — visual and interaction design rules
- [`docs/04-DATABASE-DESIGN.md`](docs/04-DATABASE-DESIGN.md) — proposed entities and relationships
- [`docs/05-ARCHITECTURE.md`](docs/05-ARCHITECTURE.md) — application structure and request flow

## Design references

Two user-provided references guide the interface:

- `DESIGN-apple.md`: Apple-inspired visual tokens, typography, spacing, surfaces, and layout.
- `SORRY-STEVE-apple-design-skill.pdf`: interaction and motion principles, accessibility, and testing guidance.

These are design references, not an indication that IKTIS is affiliated with or endorsed by Apple. Adapt the principles for a practical landlord dashboard rather than copying Apple's marketing pages literally.

## Development status

This repository starts with planning documents. The implementation, database schema, APIs, and deployment configuration must be created and tested in later milestones.

## Local setup (to be completed during implementation)

The final setup commands will be documented after the root scripts, frontend, backend, Prisma schema, and environment variables are implemented. Never commit real `.env` files or secrets.
