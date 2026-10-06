# Contributing to Chigir Ale

Thank you for contributing to Chigir Ale, the municipal infrastructure issue management platform.

---

## 1. Development Principles & Code Standards

- **TypeScript Strictness:** Strict typing is enforced across the codebase. Never use `any` without explicit documented justification.
- **Input Validation:** All user and API inputs must be validated with Zod schemas before reaching domain services.
- **Domain Layering:**
  - Route handlers & server actions live in `src/app/` or `src/features/<feature>/actions.ts`.
  - Core business logic lives in `src/server/services/`.
  - Database access is abstracted in `src/server/repositories/`.
- **Fail-Safe Integrity:** External provider calls (AI, email, SMS, push, maps) must be decoupled from the primary database transaction so transient third-party outages never corrupt core reporting workflows.
- **Append-Only Auditing:** Important domain mutations must append records to `AuditLog`. Never update or delete audit logs.

---

## 2. Local Environment Setup

1. **Clone & Install Dependencies:**
   ```bash
   git clone https://github.com/your-org/chigir-ale.git
   cd chigir-ale
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   Set your local PostgreSQL connection string (`DATABASE_URL`).

3. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 3. Pre-Commit Quality Gates

Before submitting changes or creating a pull request, ensure all four verification gates pass cleanly:

```bash
# 1. Type Checking
npm run type-check

# 2. Code Linting
npm run lint

# 3. Automated Test Suites
npm test

# 4. Production Build
npm run build
```

---

## 4. Git Conventions & Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): add new capability` (e.g. `feat(auth): implement session validation`)
- `fix(scope): resolve bug` (e.g. `fix(maps): prevent division by zero in clustering`)
- `test(scope): add test suites` (e.g. `test(qa): add e2e critical flow test`)
- `docs(scope): update documentation` (e.g. `docs(api): document search endpoint`)
- `refactor(scope): internal improvement without behavior changes`

---

## 5. Security & Sensitive Data

- **Never commit credentials:** Do not commit `.env`, private keys, API secrets, or certificates.
- **Anonymity in tests:** Never use real citizen names, real phone numbers, or actual resident addresses in test suites or database seed scripts. Synthetic fixtures only.
