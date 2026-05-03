# Findings - Testing Setup

## 2026-05-02

- Project has no existing test infrastructure (no test files, no test configs)
- app/.git exists with single create-next-app commit — safe to replace with root-level git
- Demo mode doesn't require PostgreSQL (pool is lazy, demo mode returns before any DB call)
- Pure logic modules suitable for unit testing: cache-keys.ts, shopping-optimizer.ts, store-discovery.ts
