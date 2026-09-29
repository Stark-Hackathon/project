# Chigir Ale - Database Baseline

## Principles

1. **PostgreSQL** is the single source of truth.
2. **Prisma** is used for schema migrations and type-safe query building.
3. Schemas are developed incrementally per iteration:
   - **Iteration 1:** User, Organization, Membership, Session/Token models.
   - **Iteration 2:** Report, Category, StatusHistory, Location models.
   - **Iteration 4:** Incident, DuplicateGroup models.
   - **Iteration 5:** Assignment, PriorityMatrix models.
   - **Iteration 6:** Media, GeoCoordinate models.
   - **Iteration 7:** Notification, Webhook models.
   - **Iteration 11:** AuditLog, AbuseReport models.
