# Plan - Testing Setup

## Goal
Add unit tests (Vitest) and e2e tests (Playwright) with a pre-commit hook that blocks commits when tests fail.

## Approach
1. Init git at project root (app/.git only has create-next-app initial commit)
2. Install Vitest for unit tests, Playwright for e2e tests
3. Write unit tests for pure logic modules: cache-keys, shopping-optimizer, store-discovery
4. Write Playwright e2e tests against the running app (demo mode, no DB required)
5. Set up pre-commit hook using git core.hooksPath pointing to `.githooks/`
6. Add npm scripts: `test`, `test:e2e`, `test:all`
7. Playwright uses `webServer` config to auto-start the dev server for tests

## Key decisions
- Vitest over Jest: better ESM support, faster, native TypeScript
- Playwright's `webServer` config starts `next dev` automatically for e2e
- Demo mode (no API key, no DB) is sufficient for e2e tests
- Pre-commit hook runs both unit and e2e tests
- `.githooks/` directory committed to repo (via core.hooksPath) instead of husky
