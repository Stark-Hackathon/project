# Chigir Ale - System Architecture & Engineering Baseline

**Specification Reference:** Sections 1–4, 88–90, 145–147, 161–162, 170–171

---

## 1. Architectural Philosophy

1. **Single Source of Truth:** PostgreSQL is the authoritative state store.
2. **Server-Side Authorization:** The server enforces permissions; the client never makes trust decisions.
3. **Domain-Centered Logic:** Business rules reside strictly in domain services (`src/server/services/`), not in React components or route handlers.
4. **Provider Abstraction:** External providers (Maps, AI, Storage, Notifications) are behind swappable interfaces in `src/lib/`.
5. **Mobile-First & Unified Core:** Web and Capacitor share identical API endpoints, types, and validation schemas.
6. **Graceful Degradation:** Failures in external systems (AI classification, reverse-geocoding, push notifications) must not block core report submission and tracking.

---

## 2. Layered Structure

```text
┌────────────────────────────────────────────────────────┐
│ UI / Presentation Layer (App Router, Client Components) │
└──────────────────────────┬─────────────────────────────┘
                           │ Validates Inputs (Zod)
┌──────────────────────────▼─────────────────────────────┐
│ Next.js Server Layer (Route Handlers, Server Actions)  │
└──────────────────────────┬─────────────────────────────┘
                           │ Calls Domain Services
┌──────────────────────────▼─────────────────────────────┐
│ Domain & Application Services (src/server/services/)   │
│ - ReportService                                        │
│ - IncidentService                                      │
│ - AssignmentService                                    │
│ - RoutingService                                       │
│ - PriorityService                                      │
└──────────────┬──────────────────────────┬──────────────┘
               │ Data Access              │ External I/O
┌──────────────▼──────────────┐ ┌─────────▼──────────────┐
│ Repository / Prisma Client  │ │ Provider Abstractions  │
│ (src/server/repositories)   │ │ (Maps, Storage, AI)    │
└──────────────┬──────────────┘ └────────────────────────┘
               │ SQL Queries
┌──────────────▼──────────────┐
│ PostgreSQL 15+              │
└─────────────────────────────┘
```

---

## 3. Core Incident Lifecycle

Every report in the system progresses through the 8 fundamental stages:

1. **SEE:** Citizen discovers a defect or hazard.
2. **REPORT:** Evidence and preliminary metadata are collected.
3. **LOCATE:** Coordinate capture, reverse geocoding, boundary check.
4. **VERIFY:** Authority or smart triage checks validity and duplicates.
5. **ASSIGN:** Dispatched to responsible department/field worker.
6. **FIX:** On-site repair or resolution performed.
7. **CONFIRM:** Citizen and authority verify the fix with evidence.
8. **LEARN:** Analytics, recurring failure trends, preventive insights.
