# Chigir Ale (ችግር አለ)

> Smart civic infrastructure platform connecting residents with responsible authorities by turning real-world infrastructure problems into location-based, evidence-supported, trackable reports.

## Core Problem & Mission

Residents encounter water interruptions, electricity failures, damaged roads, drainage issues, broken streetlights, and telecom downtime. Chigir Ale bridges the gap between citizens and service authorities through a structured, transparent, and auditable 8-step lifecycle:

```text
See a problem → Report it → Locate it → Verify it → Assign it → Fix it → Confirm it → Learn from it
```

---

## Architecture & Technology Stack

- **Framework:** Next.js (App Router, React 19, Server Actions & Route Handlers)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS & Lucide Icons
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Testing:** Vitest
- **Mobile Target:** Capacitor (iOS & Android)

---

## Directory Layout

```text
chigir-ale/
├── src/
│   ├── app/                 # Next.js App Router (public, auth, citizen, authority, admin, api)
│   ├── components/          # Reusable UI, maps, reports, dashboard, notifications
│   ├── features/            # Feature-sliced domain modules (auth, reports, incidents, etc.)
│   ├── lib/                 # Core utilities (db/prisma, validation, storage, maps, security)
│   ├── server/              # Server services, repositories, background jobs
│   ├── types/               # Domain types, DTOs, and contracts
│   └── styles/              # Global styling tokens
├── prisma/
│   ├── schema.prisma        # PostgreSQL Prisma schema
│   └── migrations/          # Incremental migration history
├── tests/
│   ├── unit/                # Unit and domain rule tests
│   └── integration/         # API and data layer tests
├── docs/                    # Architecture, security, database, and deployment specs
├── .env.example             # Documented environment configuration template
└── README.md
```

---

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run tests
npm test

# 5. Start development server
npm run dev
```

---

## Engineering Iteration Roadmap

Development is strictly governed by gated iterations:

- [x] **Iteration 0** — Repository Audit & Engineering Baseline
- [ ] **Iteration 1** — Identity, Organizations & Authorization
- [ ] **Iteration 2** — Core Domain, Reports & Database
- [ ] **Iteration 3** — Citizen Reporting & Experience
- [ ] **Iteration 4** — Community Issues, Incidents, Duplicates & Feedback
- [ ] **Iteration 5** — Authority Operations, Routing, Assignment & Priority
- [ ] **Iteration 6** — Media, Maps, Storage & Location Intelligence
- [ ] **Iteration 7** — Notifications & Communication
- [ ] **Iteration 8** — Search, Analytics, Transparency & Moderation
- [ ] **Iteration 9** — AI, Voice & Smart Decision Support
- [ ] **Iteration 10** — Mobile, Offline & Cross-Platform
- [ ] **Iteration 11** — Security, Privacy, Abuse Prevention & Data Governance
- [ ] **Iteration 12** — Performance, Reliability, Jobs & Integrations
- [ ] **Iteration 13** — Testing, QA & Production Hardening
- [ ] **Iteration 14** — Deployment, Documentation, Acceptance & Release
