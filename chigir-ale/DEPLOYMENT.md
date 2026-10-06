# Chigir Ale — Production Deployment & Operations Guide

**Specification Compliance:** Sections 162 (Documentation Requirements), 104 (Environment Configuration), 105 (Development Environments), 106 (Prisma Migration Strategy), 125 (Disaster Recovery), and 157–158 (Monitoring & Health).

---

## 1. Production Topology & Deployment Architecture

```text
[ Internet / Mobile Clients ]
             │
             ▼
[ Cloudflare / CDN / WAF (DDoS & Bot Protection) ]
             │
             ▼
[ Reverse Proxy (Nginx / Caddy) - SSL Termination ]
             │
             ▼
[ Chigir Ale Application Containers (Next.js 16 / Node.js 22 LTS) ]
        │                       │                     │
        ▼                       ▼                     ▼
[ PgBouncer Pooler ]     [ Redis Cache ]     [ S3 Object Store ]
        │
        ▼
[ PostgreSQL 16 DB (Primary + Standby Replica) ]
```

---

## 2. Environment Matrix (Spec §105)

| Environment | Purpose | Database Strategy | Storage Strategy |
|---|---|---|---|
| `development` | Local engineering | Local PostgreSQL (`localhost:5432`) | Local mock / S3 sandbox |
| `test` | Automated CI/CD | Ephemeral in-memory / test DB | In-memory storage mock |
| `staging` | Pre-release QA & load testing | Dedicated staging PostgreSQL | Staging S3 bucket |
| `production` | Live public operations | High-availability PostgreSQL cluster with PgBouncer | Production S3 multi-AZ bucket |

> **Strict Rule:** Development environments must **NEVER** connect to staging or production data.

---

## 3. Container Deployment (Docker & Compose)

### 3.1 Single-Command Local Staging
To run the full stack (Next.js Web + PostgreSQL + Redis):
```bash
docker-compose up -d
```

### 3.2 Building the Multi-Stage Production Image
```bash
docker build -t chigir-ale:latest .
```

---

## 4. Database Migration Runbook (Spec §106)

### 4.1 Running Migrations in Production
Never run `prisma migrate dev` or `prisma db push` in production. Always execute:
```bash
npx prisma migrate deploy
```
This applies pending migrations recorded in `prisma/migrations/` sequentially inside a transaction.

### 4.2 Seed Initialization (First Deployment Only)
```bash
npx prisma db seed
```
Seeds initial categories, default municipal departments, and system routing rules.

---

## 5. Health Probes & Monitoring (Spec §157)

### 5.1 Liveness & Readiness Endpoints
- **Probe URL:** `GET /api/health`
- **Expected Status:** `200 OK`
- **Payload:**
  ```json
  {
    "status": "HEALTHY",
    "version": "1.0.0",
    "services": {
      "database": "UP",
      "storage": "UP",
      "cache": "UP"
    }
  }
  ```

### 5.2 Kubernetes Pod Configuration Example
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 6. Disaster Recovery & Backup Runbook (Spec §125)

### 6.1 Automated Backup Schedule
- **Full Database Dumps:** Scheduled daily at `02:00 UTC` via `pg_dump`.
- **Write-Ahead Log (WAL) Archiving:** Continuously streamed every 15 minutes to off-site object storage, satisfying the **1-hour RPO**.

### 6.2 Restoration Procedure (Target: RTO < 4 Hours)
1. Provision target PostgreSQL instance in recovery environment.
2. Download latest verified full database dump:
   ```bash
   aws s3 cp s3://chigir-ale-backups/daily/db-backup-2026-10-06.dump ./db-backup.dump
   ```
3. Restore database schema and records:
   ```bash
   pg_restore --clean --if-exists -d chigir_ale -U postgres db-backup.dump
   ```
4. Replay WAL archives to target timestamp.
5. Validate database connectivity and run `npm run release:check`.
6. Repoint application DNS / connection strings to restored cluster.

---

## 7. Production Checklist (Spec §166)

Before enabling public traffic:
- [ ] Database SSL enabled (`sslmode=require`).
- [ ] NextAuth secret (`AUTH_SECRET`) generated with high entropy (`32+ bytes`).
- [ ] S3 bucket policy blocks public direct write access (all writes routed via signed tokens).
- [ ] Rate limiting enabled on authentication and report submission endpoints.
- [ ] Production error logs configured to scrub PII and credentials (`ObservabilityService`).
- [ ] Healthcheck probe monitoring configured in uptime service.
