import type { Recipe, ProductMatch, ShoppingPlan, OptimizationStrategy } from "@shared/index";
import type { ScrapedProduct } from "./instacart";

export type PopupMessage =
  | { type: "PARSE_RECIPE"; dishName: string; servings: number }
  | { type: "SET_LOCATION"; lat: number; lng: number }
  | { type: "START_PRODUCT_SEARCH"; recipeId: string }
  | { type: "GENERATE_PLAN"; strategy: OptimizationStrategy }
  | { type: "GET_STATUS" };

export type WorkerToPopupMessage =
  | { type: "RECIPE_PARSED"; recipe: Recipe }
  | { type: "SCRAPE_PROGRESS"; ingredient: string; current: number; total: number }
  | { type: "PRODUCTS_MATCHED"; matches: ProductMatch[] }
  | { type: "PLAN_READY"; plan: ShoppingPlan }
  | { type: "ERROR"; message: string; step: string }
  | { type: "LOCATION_NEEDED" }
  | { type: "CACHE_HIT"; matches: ProductMatch[] }
  | { type: "STATUS"; status: string };

export type ContentScriptMessage =
  | { type: "SCRAPE_SEARCH_RESULTS" }
  | { type: "PING" };

export type ScraperResponse =
  | { type: "SCRAPE_COMPLETE"; ingredientQuery: string; products: ScrapedProduct[] }
  | { type: "SCRAPE_ERROR"; ingredientQuery: string; error: string }
  | { type: "PAGE_READY" }
  | { type: "LOGIN_REQUIRED" }
  | { type: "PONG" };
