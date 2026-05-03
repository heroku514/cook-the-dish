# Findings - MVP Build

## 2026-05-03

### Architecture
- Next.js 16 App Router with Turbopack works well for this use case. API routes handle the AI calls server-side, keeping the API key secure.
- Zustand provides clean state management for the multi-step wizard flow without prop drilling.
- The demo mode pattern (checking `process.env.ANTHROPIC_API_KEY`) allows full flow testing without API costs.

### AI Pipeline
- The Anthropic SDK throws immediately when no API key is configured (no retry/timeout), so error handling is fast.
- Demo product database with realistic prices (Kroger, H Mart, etc.) makes the demo convincing.
- Specialty ingredient routing (doubanjiang → ethnic stores only, tofu → all stores) works correctly with the store-type matching logic.

### Shopping Optimizer
- The "balanced" strategy correctly weighs match quality, price, and distance to produce a 2-store plan (nearby mainstream + farther ethnic).
- Greedy set cover algorithm is fast enough for the current scale (9 ingredients × 7 stores = 63 combinations).

### UI/UX
- The 4-step flow (search → recipe → matching → plan) feels natural and each step provides clear value.
- Pantry checkboxes with immediate counter updates give users confidence the app understands what they need.
- The orange/white color scheme is clean and food-appropriate.
- Category color coding (green=produce, red=protein, purple=sauce, yellow=spice) helps users scan ingredients quickly.
