# Chigir Ale — UI Design System & Component Guidelines
*Reference: Master Specification Section 165 (UI Documentation) & Section 167 (Definition of Done)*

This document outlines the design tokens, visual hierarchy, responsive breakpoints, accessibility conventions, form validation rules, and error/empty state patterns used across the Chigir Ale civic platform.

---

## 1. Design Tokens & Palette

### Primary Civic Colors
- **Emerald (Primary Civic Brand)**: `emerald-600` (`#059669`) / `emerald-700` (`#047857`)
  - Used for verified success states, positive civic actions, submit buttons, and resolved indicators.
- **Sky / Blue (Municipal Infrastructure)**: `sky-600` / `blue-600`
  - Used for water infrastructure, technical data views, and navigational accents.
- **Amber (Pending & Review Actions)**: `amber-500` / `amber-600`
  - Used for `UNDER_REVIEW`, warning banners, and medium severity incidents.
- **Rose / Red (Urgent & Critical Alerts)**: `rose-600` / `red-600`
  - Used for `CRITICAL` severity, danger actions (account deletion), and urgent safety hazards.
- **Slate (Neutral Surfaces & Typography)**:
  - Light mode: Background `slate-50` (`#f8fafc`), Cards `white`, Borders `slate-200`, Text `slate-900`.
  - Dark mode: Background `slate-950` (`#020617`), Cards `slate-900`, Borders `slate-800`, Text `slate-100`.

---

## 2. Status Color Tokens (Spec Section 8 & 9)

| Status Key | Tailwind Classes | Civic Meaning |
| :--- | :--- | :--- |
| `SUBMITTED` | `bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300` | Incident logged by citizen, pending triage |
| `UNDER_REVIEW` | `bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300` | Authority operator reviewing details |
| `NEEDS_INFORMATION` | `bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300` | Citizen clarification requested |
| `VERIFIED` | `bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300` | Issue confirmed as genuine public defect |
| `ASSIGNED` | `bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300` | Assigned to operational department or team |
| `IN_PROGRESS` | `bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300` | Field repair crew dispatched on-site |
| `RESOLVED` | `bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300` | Municipal repair completed with evidence |
| `CLOSED` | `bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300` | Citizen feedback confirmed fix |
| `REOPENED` | `bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300` | Issue recurred or repair inadequate |
| `REJECTED` | `bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300` | Not actionable or out of jurisdiction |
| `DUPLICATE` | `bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300` | Consolidated into existing master report |

---

## 3. Responsive Breakpoints

Following modern mobile-first Tailwind CSS conventions:
- **Mobile (`< 640px`)**: Single-column vertical layout, sticky action footer, 100% full-width wizard steps, touch-friendly targets (minimum 44x44px).
- **Tablet (`sm`: 640px - 768px)**: 2-column metric cards, split modal overlays.
- **Desktop (`md`: 768px - 1024px)**: Sidebar navigation, dual-column split views (map on left, incident list on right).
- **Wide (`lg`: 1024px+)**: Comprehensive operational triage tables with inline audit history and action inspectors.

---

## 4. Accessibility (a11y) Rules

1. **Semantic Structure**: Always use semantic tags (`<main>`, `<nav>`, `<header>`, `<article>`, `<section>`, `<dl>`).
2. **Keyboard Navigation**: All interactive elements must maintain visible focus rings (`focus:ring-2 focus:ring-emerald-500 focus:outline-none`).
3. **Form Labels**: Every input field must feature an explicitly bound `<label htmlFor="...">` tag.
4. **Live Regions**: Dynamic alert banners (such as offline detection and sync status) must declare `role="status"` and `aria-live="polite"`.
5. **Color Contrast**: All text elements adhere to WCAG 2.1 AA standards (minimum 4.5:1 contrast ratio against their respective background surfaces).

---

## 5. Form Patterns & Validation Architecture (Spec Section 80 & 148)

All user forms adhere to the unified pipeline:
```text
User Input → Client Schema Validation (Zod) → Optimistic UI State
           ↓
Server Action → Server-Side Schema Parsing → Sanitization & Rate Limit
           ↓
Database Mutation in Transaction → Audit Log → Outbox Event → Result<T>
```
- Forms disable submission buttons and display loading spinners (`animate-spin`) while transitions are pending.
- Form inputs provide inline validation messages immediately upon invalid blur or submit.

---

## 6. Error & Empty State Guidelines (Spec Section 116)

Every major view defines dedicated empty and error states:
- **Empty State**:
  - Displays a descriptive icon (e.g. `FolderOpen`, `FileCheck2`, `BellOff`).
  - Clear heading: e.g. *"No Reports Found"* or *"All Clear in This Sub-City"*.
  - Actionable prompt: e.g. *"Create First Report"* or *"Clear Filters"*.
- **Error State**:
  - Displays a non-technical user-friendly description.
  - Generates a tracking correlation request ID (`x-request-id`).
  - Never leaks database stack traces or driver internals to clients.
