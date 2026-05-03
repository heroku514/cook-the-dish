# CookTheDish - Application Design Document

*Version 1.0 | 2026-05-02*

---

## 1. Product Vision

**One sentence**: Tell the app what you want to cook, and it tells you exactly what to buy and where to buy it.

**Core value proposition**: The only app that bridges the gap between "I want to cook X" and "Go to Store A for items 1-3, Store B for items 4-5" — optimized for cost, distance, and availability.

### What Makes This Different

| Existing Apps | CookTheDish |
|--------------|-------------|
| Locked to one retailer | Retailer-agnostic, multi-store |
| English/Western recipes only | Any cuisine, any language |
| Full ingredient lists (ignoring pantry) | Subtracts what you already have |
| No price optimization | Minimizes total cost across stores |
| Can't find specialty ingredients | Maps specialty items to ethnic/specialty stores |

---

## 2. Core User Flows

### Flow 1: Cook a Dish (Primary)

```
User enters dish name (e.g., "麻婆豆腐" or "Mapo Tofu")
    │
    ▼
AI identifies recipe + extracts ingredient list
    │  ┌─────────────────────────────────┐
    │  │ Ingredients:                     │
    │  │ • Firm tofu (1 block)           │
    │  │ • Doubanjiang (2 tbsp)          │
    │  │ • Ground pork (200g)            │
    │  │ • Sichuan peppercorns (1 tsp)   │
    │  │ • Scallions (3 stalks)          │
    │  │ • Garlic (4 cloves)             │
    │  │ • Ginger (1 inch)               │
    │  │ • Sesame oil, soy sauce, starch │
    │  └─────────────────────────────────┘
    │
    ▼
User confirms / edits ingredient list
(optionally marks items already in pantry)
    │
    ▼
App queries nearby stores for matching products
    │
    ▼
AI matches ingredients → specific store products
    │  ┌──────────────────────────────────────────┐
    │  │ Product Matches:                          │
    │  │ "Doubanjiang" → Pixian Doubanjiang 500g   │
    │  │   @ H Mart (1.2 mi) — $4.99              │
    │  │   @ 99 Ranch (3.1 mi) — $3.89            │
    │  │ "Firm tofu" → House Foods Extra Firm 14oz │
    │  │   @ Kroger (0.8 mi) — $2.29              │
    │  │   @ Walmart (1.5 mi) — $1.98             │
    │  └──────────────────────────────────────────┘
    │
    ▼
Multi-store optimization engine
    │  ┌──────────────────────────────────────────┐
    │  │ Optimized Shopping Plan:                  │
    │  │                                           │
    │  │ 🏪 Stop 1: Kroger (0.8 mi)               │
    │  │   □ House Foods Extra Firm Tofu — $2.29   │
    │  │   □ Ground Pork 1lb — $4.99              │
    │  │   □ Scallions bunch — $1.29              │
    │  │   □ Garlic head — $0.69                  │
    │  │   □ Ginger root — $0.89                  │
    │  │   Subtotal: $10.15                       │
    │  │                                           │
    │  │ 🏪 Stop 2: H Mart (1.2 mi)               │
    │  │   □ Pixian Doubanjiang 500g — $4.99      │
    │  │   □ Sichuan Peppercorns 50g — $3.49      │
    │  │   Subtotal: $8.48                        │
    │  │                                           │
    │  │ Total: $18.63 | 2 stops                  │
    │  └──────────────────────────────────────────┘
    │
    ▼
User can: order delivery / save list / navigate to store / share
```

### Flow 2: Browse & Plan (Secondary)

```
User browses cuisine categories or trending dishes
    → Selects multiple dishes for the week
    → Ingredients consolidated and deduplicated
    → Single optimized multi-store shopping plan generated
```

### Flow 3: Snap & Cook (Future)

