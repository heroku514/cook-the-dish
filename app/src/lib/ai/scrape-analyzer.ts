import type { RecipeIngredient, ProductMatch, Store } from "@/types";
import { getProductMatchCache, setProductMatchCache } from "@/lib/db";
import { instacartCacheKey } from "@/lib/db/cache-keys";
import { getAnthropicClient } from "./mock-client";

interface ScrapedProduct {
  name: string;
  brand: string | null;
  price: number | null;
  price_text: string;
  unit_price: string | null;
  size: string | null;
  image_url: string | null;
  product_url: string;
  in_stock: boolean;
}

interface IngredientScrapeResult {
  ingredient_id: string;
  ingredient_name: string;
  search_query: string;
  products: ScrapedProduct[];
}

const SYSTEM_PROMPT = `You are a grocery shopping expert. Given recipe ingredients and REAL product search results from Instacart, pick the best product match for each ingredient.

You MUST respond with valid JSON — no markdown, no wrapping, just a JSON array:

[
  {
    "ingredient_id": "ing-0",
    "ingredient_name": "firm tofu",
    "product_name": "House Foods Premium Firm Tofu",
    "brand": "House Foods",
    "size": "14 oz",
    "price": 2.29,
    "price_per_unit": "$0.16/oz",
    "image_url": "https://...",
    "product_url": "/store/product/...",
    "in_stock": true,
    "match_score": 0.95,
    "match_notes": "Exact match — firm texture ideal for this dish"
  }
]

Rules:
- Pick ONE best product per ingredient from the scraped results
- Prefer products that match the required quantity/size for the recipe
- match_score: 0.9-1.0 = exact match, 0.7-0.89 = good substitute, 0.5-0.69 = acceptable, <0.5 = poor
- If no good products were found for an ingredient, still include it with in_stock=false and match_score=0
- Use the actual prices and names from the scraped data — do NOT make up prices`;

function makeInstacartStore(lat: number, lng: number): Store {
  return {
    id: "instacart-default",
    name: "Instacart",
    chain: "instacart",
    address: "Delivery",
    distance_miles: 0,
    lat,
    lng,
    type: "mainstream",
  };
}

export async function analyzeScrapeResults(
  ingredients: RecipeIngredient[],
  scrapeResults: IngredientScrapeResult[],
  lat: number,
  lng: number
): Promise<ProductMatch[]> {
  const cacheK = instacartCacheKey(ingredients, lat, lng);
  const cached = await getProductMatchCache(cacheK);
  if (cached) {
    console.log(`[CACHE HIT] instacart-scrape: ${cacheK.slice(0, 12)}…`);
    const store = makeInstacartStore(lat, lng);
    return (cached as Record<string, unknown>[]).map((m) => ({
      ...m,
      store,
    })) as ProductMatch[];
  }

  console.log(`[CACHE MISS] instacart-scrape: ${cacheK.slice(0, 12)}… — calling Claude API`);

  const client = getAnthropicClient();

  const ingredientData = scrapeResults
    .map((sr) => {
      const topProducts = sr.products.slice(0, 10);
      const productList = topProducts
        .map(
          (p, i) =>
            `  ${i + 1}. "${p.name}" — ${p.price_text || "no price"}${p.size ? `, ${p.size}` : ""}${p.brand ? ` (${p.brand})` : ""}${p.in_stock ? "" : " [OUT OF STOCK]"}`
        )
        .join("\n");
      return `INGREDIENT: ${sr.ingredient_id} — ${sr.ingredient_name}\nSearch query: "${sr.search_query}"\nProducts found (${sr.products.length} total, showing top 10):\n${productList || "  No products found"}`;
    })
    .join("\n\n");

  const recipeContext = ingredients
    .filter((i) => !i.in_pantry)
    .map(
      (i) =>
        `- ${i.id}: ${i.name}, ${i.quantity} ${i.unit}${i.weight_g ? ` (~${i.weight_g}g)` : ""}`
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
        content: `Pick the best Instacart product for each recipe ingredient.

RECIPE INGREDIENTS:
${recipeContext}

INSTACART SEARCH RESULTS:
${ingredientData}

Return a JSON array with the best match per ingredient.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse scrape analysis from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  await setProductMatchCache(cacheK, parsed, 120);

  const store = makeInstacartStore(lat, lng);
  return parsed.map((m: Record<string, unknown>) => ({
    ...m,
    store,
  })) as ProductMatch[];
}
