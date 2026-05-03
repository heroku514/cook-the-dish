# Plan - MVP Build

## Goal
Build the MVP web app: user enters a dish name → AI extracts ingredients → finds nearby stores → matches products → generates shopping list.

## Tech Stack (MVP)
- Next.js 15 (App Router) — frontend + API routes
- Tailwind CSS + shadcn/ui — styling
- Anthropic SDK (Claude Sonnet 4.6) — recipe parsing + product matching
- Zustand — client state
- Google Maps Places API — store discovery (mock-ready)
- Instacart/Kroger API — product data (mock-ready with realistic demo data)

## Build Order
1. Initialize Next.js project + install dependencies
2. Define TypeScript types
3. Build AI pipeline (recipe parser + product matcher)
4. Build store discovery service
5. Build shopping optimizer
6. Create API routes
7. Build UI components + pages
8. Wire everything together and test

## MVP Features
- Dish name input (English + Chinese)
- AI recipe understanding and ingredient extraction
- Location-based store discovery
- Product matching with AI validation
- Shopping list generation (single + multi-store)
- Save and share shopping lists
