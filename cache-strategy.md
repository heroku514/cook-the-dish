# Cache Strategy

## Problem

Every user search calls Claude API twice — once for recipe parsing, once for product matching. Without caching, 100 users searching "Mapo Tofu" means 200 API calls returning nearly identical results. This wastes tokens and money.

## What Changes by Location and What Doesn't

```
User searches "Mapo Tofu" in San Francisco
User searches "Mapo Tofu" in Houston

Same recipe, same ingredients          ← CACHE GLOBALLY
Different stores nearby                ← depends on location
Different products and prices          ← CACHE PER STORE + REGION
Different shopping plan                ← no tokens (pure math)
```

## Cache Layers

### Layer 1: Recipe Cache (location-independent)

| Property | Value |
|----------|-------|
| **What** | Parsed recipe: dish info, ingredient list, cooking steps |
| **Cache key** | Normalized dish name + servings (e.g., `mapo tofu::2`) |
| **TTL** | None — recipes don't change |
| **Storage** | PostgreSQL `recipe_cache` table |
| **Token savings** | ~50% of total spend. Most users cook popular dishes. |

"Mapo Tofu" produces the same tofu, doubanjiang, and Sichuan peppercorns whether you're in SF or Houston. One API call serves all future users searching the same dish.

### Layer 2: Product Matching Cache (location-dependent)

| Property | Value |
|----------|-------|
| **What** | Product matches: which products at which stores for which ingredients |
| **Cache key** | Hash of (sorted ingredient names + store chain + region code) |
| **TTL** | 24 hours — prices and stock change |
| **Storage** | PostgreSQL `product_match_cache` table |
| **Token savings** | ~50% of total spend. Users in the same city share results. |

Region code is derived by rounding lat/lng to a ~5 mile grid. Two users 3 miles apart in the same city hit the same cache. A user 50 miles away gets fresh results.

A Kroger in San Francisco may carry different products than a Kroger in Iowa, so we key by chain + region, not just chain.

### Layer 3: Anthropic Prompt Caching (on cache misses)

| Property | Value |
|----------|-------|
| **What** | System prompt reuse across API calls |
| **How** | Mark system prompt with `cache_control: { type: "ephemeral" }` |
| **TTL** | 5 minutes (managed by Anthropic) |
| **Token savings** | ~25% per API call. System prompt (~500 tokens) charged at 10% rate. |

When we do call Claude (cache miss), the system prompt is identical every time. Anthropic caches it server-side for 5 minutes, so back-to-back calls from different users pay reduced rates.

### No Cache Needed

| Component | Why |
|-----------|-----|
| **Store discovery** | No tokens — uses Google Maps API or demo data |
| **Shopping plan optimization** | No tokens — pure math (greedy set cover algorithm) |

## Database Schema

```sql
-- Recipes: one entry per dish, serves everyone globally
CREATE TABLE recipe_cache (
    cache_key    TEXT PRIMARY KEY,          -- "mapo tofu::2"
    recipe_data  JSONB NOT NULL,            -- full Recipe object
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Product matches: per ingredient set + store chain + region
CREATE TABLE product_match_cache (
    cache_key    TEXT PRIMARY KEY,          -- hash of ingredients + chain + region
    match_data   JSONB NOT NULL,            -- ProductMatch array
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL       -- created_at + 24 hours
);
```

## Cache Flow

```
User searches "Mapo Tofu" for 2 servings
    │
    ▼
Recipe cache lookup: key = "mapo tofu::2"
    │
    ├── HIT → return cached recipe (0 tokens)
    │
    └── MISS → call Claude API (with prompt caching)
              → store result in recipe_cache
              → return recipe
    │
    ▼
User clicks "Find Where to Buy"
    │
    ▼
Discover nearby stores (no tokens)
    │
    ▼
Product match cache lookup: key = hash(ingredients + stores + region)
    │
    ├── HIT (and not expired) → return cached matches (0 tokens)
    │
    └── MISS or EXPIRED → call Claude API (with prompt caching)
                         → store result in product_match_cache
                         → return matches
    │
    ▼
Generate shopping plan (no tokens, pure math)
```

## Expected Impact

| Scenario | Without cache | With cache |
|----------|--------------|------------|
| 100 users search "Mapo Tofu" in SF | 200 API calls | 2 API calls (first user only) |
| 50 users search "Mapo Tofu" in Houston | 100 API calls | 1 API call (recipe cached, product match fresh for new region) |
| Unique dish nobody searched before | 2 API calls | 2 API calls (cache miss, but results stored for next user) |

Estimated total token savings: **90-95%** for a typical usage pattern where most users cook popular dishes.