```
User takes photo of ingredients they have
    → AI identifies available ingredients
    → Suggests dishes they can make
    → Shows what's missing + where to buy it
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Mobile App   │  │   Web App    │  │  WeChat Mini Program  │  │
│  │ (React Native)│  │  (Next.js)   │  │     (Future)          │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         └─────────────────┼──────────────────────┘              │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong / AWS API Gateway)       │
│                  Rate limiting, Auth, Request routing            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  User Service │  │ Recipe       │  │  Shopping        │
│              │  │ Service      │  │  Service         │
│ • Auth       │  │              │  │                  │
│ • Profile    │  │ • Search     │  │ • Cart assembly  │
│ • Preferences│  │ • Parse      │  │ • Store lookup   │
│ • Pantry     │  │ • Ingredient │  │ • Price compare  │
│ • History    │  │   extraction │  │ • Route optimize │
│              │  │ • AI matching│  │ • Order/checkout │
└──────┬───────┘  └──────┬───────┘  └────────┬─────────┘
       │                 │                    │
       │          ┌──────┴───────┐            │
       │          ▼              │            │
       │  ┌──────────────┐      │            │
       │  │  AI Pipeline  │      │            │
       │  │  Service      │      │            │
       │  │              │      │            │
       │  │ • LLM calls  │      │            │
       │  │ • NLP parsing│      │            │
       │  │ • Embeddings │      │            │
       │  │ • Matching   │      │            │
       │  └──────┬───────┘      │            │
       │         │              │            │
       ▼         ▼              ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐  │
│  │ PostgreSQL  │ │   Redis    │ │ Pinecone/  │ │ S3 / Cloud  │  │
│  │            │ │            │ │ pgvector   │ │ Storage     │  │
│  │ • Users    │ │ • Sessions │ │            │ │             │  │
│  │ • Orders   │ │ • Cache    │ │ • Recipe   │ │ • Images    │  │
│  │ • Recipes  │ │ • Rate     │ │   embeddings│ │ • Receipts │  │
│  │ • Products │ │   limits   │ │ • Product  │ │             │  │
│  │ • History  │ │ • Cart     │ │   embeddings│ │             │  │
│  └────────────┘ └────────────┘ └────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                         │
│                                                                 │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Instacart   │ │ Kroger   │ │ MealMe   │ │ Open Food     │   │
│  │ Developer   │ │ API      │ │ API      │ │ Facts         │   │
│  │ Platform    │ │          │ │          │ │               │   │
│  │ (85K stores)│ │(2.7K     │ │(1M+      │ │(2.5M products)│   │
│  │             │ │ stores)  │ │ stores)  │ │               │   │
│  └─────────────┘ └──────────┘ └──────────┘ └───────────────┘   │
│                                                                 │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Google Maps │ │ Claude / │ │ Spoon-   │ │ Edamam        │   │
│  │ Places API  │ │ GPT-4    │ │ acular   │ │ Nutrition     │   │
│  │ (location)  │ │ (LLM)    │ │ (food    │ │ API           │   │
│  │             │ │          │ │  ontology)│ │               │   │
│  └─────────────┘ └──────────┘ └──────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. AI Pipeline Design (The Core Engine)

This is the heart of the app — the pipeline that transforms a dish name into a store-specific shopping list.

### Stage 1: Recipe Understanding

```
Input: "麻婆豆腐" (or "Mapo Tofu")
                │
                ▼
┌──────────────────────────────────────┐
│  LLM Call: Recipe Generation         │
│                                      │
│  System: You are a culinary expert.  │
│  Given a dish name, return:          │
│  - Canonical name (EN + original)    │
│  - Cuisine type                      │
│  - Serving size                      │
│  - List of ingredients with:         │
│    • name (canonical English)        │
│    • original_name (if non-English)  │
│    • quantity                        │
│    • unit                            │
│    • category (produce/protein/      │
│      spice/sauce/staple)             │
│    • is_specialty (bool)             │
│    • substitutes (array)             │
│  - Brief cooking steps               │
│                                      │
│  Model: Claude Sonnet 4.6            │
│  Format: Structured JSON output      │
└──────────────────────────────────────┘
                │
                ▼
