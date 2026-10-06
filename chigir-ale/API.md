# Chigir Ale — API Reference Specification

**Specification Compliance:** Sections 132 (API Response Design), 133 (API Versioning), 163 (API Documentation), and 72–74 (Authorization & Data Safety).

---

## 1. API Architecture & Design Principles

All Chigir Ale APIs follow standard REST conventions, predictability, and uniform JSON wrapping:
- **Transport:** HTTPS exclusively in production.
- **Base URL:** `/api` for internal and first-party clients. Future external partner integrations use `/api/v1`.
- **Content-Type:** `application/json` (or `multipart/form-data` where binary upload streams are accepted).
- **Authentication:** Server-side HTTP-only session cookies managed by Auth.js (NextAuth v5 beta), or `Authorization: Bearer <token>` for programmatic API calls.
- **Tenant Isolation:** Enforced server-side on every request through organization-scoped database queries (`Spec §7.3`).

---

## 2. Standard Response Envelopes (Spec §132)

### 2.1 Single Resource Success
```json
{
  "data": {
    "id": "rep-7f8a9b0c-1234-5678-9abc-def012345678",
    "publicReference": "CHI-2026-000042",
    "title": "Severe road cavity on Cameroon Street",
    "status": "SUBMITTED"
  }
}
```

### 2.2 Paginated List Success
```json
{
  "data": [
    {
      "id": "rep-7f8a9b0c-1234-5678-9abc-def012345678",
      "publicReference": "CHI-2026-000042",
      "title": "Severe road cavity on Cameroon Street",
      "severity": "HIGH",
      "status": "VERIFIED"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### 2.3 Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted payload failed validation constraints.",
    "details": {
      "description": "Description must contain at least 10 characters."
    }
  }
}
```

---

## 3. Standard HTTP Status & Error Codes

| Status | Code | Meaning & Trigger Condition |
|---|---|---|
| `200 OK` | — | Successful query, fetch, or idempotent update. |
| `201 Created` | — | Successful resource creation (e.g. report created, media token issued). |
| `400 Bad Request` | `VALIDATION_ERROR` | Schema failure, missing parameters, or invalid coordinate bounds. |
| `401 Unauthorized` | `UNAUTHORIZED` | Authentication missing, invalid session, or expired token. |
| `403 Forbidden` | `FORBIDDEN` | Authenticated user lacks required role or cross-organization tenant access. |
| `404 Not Found` | `NOT_FOUND` | Resource (report, category, user) does not exist or has been soft-deleted. |
| `409 Conflict` | `INVALID_TRANSITION` | Attempted illegal state transition per `ReportStatusService` machine. |
| `409 Conflict` | `IDEMPOTENCY_LOCKED` | Concurrent duplicate submission detected for active client request key. |
| `429 Too Many Requests` | `RATE_LIMITED` | Rate limit window quota exhausted. Response includes `Retry-After` header. |
| `500 Server Error` | `INTERNAL_ERROR` | Unhandled runtime failure; sensitive trace details scrubbed from payload. |

---

## 4. Role Hierarchy & Access Levels (Spec §6 & §7.2)

```text
CITIZEN (0) < FIELD_WORKER (1) < STAFF (2) < ANALYST (3) < DEPARTMENT_MANAGER (4) < ORG_ADMIN (5) < PLATFORM_ADMIN (6)
```

- **Public / Unauthenticated:** Public transparency metrics, read-only redacted reports, geocoding dictionary.
- **Citizen:** Report creation, personal reports list, confirmation voting, upvoting, resolution feedback.
- **Staff / Worker:** Department triage queue, status transition updates, evidence logging.
- **Manager / Admin:** Triage reassignment, team dispatch, organization settings, moderation overrides.
- **Platform Admin:** System-wide diagnostics, audit logs, category taxonomy management.

---

## 5. REST Endpoints Catalog

### 5.1 Evidence Storage & Media (Spec §36–38)

