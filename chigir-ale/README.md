# Chigir Ale (ችግር አለ) — Civic Infrastructure Intelligence Platform

> **Transforming municipal infrastructure breakdowns into transparent, location-accurate, evidence-backed, and trackable civic resolutions.**

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black.svg)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16%20Prisma-336791.svg)](https://www.postgresql.org/)
[![Capacitor Native](https://img.shields.io/badge/Capacitor-iOS%20%7C%20Android-119EFF.svg)](https://capacitorjs.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-192%20Passed-success.svg)](./tests)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](./DEPLOYMENT.md)

---

## 1. Executive Summary

In growing metropolitan environments such as Addis Ababa, residents encounter frequent infrastructure disruptions: water pipe bursts, power grid blackouts, road cavities/potholes, drainage culvert clogs, broken streetlights, and sanitation overflows. Historically, reporting these issues relied on opaque, fragmented manual complaints with zero tracking or feedback loops.

**Chigir Ale** bridges the gap between citizens and municipal authorities through an end-to-end incident management platform built around a single, auditable civic loop:

```text
See a problem → Report it → Locate it → Verify it → Assign it → Fix it → Confirm it → Learn from it
```

---

## 2. Platform Architecture & Capabilities

Chigir Ale is engineered as a unified, enterprise-grade civic platform:

- **Citizen Web & Mobile:** Modern responsive Next.js 16 App Router interface packaged natively for iOS and Android using Capacitor, complete with offline draft saving and camera evidence capture.
- **Authoritative Report Identity:** Sequential, year-scoped tracking references (`CHI-YYYY-NNNNNN`) generated with concurrency safety.
- **Location Intelligence & Privacy:** GPS geolocation with offline sub-city fallback dictionary, geospatial clustering, hotspot analysis, and deterministic privacy jittering (~110m) to protect citizen residential doors.
- **State Machine Integrity:** 14-state lifecycle machine (`SUBMITTED` → `UNDER_REVIEW` → `VERIFIED` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`) preventing illegal skips, managed exclusively server-side.
- **Authority Console & Triage:** Multi-tenant departmental routing, automated team dispatch, severity scoring, and internal audit notes.
- **Community Engagement:** Citizen verification voting ("I'm experiencing this too"), priority upvoting, duplicate incident grouping, and post-resolution confirmation feedback.
- **AI Decision Support:** Asynchronous background job worker supporting Gemini 2.0 image classification, multi-factor duplicate likelihood detection, and Amharic audio voice transcription.
- **Enterprise Reliability & Security:** Transactional outbox pattern, distributed idempotency locks, SSRF & XSS defenses, append-only audit journals, and automated rate limiting.

---

## 3. Engineering Roadmap Execution

Chigir Ale was built strictly adhering to the 15-iteration gated engineering specification:

- [x] **Iteration 0** — Repository Audit & Engineering Baseline
- [x] **Iteration 1** — Identity, Organizations & Authorization
- [x] **Iteration 2** — Core Domain, Reports & Database
- [x] **Iteration 3** — Citizen Reporting & Experience
- [x] **Iteration 4** — Community Issues, Incidents, Duplicates & Feedback
- [x] **Iteration 5** — Authority Operations, Routing, Assignment & Priority
- [x] **Iteration 6** — Media, Maps, Storage & Location Intelligence
- [x] **Iteration 7** — Notifications & Communication
- [x] **Iteration 8** — Search, Analytics, Transparency & Moderation
- [x] **Iteration 9** — AI, Voice & Smart Decision Support
- [x] **Iteration 10** — Mobile, Offline & Cross-Platform
- [x] **Iteration 11** — Security, Privacy, Abuse Prevention & Data Governance
- [x] **Iteration 12** — Performance, Reliability, Jobs & Integrations
- [x] **Iteration 13** — Testing, QA & Production Hardening
- [x] **Iteration 14** — Deployment, Documentation, Acceptance & Release

---

## 4. Documentation Suite

Full technical specifications are documented per Section 162 of the master engineering specification:

| Document | Description |
|---|---|
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | High-level topology, component diagrams, state machine, outbox design, and mobile sync |
| [**DATABASE.md**](./DATABASE.md) | Relational ER diagram, schemas, enums, indexing strategy, tenant boundaries, and backups |
| [**API.md**](./API.md) | Complete REST API and Server Action specification, request/response envelopes, error codes, and cURL examples |
| [**SECURITY.md**](./SECURITY.md) | Threat model, RBAC hierarchy, SSRF/XSS defenses, rate limiting, and PII location masking |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Production deployment runbook, Docker containerization, migration rules, and health probes |
| [**CONTRIBUTING.md**](./CONTRIBUTING.md) | Engineering standards, local environment setup, pre-commit quality gates, and PR guide |
| [**UI_DESIGN_SYSTEM.md**](./docs/UI_DESIGN_SYSTEM.md) | Design tokens, status badge mappings, accessibility standards, and responsive layout rules |
| [**ACCEPTANCE_VERIFICATION.md**](./docs/ACCEPTANCE_VERIFICATION.md) | Master acceptance matrix verifying all 35 production criteria (§174) against test suites |

---

## 5. Quick Start Guide

### 5.1 Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/your-org/chigir-ale.git
   cd chigir-ale
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and AUTH_SECRET in .env
   ```

3. **Initialize database schema & demo seed:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

### 5.2 Docker Staging Deployment

Run the complete platform (Next.js Application + PostgreSQL + Redis) using Docker Compose:
```bash
docker-compose up -d
```

---

## 6. Verification & Quality Gates

Run all quality checks locally:

```bash
# 1. Type-check (0 errors)
npm run type-check

# 2. Linting (0 warnings)
npm run lint

# 3. Automated test suites (192 passing)
npm test

# 4. Production optimized build
npm run build
```

---

## 7. License

Licensed under the MIT License. See [LICENSE](./LICENSE) for details.
