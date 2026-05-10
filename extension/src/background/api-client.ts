import type { Recipe, RecipeIngredient, ProductMatch } from "@/types";
import type { IngredientScrapeResult } from "@/types/instacart";

const API_BASE = "https://cookthedish.dev01.top";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function parseRecipe(
  dishName: string,
  servings: number
): Promise<Recipe> {
  return post<Recipe>("/api/recipe", { dishName, servings });
}

export async function checkCache(
  ingredients: { id: string; name: string; in_pantry?: boolean }[],
  lat: number,
  lng: number
): Promise<{ hit: boolean; matches?: ProductMatch[] }> {
  return post("/api/ext/cache-check", { ingredients, lat, lng });
}

export async function submitScrapeResults(data: {
  recipe_id: string;
  ingredients: RecipeIngredient[];
  scrape_results: IngredientScrapeResult[];
  lat: number;
  lng: number;
}): Promise<{ matches: ProductMatch[] }> {
  return post("/api/ext/scrape-results", data);
}