Output: Structured ingredient list with metadata
```

**Example LLM Output:**
```json
{
  "dish": {
    "name_en": "Mapo Tofu",
    "name_original": "麻婆豆腐",
    "cuisine": "Sichuan Chinese",
    "servings": 2,
    "prep_time_min": 20,
    "cook_time_min": 15
  },
  "ingredients": [
    {
      "name": "firm tofu",
      "name_original": "豆腐",
      "quantity": 1,
      "unit": "block",
      "weight_g": 400,
      "category": "protein",
      "is_specialty": false,
      "substitutes": ["silken tofu", "extra firm tofu"],
      "notes": "Cut into 1-inch cubes"
    },
    {
      "name": "doubanjiang",
      "name_original": "豆瓣酱",
      "quantity": 2,
      "unit": "tablespoon",
      "weight_g": 36,
      "category": "sauce",
      "is_specialty": true,
      "substitutes": ["gochujang + miso", "red pepper paste"],
      "notes": "Pixian brand preferred. Fermented chili bean paste."
    }
  ]
}
```

### Stage 2: Pantry Subtraction

```
Ingredient List
    │
    ▼
┌──────────────────────────────┐
│  Subtract pantry items       │
│                              │
│  User's pantry:              │
│  • Soy sauce ✓ (have it)    │
│  • Sesame oil ✓ (have it)   │
│  • Cornstarch ✓ (have it)   │
│                              │
│  Remaining to buy: 7 items   │
└──────────────────────────────┘
    │
    ▼
Shopping-required ingredient list
```

### Stage 3: Store Discovery & Product Matching

```
Shopping-required ingredients + User location
    │
    ├──→ Google Maps Places API
    │    "Find grocery stores within 5 miles"
    │    Returns: store names, addresses, distances
    │
    ├──→ Instacart Developer Platform API
    │    For each nearby store on Instacart:
    │      Search products matching each ingredient
    │      Get: product name, price, size, availability
    │
    ├──→ Kroger API (if Kroger nearby)
    │    Products API: search by ingredient term
    │    Get: product name, price, size, aisle location
    │
    ├──→ MealMe API (aggregated fallback)
    │    Search across all available stores
    │    Get: product name, price, store, availability
    │
    ▼
┌─────────────────────────────────────────┐
│  Raw product candidates per ingredient   │
│                                          │
│  "doubanjiang" →                         │
│    H Mart: Pixian Doubanjiang 500g $4.99 │
│    99 Ranch: Lee Kum Kee Toban $3.29     │
│    Kroger: (not found)                   │
│    Walmart: (not found)                  │
│                                          │
│  "firm tofu" →                           │
│    Kroger: House Foods Extra Firm $2.29   │
│    Walmart: Nasoya Firm Tofu $1.98       │
│    H Mart: Pulmuone Firm Tofu $2.49      │
│    99 Ranch: House Foods Firm $2.19      │
└─────────────────────────────────────────┘
```

### Stage 4: AI Product Validation

```
Raw product candidates
    │
    ▼
┌──────────────────────────────────────────┐
│  LLM Call: Product Validation            │
│                                          │
│  For each ingredient ↔ product match:    │
│  - Is this product suitable? (score 0-1) │
│  - Is the size appropriate?              │
│  - Quality assessment                    │
│  - Better alternative available?         │
│                                          │
│  Example:                                │
│  Ingredient: "doubanjiang (2 tbsp)"      │
│  Product: "Lee Kum Kee Toban Djan 226g"  │
│  → Score: 0.85                           │
│  → Note: "Suitable but Pixian brand is   │
│    more authentic for Mapo Tofu"         │
│                                          │
│  Model: Claude Haiku 4.5 (fast + cheap)  │
│  Batch all ingredients in one call       │
└──────────────────────────────────────────┘
    │
    ▼
