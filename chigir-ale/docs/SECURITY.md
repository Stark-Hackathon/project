# Chigir Ale - Security Baseline

## Security Principles

1. **Untrusted Input:** Treat all client input, uploads, coordinates, and query parameters as untrusted. Validate with Zod.
2. **Server-Side Authorization:** Never rely on UI visibility for authorization. Enforce organizational tenancy and role permissions at the database and server service level.
3. **No Secrets in Source:** Secrets must stay in `.env` / environment variables. `.env` is git-ignored.
4. **Privacy by Design:** Citizen identity and contact details must never be exposed indiscriminately on public maps or public feeds.
5. **Audit Logging:** Security-critical actions (status changes, assignments, deletes, user role modifications) must create traceable audit log entries.
