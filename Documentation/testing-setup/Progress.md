# Progress - Testing Setup

## 2026-05-02

- Created plan for testing infrastructure
- Initialized git at project root (removed app/.git with only create-next-app commit)
- Installed vitest and @playwright/test as dev dependencies
- Created vitest.config.ts with @/ path alias
- Created playwright.config.ts with webServer auto-start
- Wrote 28 unit tests across 3 test files:
  - cache-keys.test.ts (14 tests): recipeKey, regionCode, productMatchKey
  - shopping-optimizer.test.ts (9 tests): all 4 strategies, subtotals, stop ordering, empty input
  - store-discovery.test.ts (5 tests): sorting, filtering, types, field validation
- Wrote 4 Playwright e2e tests:
  - Full flow: search → recipe → stores → shopping plan
  - Quick pick buttons
  - Pantry toggle count update
  - Reset navigation
- Created .githooks/pre-commit hook, configured core.hooksPath
- Added npm scripts: test, test:watch, test:e2e, test:all
- All 32 tests pass (28 unit + 4 e2e)