#### `POST /api/media/upload`
Requests a signed, tamper-proof upload token and short-lived S3 pre-signed upload URL.
- **Auth:** Required (`CITIZEN` or higher).
- **Rate Limit:** 30 requests / 15 minutes.
- **Request Body:**
  ```json
  {
    "fileName": "pothole_evidence.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 2048500
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "data": {
      "uploadUrl": "https://s3.amazonaws.com/chigir-ale-evidence/2026/10/uuid.jpg?signed=...",
      "storageKey": "2026/10/uuid.jpg",
      "token": "signed-hmac-upload-token",
      "expiresAt": "2026-10-06T18:45:00.000Z",
      "mediaType": "IMAGE"
    }
  }
  ```

#### `GET /api/media/view`
Generates a time-limited (1-hour) signed URL for private media preview.
- **Auth:** Required (Owner, Assigned Staff, or Org Member).
- **Query Params:** `storageKey=2026/10/uuid.jpg`
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "viewUrl": "https://s3.amazonaws.com/chigir-ale-evidence/2026/10/uuid.jpg?Expires=1760000000&Signature=..."
    }
  }
  ```

---

### 5.2 AI & Voice Services (Spec §33–35 & §90–93)

#### `POST /api/ai/transcribe`
Transcribes voice recording audio evidence in Amharic (`am-ET`) or English into text for description autofill.
- **Auth:** Required (`CITIZEN` or higher).
- **Request Body (Multipart):** Audio file (`audio/webm`, `audio/mp4`, `audio/ogg`, or `audio/mpeg`), max 15MB.
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "transcription": "በቦሌ መድኃኔዓለም አካባቢ መንገድ ተበላሽቷል እባክዎ ይጠግኑልን።",
      "detectedLanguage": "am",
      "confidence": 0.94,
      "durationSeconds": 12.4
    }
  }
  ```

#### `POST /api/ai/jobs/run`
Triggers background batch worker execution for pending AI classification and duplicate detection jobs.
- **Auth:** Required (`STAFF` or cron bearer token).
- **Request Body:** `{"batchSize": 10}`
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "processedCount": 5,
      "failedCount": 0
    }
  }
  ```

#### `GET /api/ai/reports/[id]/analysis`
Returns AI confidence scores, proposed category tags, urgency score, and duplicate candidate links.
- **Auth:** Required (`STAFF` or higher).
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "suggestedCategory": "Roads & Potholes",
      "suggestedSeverity": "HIGH",
      "confidence": 0.89,
      "duplicateCandidates": [
        { "publicReference": "CHI-2026-000012", "confidence": 0.74 }
      ]
    }
  }
  ```

---

### 5.3 Search, Hotspots & Analytics (Spec §94–98)

#### `GET /api/search`
Multi-criteria full-text and parameterized report search with capped memory limits.
- **Auth:** Public for non-sensitive fields; Authenticated for authority parameters.
- **Query Params:**
  - `q` (string): Search query (e.g. `pothole bole`)
  - `status` (string, optional): Filter by `ReportStatus`
  - `categoryId` (string, optional): Filter by Category UUID
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20, max: 100): Results per page
- **Response (`200 OK`):** Standard paginated response envelope.

