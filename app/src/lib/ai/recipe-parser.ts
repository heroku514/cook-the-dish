import { v4 as uuidv4 } from "uuid";
import type { Recipe } from "@/types";
import { getRecipeCache, setRecipeCache } from "@/lib/db";
import { recipeKey } from "@/lib/db/cache-keys";
import { getAnthropicClient } from "./mock-client";

const SYSTEM_PROMPT = `You are a world-class culinary expert with encyclopedic knowledge of recipes from every cuisine. Given a dish name (in any language), return a complete recipe with ingredients.

You MUST respond with valid JSON matching this exact schema — no markdown, no wrapping, just the JSON object:

{
  "dish": {
    "name_en": "English name",
    "name_original": "Original language name or null",
    "cuisine": "Cuisine type (e.g., Sichuan Chinese, Italian, Mexican)",
    "servings": 2,
    "prep_time_min": 15,
    "cook_time_min": 20,
    "description": "One-sentence description of the dish"
  },
  "ingredients": [
    {
      "name": "ingredient name in English",
      "name_original": "original language name or null",
      "quantity": 1,
      "unit": "piece/cup/tablespoon/gram/etc",
      "weight_g": 400,
      "category": "produce|protein|dairy|spice|sauce|grain|staple|other",
      "is_specialty": false,
      "substitutes": ["substitute 1", "substitute 2"],
      "notes": "Preparation notes or brand recommendations"
    }
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}

Rules:
- Include ALL ingredients needed, including oil, salt, and basic seasonings
- Set is_specialty=true for ingredients not commonly found in mainstream US supermarkets
- Provide weight_g estimates for all ingredients
- Include 2-3 substitutes for specialty ingredients
- Keep steps concise and actionable
- Quantities should be for the specified number of servings`;

function buildRecipe(parsed: { dish: Recipe["dish"]; ingredients: Record<string, unknown>[]; steps: string[] }): Recipe {
  return {
    id: uuidv4(),
    dish: parsed.dish,
    ingredients: parsed.ingredients.map(
      (ing: Record<string, unknown>, index: number) => ({
        id: `ing-${index}`,
        ...ing,
        in_pantry: false,
      })
    ) as Recipe["ingredients"],
    steps: parsed.steps,
  };
}

export async function parseRecipe(
  dishName: string,
  servings: number = 2
): Promise<Recipe> {
  const cacheK = recipeKey(dishName, servings);
  const cached = await getRecipeCache(cacheK);
  if (cached) {
    console.log(`[CACHE HIT] recipe: ${cacheK}`);
    return buildRecipe(cached as { dish: Recipe["dish"]; ingredients: Record<string, unknown>[]; steps: string[] });
  }

  console.log(`[CACHE MISS] recipe: ${cacheK} — calling Claude API`);

  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 2048,
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
        content: `I want to cook "${dishName}" for ${servings} people. Give me the complete recipe with all ingredients.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse recipe from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  await setRecipeCache(cacheK, parsed);

  return buildRecipe(parsed);
}
