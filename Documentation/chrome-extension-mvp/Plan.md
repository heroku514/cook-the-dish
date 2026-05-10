# Plan - Chrome Extension MVP (Instacart Scraping)

## Goal
Convert CookTheDish from a standalone web app into a Chrome extension that scrapes real product data from Instacart, uses AI to pick best matches, and caches results by location (~5-mile grid, 5-day TTL).

## Approach
1. Scaffold extension project with Vite + @crxjs/vite-plugin + React + Zustand + Tailwind
2. Define typed message protocol for popup <-> service worker <-> content script communication
3. Build content script that injects into Instacart pages, waits for DOM rendering, extracts product cards
4. Build service worker as central orchestrator: recipe parsing, cache checks, scrape coordination, plan generation
5. Build popup UI with 4-step flow: RecipeInput -> IngredientList -> ScrapeProgress -> ShoppingPlan
6. Add backend API endpoints for cache-check and scrape-results analysis
7. Add CORS middleware for chrome-extension:// origins
8. Port shopping optimizer to browser-safe version (no Node.js crypto)

## Architecture
- Extension: Popup UI (React) + Service Worker (orchestrator) + Content Script (Instacart DOM scraper)
- Backend: Existing Next.js app at cookthedish.dev01.top with new /api/ext/* endpoints
- Cache: PostgreSQL with location-based SHA-256 keys, 120-hour TTL
- AI: Claude analyzes scraped products to pick best match per ingredient

## Key Decisions
- Require user to be logged into Instacart (accurate prices/stock for their location)
- Browser Geolocation API for precise lat/lng (not IP-based)
- ~5-mile cache grid so nearby users share results
- 2-3.5s random delay between ingredient searches (anti-bot)
- MV3 manifest with service worker (not background page)
- Keep existing web app running alongside extension
