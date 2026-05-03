import Anthropic from "@anthropic-ai/sdk";
import type { RecipeIngredient, Store, ProductMatch } from "@/types";
import { getProductMatchCache, setProductMatchCache } from "@/lib/db";
import { productMatchKey } from "@/lib/db/cache-keys";

const SYSTEM_PROMPT = `You are a grocery shopping expert. Given a list of recipe ingredients and available stores, generate realistic product matches for each ingredient at each store.

You MUST respond with valid JSON — no markdown, no wrapping, just a JSON array of product matches:

[
  {
    "ingredient_id": "ing-0",
    "ingredient_name": "firm tofu",
    "store_id": "store-1",
    "product_name": "House Foods Premium Firm Tofu",
    "brand": "House Foods",
    "size": "14 oz",
    "price": 2.29,
    "price_per_unit": "$0.16/oz",
    "aisle": "Produce/Refrigerated",
    "in_stock": true,
    "match_score": 0.95,
    "match_notes": "Excellent match — firm texture ideal for this dish"
  }
]

Rules:
- Use realistic US grocery store product names, brands, and prices
- Specialty/ethnic stores (H Mart, 99 Ranch, etc.) should carry specialty Asian/ethnic ingredients
- Mainstream stores (Kroger, Walmart, Safeway) may not have specialty ingredients — set in_stock=false for those
- match_score: 0.9-1.0 = perfect match, 0.7-0.89 = good alternative, 0.5-0.69 = acceptable substitute, <0.5 = poor match
- Prices should reflect real US grocery prices (2026)
- Include aisle information when relevant
- If a store doesn't carry an ingredient, still include an entry with in_stock=false and match_score=0`;

function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

interface DemoProduct {
  product_name: string;
  brand: string;
  size: string;
  price: number;
  price_per_unit: string;
  aisle: string;
}

