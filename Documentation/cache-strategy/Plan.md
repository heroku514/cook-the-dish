# Plan - Cache Strategy Implementation

## Goal
Add PostgreSQL-backed caching to reduce Claude API token usage. Data persists across Docker restarts.

## Approach
1. Add PostgreSQL to docker-compose with a named volume for persistence.
2. Create cache tables on app startup (auto-migration).
3. Implement recipe cache (location-independent, keyed by dish name).
4. Implement product matching cache (location-dependent, keyed by ingredients + store chain + region).
5. Enable Anthropic prompt caching on all LLM calls.
6. Wire caches into the existing API routes.

## Key Design Decisions
- Use `pg` (node-postgres) directly — no ORM overhead for simple cache tables.
- Auto-create tables on first connection (no migration tool needed for MVP).
- Recipe cache has no TTL (recipes don't change).
- Product matching cache has 24-hour TTL (prices and stock change).
- Region is derived by rounding lat/lng to ~5 mile grid.