#### `GET /api/analytics/hotspots`
Aggregates report density clusters across sub-cities for municipal infrastructure intelligence.
- **Auth:** `STAFF`, `ANALYST`, or `ORG_ADMIN`.
- **Query Params:** `days=30`
- **Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "subcity": "Bole",
        "incidentCount": 42,
        "criticalCount": 8,
        "dominantCategory": "Roads",
        "riskScore": 84.2,
        "trend": "INCREASING"
      }
    ]
  }
  ```

#### `GET /api/analytics/transparency`
Public, privacy-redacted civic metrics for public transparency portal. Contains zero citizen PII.
- **Auth:** Public / Anonymous.
- **Response (`200 OK`):**
  ```json
  {
    "data": {
      "totalSubmitted": 1250,
      "totalResolved": 1080,
      "resolutionRatePercentage": 86.4,
      "medianResolutionHours": 48.5,
      "activeCategories": 12
    }
  }
  ```

---

### 5.4 Notifications & Device Registry (Spec §41–42)

#### `GET /api/notifications`
Returns paginated in-app notifications for the authenticated user.
- **Auth:** Required (`CITIZEN` or higher).
- **Query Params:** `page=1&pageSize=20&unreadOnly=false`
- **Response (`200 OK`):** Paginated notification items.

#### `PATCH /api/notifications/[id]/read`
Marks a specific notification as read.
- **Auth:** Required (Notification recipient).
- **Response (`200 OK`):** `{"data": { "readAt": "2026-10-06T18:30:00Z" }}`

#### `POST /api/notifications/read-all`
Marks all unread notifications as read in bulk.
- **Auth:** Required.
- **Response (`200 OK`):** `{"data": { "markedCount": 7 }}`

#### `POST /api/devices/register`
Registers native mobile push notification token (Capacitor iOS/Android).
- **Auth:** Required.
- **Request Body:**
  ```json
  {
    "platform": "ANDROID",
    "pushToken": "fcm-device-registration-token-string",
    "deviceName": "Samsung Galaxy A54",
    "appVersion": "1.0.0"
  }
  ```
- **Response (`200 OK`):** `{"data": { "registered": true }}`

---

### 5.5 System Telemetry & Health (Spec §157)

#### `GET /api/health`
Kubernetes and container liveness/readiness probe.
- **Auth:** Public.
- **Response (`200 OK` if healthy, `503 Service Unavailable` if degraded):**
  ```json
  {
    "status": "HEALTHY",
    "version": "1.0.0",
    "timestamp": "2026-10-06T18:30:00Z",
    "services": {
      "database": "UP",
      "storage": "UP",
      "cache": "UP"
    }
  }
  ```

---

## 6. Server Actions Reference

For Next.js App Router forms, Chigir Ale uses strongly-typed Server Actions returning `Result<T>`:

| Server Action | Module | Description | Permissions |
|---|---|---|---|
| `signUpAction` | `@/features/auth/actions` | Register new citizen account with email & password | Public |
| `signInAction` | `@/features/auth/actions` | Authenticate credentials and establish session | Public |
| `signOutAction` | `@/features/auth/actions` | Terminate session and invalidate cookie | Authenticated |
| `createReportAction` | `@/features/reports/actions` | Submit new report with idempotency lock | `CITIZEN`+ |
| `submitConfirmationAction` | `@/features/reports/actions` | Submit citizen "I'm experiencing this too" vote | `CITIZEN`+ |
| `toggleUpvoteAction` | `@/features/reports/actions` | Add or remove report upvote | `CITIZEN`+ |
| `submitResolutionFeedbackAction`| `@/features/reports/actions` | Confirm or reject resolution (`CONFIRMED_FIXED` / `NOT_FIXED`) | Reporter / `CITIZEN` |
| `triageReportAction` | `@/features/authority/actions` | Transition status (`UNDER_REVIEW`, `VERIFIED`, `REJECTED`) | `STAFF`+ |
| `assignReportAction` | `@/features/authority/actions` | Assign to Department, Team, or Field Worker | `DEPARTMENT_MANAGER`+ |
| `resolveReportAction` | `@/features/authority/actions` | Mark work completed with proof | `FIELD_WORKER`+ |
| `reopenReportAction` | `@/features/authority/actions` | Reopen closed report upon citizen escalation | `CITIZEN` / `STAFF` |

---

## 7. Example cURL Workflows

### 7.1 Citizen Report Submission (2-step with Upload)
```bash
# 1. Request Evidence Upload Token
curl -X POST https://chigirale.et/api/media/upload \
  -H "Cookie: authjs.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"fileName": "leak.jpg", "mimeType": "image/jpeg", "sizeBytes": 1204000}'

# 2. Upload Binary Directly to Signed S3 URL
curl -X PUT "https://s3.amazonaws.com/chigir-ale-evidence/2026/10/uuid.jpg?signed=..." \
  -H "Content-Type: image/jpeg" \
  --data-binary "@leak.jpg"
```

### 7.2 Liveness Probe
```bash
curl -i https://chigirale.et/api/health
```