Validated & ranked product matches
```

### Stage 5: Multi-Store Optimization

```
Validated products (multiple stores × multiple items)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Optimization Algorithm                      │
│                                              │
│  Objective: Minimize (total_cost +           │
│             travel_penalty × num_stores)     │
│                                              │
│  Constraints:                                │
│  - Every ingredient must be covered          │
│  - Maximum N stores (user preference, def 3) │
│  - Maximum distance per store                │
│  - Respect user store preferences            │
│                                              │
│  Strategies:                                 │
│  A) "Fewest stops" — minimize store count    │
│  B) "Cheapest"    — minimize total cost      │
│  C) "Balanced"    — weighted combination     │
│  D) "Single store" — best single store       │
│                                              │
│  Algorithm: Greedy set cover with cost       │
│  weighting (exact optimization is NP-hard,   │
│  greedy gives 90%+ optimal results)          │
└─────────────────────────────────────────────┘
    │
    ▼
Optimized shopping plan with store routing
```

---

## 5. Data Models

### User

```typescript
interface User {
  id: string
  email: string
  name: string
  location: {
    lat: number
    lng: number
    address: string
  }
  preferences: {
    dietary: string[]           // "vegetarian", "halal", "gluten-free"
    cuisines: string[]          // "chinese", "italian", "mexican"
    budget: "low" | "medium" | "high"
    maxStores: number           // default 3
    maxDistance: number          // miles, default 5
    preferredStores: string[]   // store IDs
    avoidedStores: string[]
  }
  pantry: PantryItem[]
  createdAt: Date
  updatedAt: Date
}

interface PantryItem {
  ingredientId: string
  name: string
  quantity: number
  unit: string
  addedAt: Date
  expiresAt?: Date
}
```

### Recipe

```typescript
interface Recipe {
  id: string
  name: string
  nameOriginal?: string        // non-English name
  cuisine: string
  servings: number
  prepTimeMin: number
  cookTimeMin: number
  difficulty: "easy" | "medium" | "hard"
  imageUrl?: string
  ingredients: RecipeIngredient[]
  steps: string[]
  source?: string              // URL or "ai-generated"
  embedding: number[]          // for similarity search
}

interface RecipeIngredient {
  name: string
  nameOriginal?: string
  quantity: number
  unit: string
  weightGrams?: number
  category: "produce" | "protein" | "dairy" | "spice" | "sauce" | "grain" | "staple" | "other"
  isSpecialty: boolean
  substitutes: string[]
  notes?: string
}
```

### Product Match

```typescript
interface ProductMatch {
  id: string
  ingredientName: string
  store: {
    id: string
    name: string
    chain: string
    address: string
    distanceMiles: number
    lat: number
    lng: number
  }
  product: {
    name: string
    brand: string
    size: string
    price: number
    pricePerUnit?: number
    imageUrl?: string
    aisle?: string
    inStock: boolean
    instacartId?: string
    krogerId?: string
  }
  matchScore: number           // 0-1, AI confidence
  matchNotes?: string
}
```

### Shopping Plan

```typescript
interface ShoppingPlan {
  id: string
  userId: string
  dishName: string
  recipeId: string
  strategy: "fewest_stops" | "cheapest" | "balanced" | "single_store"
  stops: ShoppingStop[]
  totalCost: number
  totalStores: number
  totalItems: number
  createdAt: Date
  status: "draft" | "active" | "completed"
}

interface ShoppingStop {
  order: number                // stop sequence
  store: {
    id: string
    name: string
    chain: string
    address: string
    distanceMiles: number
  }
  items: ShoppingItem[]
  subtotal: number
}

