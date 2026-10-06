# Chigir Ale — Security Policy & Controls Architecture

**Specification Compliance:** Sections 162 (Documentation Requirements), 79 (Security Architecture), 80 (Validation & Sanitization), 81–82 (Rate Limiting & Abuse Prevention), 83 (Media Security), 84 (Data Privacy & Redaction), and 160 (Security Review Checklist).

---

## 1. Security Architecture & Threat Model

Chigir Ale is designed to resist critical civic platform threats:
1. **Citizen Deanonymization & Harassment:** Prevent retaliatory targeting of citizens reporting government or utility defects.
2. **Denial-of-Service & Report Flooding:** Defend against spam botnets, rapid double-click submissions, and brute-force credential stuffing.
3. **Cross-Tenant Data Leakage:** Ensure municipal staff in one district or agency cannot view or modify data belonging to another.
4. **Server-Side Request Forgery (SSRF):** Prevent attackers from forcing the server to query internal networks or cloud metadata.
5. **Cross-Site Scripting (XSS) & Content Injection:** Prevent script execution in citizen descriptions or authority triage consoles.
6. **Path Traversal & Malicious Uploads:** Neutralize attempts to overwrite system files or upload executable payloads via evidence uploads.

---

## 2. Authentication & Authorization Controls

### 2.1 Password Hashing & Credentials
- Passwords are encrypted using **bcrypt** with a work factor cost of **12**.
- Minimum password length of 8 characters enforced at schema and action validation layers.
- Timing-attack-resistant comparisons used during authentication.

### 2.2 Server-Side Authorization & Middleware
- Enforced on every App Router request via `middleware.ts` and domain service guards (`requireAuth`, `requireOrgAccess`).
- Role hierarchy strictly enforced:
  ```text
  CITIZEN < FIELD_WORKER < STAFF < ANALYST < DEPARTMENT_MANAGER < ORG_ADMIN < PLATFORM_ADMIN
  ```
- No client-side role check is ever trusted for authorization decisions.

### 2.3 Multi-Tenant Isolation
- Tenant boundary enforcement ensures all authority database operations are explicitly scoped to `organizationId`.
- Cross-tenant queries throw immediate `FORBIDDEN` errors and generate audit security events.

---

## 3. Data Privacy & Citizen Redaction (Spec §18 & §84)

### 3.1 Location Privacy Masking
- Exact residential GPS coordinates (e.g. `8.998412, 38.786523`) are **never** exposed in public feeds or community maps.
- Public views receive deterministic jittered coordinates (truncated to 3 decimal places, ~110m precision) via `MapService.toPublicCoordinate()`.

### 3.2 Reporter Anonymity
- Public APIs and transparency dashboards redact all citizen names, phone numbers, email addresses, and internal notes via `PrivacyService.redactReportForPublic()`.

---

## 4. Input Sanitization & Content Defense (Spec §80 & §83)

### 4.1 XSS Defenses
- All citizen descriptions and titles pass through `SanitizerService.sanitizeText()`.
- Strips `<script>`, `<iframe>`, `<style>`, `<embed>`, raw HTML tags, and all inline JavaScript event handlers (`onerror`, `onload`, `onclick`).

### 4.2 Malicious Filename & Path Traversal Neutralization
- User-provided filenames pass through `SanitizerService.sanitizeFilename()`.
- Strips `../` traversal sequences, path separators (`/`, `\`), and control characters.
- Evidence files stored in S3 are assigned immutable UUIDs (`StorageService.generateStorageKey()`), never user filenames.

### 4.3 SSRF Protections (Spec §79 & §160)
- Before fetching external webhooks or geocoding APIs, `SanitizerService.validateExternalUrl()` validates the destination.
- Blocks:
  - Localhost and loopback addresses (`127.0.0.1`, `::1`, `localhost`).
  - Private IPv4 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Link-local and cloud metadata endpoints (`169.254.169.254`).

---

## 5. Abuse Prevention & Rate Limiting (Spec §81 & §82)

`RateLimitService` enforces sliding-window quotas in Redis / memory:

| Action / Endpoint | Quota Limit | Window | Scope |
|---|---|---|---|
| Report Submission | 5 requests | 15 minutes | User ID / IP |
| Evidence Upload Token | 30 requests | 15 minutes | User ID / IP |
| Authentication Attempts | 10 attempts | 15 minutes | IP Address |
| Confirmation / Upvotes | 20 actions | 15 minutes | User ID / IP |
| Public API Search | 60 requests | 1 minute | IP Address |

Exceeded limits return HTTP `429 Too Many Requests` with a `Retry-After` header.

---

## 6. Audit Logging & Compliance (Spec §71 & §124)

- **Immutable Audit Trail:** All domain state changes write to `audit_logs` capturing actor ID, action, entity, and JSON before/after snapshots.
- **Append-Only Integrity:** Application database credentials have no `DELETE` or `UPDATE` privileges on the `audit_logs` table.
- **7-Year Statutory Retention:** Automated retention policies preserve compliance logs for 7 years (`RetentionService`).

---

## 7. Responsible Disclosure

To report a suspected security vulnerability in Chigir Ale, please send encrypted email to `security@chigirale.et`. We commit to acknowledging reports within 24 hours and providing an incident remediation timeline.