const DEMO_PRODUCT_DB: Record<string, Record<string, DemoProduct | null>> = {
  "firm tofu": {
    mainstream: { product_name: "House Foods Premium Firm Tofu", brand: "House Foods", size: "14 oz", price: 2.29, price_per_unit: "$0.16/oz", aisle: "Produce/Refrigerated" },
    ethnic: { product_name: "Pulmuone Extra Firm Tofu", brand: "Pulmuone", size: "16 oz", price: 2.49, price_per_unit: "$0.16/oz", aisle: "Refrigerated" },
    organic: { product_name: "Wildwood Organic Firm Tofu", brand: "Wildwood", size: "14 oz", price: 3.49, price_per_unit: "$0.25/oz", aisle: "Refrigerated" },
  },
  "ground pork": {
    mainstream: { product_name: "Ground Pork 80/20", brand: "Store Brand", size: "1 lb", price: 4.99, price_per_unit: "$4.99/lb", aisle: "Meat" },
    ethnic: { product_name: "Ground Pork", brand: "Fresh", size: "1 lb", price: 4.49, price_per_unit: "$4.49/lb", aisle: "Meat" },
    organic: { product_name: "Organic Ground Pork", brand: "Applegate", size: "1 lb", price: 8.99, price_per_unit: "$8.99/lb", aisle: "Meat" },
  },
  "doubanjiang (chili bean paste)": {
    mainstream: null,
    ethnic: { product_name: "Pixian Doubanjiang Chili Bean Paste", brand: "Juan Cheng", size: "500g", price: 4.99, price_per_unit: "$0.28/oz", aisle: "Sauces & Condiments" },
    organic: null,
  },
  "Sichuan peppercorns": {
    mainstream: null,
    ethnic: { product_name: "Sichuan Peppercorns", brand: "Spicy Element", size: "4 oz", price: 5.99, price_per_unit: "$1.50/oz", aisle: "Spices" },
    organic: null,
  },
  "scallions": {
    mainstream: { product_name: "Green Onions Bunch", brand: "Fresh", size: "1 bunch", price: 1.29, price_per_unit: "$1.29/bunch", aisle: "Produce" },
    ethnic: { product_name: "Scallions Bunch", brand: "Fresh", size: "1 bunch", price: 0.99, price_per_unit: "$0.99/bunch", aisle: "Produce" },
    organic: { product_name: "Organic Green Onions", brand: "Organic", size: "1 bunch", price: 1.99, price_per_unit: "$1.99/bunch", aisle: "Produce" },
  },
  "garlic": {
    mainstream: { product_name: "Garlic Head", brand: "Fresh", size: "1 head", price: 0.69, price_per_unit: "$0.69/head", aisle: "Produce" },
    ethnic: { product_name: "Garlic Head", brand: "Fresh", size: "3-pack", price: 1.49, price_per_unit: "$0.50/head", aisle: "Produce" },
    organic: { product_name: "Organic Garlic", brand: "Organic", size: "1 head", price: 1.29, price_per_unit: "$1.29/head", aisle: "Produce" },
  },
  "fresh ginger": {
    mainstream: { product_name: "Fresh Ginger Root", brand: "Fresh", size: "per lb", price: 0.89, price_per_unit: "$4.99/lb", aisle: "Produce" },
    ethnic: { product_name: "Fresh Ginger Root", brand: "Fresh", size: "per lb", price: 0.69, price_per_unit: "$3.99/lb", aisle: "Produce" },
    organic: { product_name: "Organic Ginger Root", brand: "Organic", size: "per lb", price: 1.49, price_per_unit: "$7.99/lb", aisle: "Produce" },
  },
  "fermented black beans": {
    mainstream: null,
    ethnic: { product_name: "Yang Jiang Preserved Black Beans", brand: "Yang Jiang", size: "16 oz", price: 3.49, price_per_unit: "$0.22/oz", aisle: "Sauces & Condiments" },
    organic: null,
  },
  "soy sauce": {
    mainstream: { product_name: "Kikkoman Soy Sauce", brand: "Kikkoman", size: "15 oz", price: 3.49, price_per_unit: "$0.23/oz", aisle: "Asian Foods" },
    ethnic: { product_name: "Lee Kum Kee Premium Soy Sauce", brand: "Lee Kum Kee", size: "16.9 oz", price: 2.99, price_per_unit: "$0.18/oz", aisle: "Sauces & Condiments" },
    organic: { product_name: "San-J Organic Tamari", brand: "San-J", size: "10 oz", price: 5.49, price_per_unit: "$0.55/oz", aisle: "Condiments" },
  },
  "sesame oil": {
    mainstream: { product_name: "Kadoya Sesame Oil", brand: "Kadoya", size: "5.5 oz", price: 3.99, price_per_unit: "$0.73/oz", aisle: "Asian Foods" },
    ethnic: { product_name: "Ottogi Premium Sesame Oil", brand: "Ottogi", size: "10.8 oz", price: 6.99, price_per_unit: "$0.65/oz", aisle: "Oils" },
    organic: { product_name: "Spectrum Organic Sesame Oil", brand: "Spectrum", size: "8 oz", price: 6.49, price_per_unit: "$0.81/oz", aisle: "Oils" },
  },
  "cornstarch": {
    mainstream: { product_name: "Argo Cornstarch", brand: "Argo", size: "16 oz", price: 2.19, price_per_unit: "$0.14/oz", aisle: "Baking" },
    ethnic: { product_name: "Cornstarch", brand: "Store Brand", size: "16 oz", price: 1.99, price_per_unit: "$0.12/oz", aisle: "Baking" },
    organic: { product_name: "Bob's Red Mill Cornstarch", brand: "Bob's Red Mill", size: "18 oz", price: 4.49, price_per_unit: "$0.25/oz", aisle: "Baking" },
  },
  "vegetable oil": {
    mainstream: { product_name: "Wesson Vegetable Oil", brand: "Wesson", size: "48 oz", price: 4.49, price_per_unit: "$0.09/oz", aisle: "Oils" },
    ethnic: { product_name: "Vegetable Oil", brand: "Store Brand", size: "48 oz", price: 3.99, price_per_unit: "$0.08/oz", aisle: "Oils" },
    organic: { product_name: "365 Organic Canola Oil", brand: "365", size: "32 oz", price: 5.99, price_per_unit: "$0.19/oz", aisle: "Oils" },
  },
  "chicken broth": {
    mainstream: { product_name: "Swanson Chicken Broth", brand: "Swanson", size: "32 oz", price: 2.99, price_per_unit: "$0.09/oz", aisle: "Soups" },
    ethnic: { product_name: "Chicken Broth", brand: "Store Brand", size: "32 oz", price: 2.49, price_per_unit: "$0.08/oz", aisle: "Soups" },
    organic: { product_name: "Pacific Organic Chicken Broth", brand: "Pacific Foods", size: "32 oz", price: 4.99, price_per_unit: "$0.16/oz", aisle: "Soups" },
  },
};

