import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import type { Recipe } from "@/types";
import { getRecipeCache, setRecipeCache } from "@/lib/db";
import { recipeKey } from "@/lib/db/cache-keys";

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

function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

const DEMO_RECIPE = {
  dish: {
    name_en: "Mapo Tofu",
    name_original: "麻婆豆腐",
    cuisine: "Sichuan Chinese",
    servings: 2,
    prep_time_min: 15,
    cook_time_min: 15,
    description:
      "A fiery Sichuan classic featuring silky tofu in a spicy, numbing chili-bean sauce with ground pork.",
  },
  ingredients: [
    { name: "firm tofu", name_original: "豆腐", quantity: 1, unit: "block", weight_g: 400, category: "protein", is_specialty: false, substitutes: ["silken tofu", "extra firm tofu"], notes: "Cut into 1-inch cubes, blanch in salted water for 2 minutes" },
    { name: "ground pork", name_original: "猪肉末", quantity: 150, unit: "gram", weight_g: 150, category: "protein", is_specialty: false, substitutes: ["ground beef", "ground chicken", "crumbled tempeh"], notes: null },
    { name: "doubanjiang (chili bean paste)", name_original: "豆瓣酱", quantity: 2, unit: "tablespoon", weight_g: 36, category: "sauce", is_specialty: true, substitutes: ["gochujang + miso paste", "sambal oelek + soy sauce"], notes: "Pixian brand preferred — the soul of this dish" },
    { name: "Sichuan peppercorns", name_original: "花椒", quantity: 1, unit: "tablespoon", weight_g: 5, category: "spice", is_specialty: true, substitutes: ["black peppercorns + lemon zest", "Japanese sansho pepper"], notes: "Toast and grind fresh for best flavor" },
    { name: "scallions", name_original: "葱", quantity: 3, unit: "stalk", weight_g: 30, category: "produce", is_specialty: false, substitutes: ["chives", "leek greens"], notes: "Slice into thin rings, separate white and green parts" },
    { name: "garlic", name_original: "蒜", quantity: 4, unit: "clove", weight_g: 16, category: "produce", is_specialty: false, substitutes: ["garlic paste"], notes: "Finely minced" },
    { name: "fresh ginger", name_original: "姜", quantity: 1, unit: "inch piece", weight_g: 10, category: "produce", is_specialty: false, substitutes: ["ginger paste", "ground ginger (1/2 tsp)"], notes: "Finely minced" },
    { name: "fermented black beans", name_original: "豆豉", quantity: 1, unit: "tablespoon", weight_g: 12, category: "sauce", is_specialty: true, substitutes: ["black bean sauce", "extra doubanjiang"], notes: "Rinse and roughly chop" },
    { name: "soy sauce", name_original: "酱油", quantity: 1, unit: "tablespoon", weight_g: 15, category: "sauce", is_specialty: false, substitutes: ["tamari", "coconut aminos"], notes: "Light soy sauce preferred" },
    { name: "sesame oil", name_original: "麻油", quantity: 1, unit: "teaspoon", weight_g: 5, category: "staple", is_specialty: false, substitutes: ["toasted sesame oil"], notes: "For finishing" },
    { name: "cornstarch", name_original: "淀粉", quantity: 1, unit: "tablespoon", weight_g: 10, category: "staple", is_specialty: false, substitutes: ["potato starch", "tapioca starch"], notes: "Mix with 2 tbsp water to make a slurry" },
    { name: "vegetable oil", name_original: "植物油", quantity: 2, unit: "tablespoon", weight_g: 28, category: "staple", is_specialty: false, substitutes: ["peanut oil", "canola oil"], notes: null },
    { name: "chicken broth", name_original: "鸡汤", quantity: 0.5, unit: "cup", weight_g: 120, category: "staple", is_specialty: false, substitutes: ["vegetable broth", "water + bouillon"], notes: "Or water for a lighter version" },
  ],
  steps: [
    "Cut tofu into 1-inch cubes. Bring a pot of salted water to a boil and blanch the tofu for 2 minutes. Drain and set aside.",
    "Toast Sichuan peppercorns in a dry pan over medium heat for 2 minutes until fragrant. Grind to a powder using a mortar and pestle.",
    "Heat vegetable oil in a wok over high heat. Add ground pork and stir-fry, breaking it apart, until browned and crispy (3-4 minutes).",
    "Push the pork to the side. Add doubanjiang and fermented black beans to the oil. Stir-fry for 1 minute until the oil turns red and fragrant.",
    "Add minced garlic, ginger, and white parts of scallions. Stir-fry for 30 seconds.",
    "Pour in chicken broth and soy sauce. Bring to a simmer.",
    "Gently slide in the blanched tofu. Simmer for 3-4 minutes, carefully stirring to coat tofu with sauce.",
    "Drizzle in the cornstarch slurry while gently stirring. Cook until the sauce thickens and clings to the tofu (1-2 minutes).",
    "Remove from heat. Drizzle with sesame oil, sprinkle with ground Sichuan peppercorn and scallion greens. Serve immediately with steamed rice.",
  ],
};

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
  if (isDemoMode()) {
    return buildRecipe({
      ...DEMO_RECIPE,
      dish: {
        ...DEMO_RECIPE.dish,
        name_en: dishName.match(/[a-zA-Z]/) ? dishName : DEMO_RECIPE.dish.name_en,
        name_original: dishName.match(/[a-zA-Z]/) ? DEMO_RECIPE.dish.name_original : dishName,
      },
    });
  }

  const cacheK = recipeKey(dishName, servings);
  const cached = await getRecipeCache(cacheK);
  if (cached) {
    console.log(`[CACHE HIT] recipe: ${cacheK}`);
    return buildRecipe(cached as { dish: Recipe["dish"]; ingredients: Record<string, unknown>[]; steps: string[] });
  }

  console.log(`[CACHE MISS] recipe: ${cacheK} — calling Claude API`);

  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
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