interface ShoppingItem {
  ingredientName: string
  productName: string
  brand: string
  quantity: number
  price: number
  aisle?: string
  checked: boolean
}
```

---

## 6. Tech Stack

### Frontend

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Mobile** | React Native (Expo) | Cross-platform; large ecosystem; Expo simplifies builds |
| **Web** | Next.js 15 | SSR for SEO; React ecosystem shared with mobile |
| **State** | Zustand | Lightweight; works in both RN and web |
| **UI Components** | Tamagui | Universal components for web + mobile |
| **Maps** | react-native-maps + Google Maps JS | Store locations and route display |
| **Animations** | Reanimated 3 | Smooth shopping list interactions |

### Backend

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Node.js (Bun) | Fast startup; TS native; good for I/O-heavy workloads |
| **Framework** | Hono | Lightweight; edge-ready; fast |
| **Database** | PostgreSQL + pgvector | Relational data + vector embeddings in one DB |
| **Cache** | Redis (Upstash) | Session, rate limiting, product cache |
| **Auth** | Clerk | Fast integration; social logins; works with RN |
| **File Storage** | Cloudflare R2 | S3-compatible; no egress fees |
| **Hosting** | Railway or Fly.io | Easy deployment; auto-scaling; PostgreSQL managed |

### AI / ML

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Recipe Understanding** | Claude Sonnet 4.6 | Best structured output; multilingual; fast |
| **Product Validation** | Claude Haiku 4.5 | Cheap + fast for batch validation |
| **Embeddings** | Voyage AI / OpenAI | Product and recipe similarity matching |
| **Ingredient Parsing** | ingredient-parser-nlp | Deterministic parsing for quantities/units |
| **Food Ontology** | Spoonacular | 2,600+ ingredient knowledge graph |

### External APIs

| API | Purpose | Pricing |
|-----|---------|---------|
| **Instacart Developer Platform** | Product search, cart, checkout (85K stores) | Affiliate: 5% commission |
| **Kroger API** | Direct product/price/aisle data (2.7K stores) | Free (1,600 calls/day) |
| **MealMe API** | Aggregated product search (1M+ stores) | Tiered pricing |
| **Google Maps Places** | Store discovery + routing | $17/1K requests |
| **Open Food Facts** | Product database (2.5M products) | Free |
| **Edamam** | Nutrition data | Free tier available |

---

## 7. MVP Scope

### MVP (Month 1-3): "Search → List"

**In scope:**
- [ ] Dish name input (English + Chinese)
- [ ] AI recipe understanding and ingredient extraction
- [ ] Location-based store discovery (Google Maps)
- [ ] Product matching via Instacart API
- [ ] AI product validation
- [ ] Single-store shopping list generation
- [ ] Basic user accounts (email login)
- [ ] Shopping list save & share
- [ ] Web app (Next.js)

**Out of scope for MVP:**
- Multi-store optimization
- Pantry tracking
- Mobile app
- Meal planning / weekly plans
- Social features
- Delivery/checkout integration
- Receipt scanning
- Photo-based ingredient detection

### V2 (Month 4-6): "Optimize & Order"

- [ ] Multi-store optimization algorithm
- [ ] Kroger API direct integration
- [ ] Instacart checkout integration (affiliate revenue starts)
- [ ] Pantry management (manual add/remove)
- [ ] React Native mobile app
- [ ] User preference learning
- [ ] Recipe history and favorites

### V3 (Month 7-12): "Smart & Social"

- [ ] Fridge/pantry photo scanning
- [ ] Weekly meal planning with consolidated lists
- [ ] Recipe sharing and community
- [ ] MealMe integration (expanded store coverage)
- [ ] Price history and deal alerts
- [ ] WeChat Mini Program (Chinese market)
- [ ] Subscription tier (premium features)
- [ ] Sponsored ingredient placements (revenue)

---

## 8. Monetization Integration Points

```
┌───────────────────────────────────────────────────────┐
│                  Revenue Streams                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│  1. INSTACART AFFILIATE (V2+)                        │
│     When user clicks "Order from [Store]"             │
│     → Opens Instacart with pre-filled cart            │
│     → 5% commission on ENTIRE cart (7-day window)     │
│     → Estimated $1.50-$5.00 per conversion           │
│                                                       │
│  2. FREEMIUM SUBSCRIPTION (V2+)                      │
│     Free: 5 dish lookups/month, single store          │
│     Pro ($5.99/mo): Unlimited lookups, multi-store    │
│       optimization, pantry tracking, meal planning    │
│     Family ($9.99/mo): Pro + 5 family members,       │
│       shared pantry, shared lists                     │
│                                                       │
│  3. SPONSORED PLACEMENTS (V3+)                       │
│     Brands pay to be recommended for ingredients      │
│     "Recommended: Lee Kum Kee Premium Soy Sauce"     │
│     CPM $15-$30 | Contextual, non-intrusive          │
│                                                       │
│  4. SPECIALTY STORE REFERRALS (V3+)                  │
│     Referral fees from Weee!, H Mart, 99 Ranch       │
│     When app directs users to specialty stores        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 9. Key API Interaction Examples