function getDemoMatches(
  ingredients: RecipeIngredient[],
  stores: Store[]
): ProductMatch[] {
  const matches: ProductMatch[] = [];

  for (const ing of ingredients) {
    if (ing.in_pantry) continue;

    const productEntry = DEMO_PRODUCT_DB[ing.name] || null;

    for (const store of stores) {
      const storeType = store.type === "ethnic" ? "ethnic" : store.type === "organic" ? "organic" : "mainstream";
      const product = productEntry?.[storeType] ?? null;

      if (product) {
        matches.push({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          store,
          product_name: product.product_name,
          brand: product.brand,
          size: product.size,
          price: product.price,
          price_per_unit: product.price_per_unit,
          aisle: product.aisle,
          in_stock: true,
          match_score: ing.is_specialty && storeType === "ethnic" ? 0.95 : 0.85,
          match_notes: ing.is_specialty && storeType === "ethnic" ? "Best match — specialty store carries authentic version" : "Good match",
        });
      } else {
        matches.push({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          store,
          product_name: `${ing.name} (not available)`,
          brand: "",
          size: "",
          price: 0,
          in_stock: false,
          match_score: 0,
          match_notes: `${store.name} does not carry this item`,
        });
      }
    }
  }

  return matches;
}

function hydrateMatches(
  parsed: Record<string, unknown>[],
  stores: Store[]
): ProductMatch[] {
  const storeMap = new Map(stores.map((s) => [s.id, s]));
  return parsed.map((match) => ({
    ...match,
    store: storeMap.get(match.store_id as string) || stores[0],
  })) as ProductMatch[];
}

export async function matchProducts(
  ingredients: RecipeIngredient[],
  stores: Store[],
  lat: number = 37.7749,
  lng: number = -122.4194
): Promise<ProductMatch[]> {
  if (isDemoMode()) {
    return getDemoMatches(ingredients, stores);
  }

  const ingredientsToBuy = ingredients.filter((ing) => !ing.in_pantry);

  const cacheK = productMatchKey(ingredientsToBuy, stores, lat, lng);
  const cached = await getProductMatchCache(cacheK);
  if (cached) {
    console.log(`[CACHE HIT] product-match: ${cacheK.slice(0, 12)}…`);
    return hydrateMatches(cached as Record<string, unknown>[], stores);
  }

  console.log(`[CACHE MISS] product-match: ${cacheK.slice(0, 12)}… — calling Claude API`);

  const anthropic = new Anthropic();

  const ingredientList = ingredientsToBuy
    .map(
      (ing) =>
        `- ${ing.id}: ${ing.name}${ing.name_original ? ` (${ing.name_original})` : ""}, ${ing.quantity} ${ing.unit}${ing.weight_g ? `, ~${ing.weight_g}g` : ""}, specialty=${ing.is_specialty}`
    )
    .join("\n");

  const storeList = stores
    .map(
      (s) =>
        `- ${s.id}: ${s.name} (${s.chain}), ${s.type} store, ${s.distance_miles} mi away`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Find product matches for these ingredients at these stores.

INGREDIENTS:
${ingredientList}

STORES:
${storeList}

Return a JSON array of product matches. Include one entry per ingredient per store (even if not in stock).`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse product matches from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  await setProductMatchCache(cacheK, parsed);

  return hydrateMatches(parsed, stores);
}
