import { createHash } from "crypto";
import type { RecipeIngredient, Store } from "@/types";

export function recipeKey(dishName: string, servings: number): string {
  const normalized = dishName.trim().toLowerCase();
  return `${normalized}::${servings}`;
}

export function regionCode(lat: number, lng: number): string {
  const gridSize = 0.07; // ~5 miles
  const rLat = Math.round(lat / gridSize) * gridSize;
  const rLng = Math.round(lng / gridSize) * gridSize;
  return `${rLat.toFixed(2)},${rLng.toFixed(2)}`;
}

export function productMatchKey(
  ingredients: readonly RecipeIngredient[],
  stores: readonly Store[],
  lat: number,
  lng: number
): string {
  const ingNames = ingredients
    .filter((i) => !i.in_pantry)
    .map((i) => i.name.toLowerCase())
    .sort()
    .join("|");

  const chains = [...new Set(stores.map((s) => s.chain.toLowerCase()))]
    .sort()
    .join("|");

  const region = regionCode(lat, lng);

  const raw = `${ingNames}::${chains}::${region}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function instacartCacheKey(
  ingredients: { name: string; in_pantry?: boolean }[],
  lat: number,
  lng: number
): string {
  const ingNames = ingredients
    .filter((i) => !i.in_pantry)
    .map((i) => i.name.toLowerCase())
    .sort()
    .join("|");

  const region = regionCode(lat, lng);

  const raw = `${ingNames}::instacart::${region}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}
