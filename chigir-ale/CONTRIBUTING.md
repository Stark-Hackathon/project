# Contributing to Chigir Ale

## Gated Iteration Workflow

All engineering work on Chigir Ale follows the strict **gated iterative engineering rule**:

1. Only work on **one iteration at a time**.
2. Never implement features belonging to future iterations early.
3. Every iteration must pass:
   - Typecheck: `npm run type-check`
   - Linting: `npm run lint`
   - Tests: `npm test`
   - Build: `npm run build`
4. Complete the formal **ITERATION REPORT** at the conclusion of each iteration.
5. Wait for explicit user confirmation before starting the next iteration.

## Coding Standards

- **TypeScript:** Strict mode enabled. No `any` without explicit justification.
- **Validation:** Always validate external inputs using Zod.
- **Services:** Place domain logic in `src/server/services/`.
- **Git Commits:** Follow conventional commits (e.g. `feat(auth): ...`, `fix(reports): ...`).