### Instacart Developer Platform — Recipe to Cart

```typescript
// Step 1: Create a recipe page with ingredients
const recipeResponse = await fetch("https://connect.instacart.com/v2/fulfillment/recipe", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${INSTACART_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Mapo Tofu",
    image_url: "https://...",
    link_url: "https://cookthedish.app/recipe/mapo-tofu",
    line_items: [
      {
        name: "firm tofu",
        measurements: [
          { quantity: 14, unit: "oz" },
          { quantity: 1, unit: "block" }
        ],
        filters: {}
      },
      {
        name: "doubanjiang chili bean paste",
        measurements: [
          { quantity: 8, unit: "oz" }
        ],
        filters: {
          brand: "Pixian"
        }
      }
    ]
  })
})
```

### Kroger API — Product Search

```typescript
// Search for products at nearby Kroger
const products = await fetch(
  `https://api.kroger.com/v1/products?filter.term=firm+tofu&filter.locationId=${storeId}`,
  {
    headers: {
      "Authorization": `Bearer ${krogerAccessToken}`,
      "Accept": "application/json"
    }
  }
)

// Response includes: productId, description, brand, price, aisle, images
```

### Claude AI — Ingredient Extraction

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6-20250514",
  max_tokens: 2048,
  messages: [{
    role: "user",
    content: "I want to cook 麻婆豆腐 (Mapo Tofu) for 2 people."
  }],
  system: `You are a culinary expert. Extract a complete ingredient list for the requested dish.
Return JSON matching this schema: { dish: { name_en, name_original, cuisine, servings }, ingredients: [{ name, name_original, quantity, unit, weight_g, category, is_specialty, substitutes, notes }] }`,
  // Use structured output for reliable JSON
})
```

---

## 10. Unique Differentiators to Build

1. **Multilingual Recipe Intelligence**: Enter dishes in any language. The AI understands "麻婆豆腐", "Pad Thai", "Рассольник" equally well.

2. **Specialty Ingredient Mapping**: A knowledge base of where specialty ingredients are typically found (Asian stores, Latin markets, Indian grocers, etc.) — not just mainstream supermarkets.

3. **Smart Substitution Engine**: When an ingredient isn't available nearby, suggest accessible alternatives with a quality-impact rating ("Using gochujang instead of doubanjiang: 70% similar flavor profile").

4. **Cross-Store Price Optimizer**: The only app that tells you the cheapest combination of stores for your exact shopping list, factoring in travel distance.

5. **Zero-Input Pantry Learning**: Over time, learn what staples the user always has (oil, salt, soy sauce) and stop listing them — without requiring manual pantry management.

---

## 11. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Grocery API access restricted | High | Multi-API strategy; Instacart as primary, MealMe as fallback, web scraping as last resort |
| LLM costs too high per query | Medium | Cache common dishes; use Haiku for validation; batch API calls |
| Product matching accuracy low | High | Human feedback loop; fine-tune matching over time; allow user corrections |
| Stores don't have specialty items | Medium | Specialty store database; online ordering fallback (Weee!, Amazon) |
| User adoption slow | Medium | Focus on underserved niche (international cuisine); viral sharing of shopping lists |
| Instacart changes affiliate terms | Medium | Diversify revenue; build direct store partnerships |

---

## 12. Success Metrics

| Metric | MVP Target | V2 Target |
|--------|-----------|-----------|
| Ingredient extraction accuracy | >90% | >97% |
| Product match relevance (user rating) | >3.5/5 | >4.2/5 |
| Dish-to-list generation time | <15 sec | <8 sec |
| Weekly active users | 1,000 | 10,000 |
| Shopping lists completed (checked off) | 30% | 50% |
| Instacart conversion rate | — | 15% |
| Monthly revenue | $0 | $5,000 |
