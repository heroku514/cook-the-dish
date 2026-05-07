import type { RecipeIngredient, Store, ProductMatch } from "@/types";
import { getProductMatchCache, setProductMatchCache } from "@/lib/db";
import { productMatchKey } from "@/lib/db/cache-keys";
import { getAnthropicClient } from "./mock-client";

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
  const ingredientsToBuy = ingredients.filter((ing) => !ing.in_pantry);

  const cacheK = productMatchKey(ingredientsToBuy, stores, lat, lng);
  const cached = await getProductMatchCache(cacheK);
  if (cached) {
    console.log(`[CACHE HIT] product-match: ${cacheK.slice(0, 12)}…`);
    return hydrateMatches(cached as Record<string, unknown>[], stores);
  }

  console.log(`[CACHE MISS] product-match: ${cacheK.slice(0, 12)}… — calling Claude API`);

  const client = getAnthropicClient();

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

  const message = await client.messages.create({
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
