import type { PopupMessage, WorkerToPopupMessage } from "@/types/messages";
import type { Recipe, ProductMatch } from "@/types";
import { parseRecipe, checkCache, submitScrapeResults } from "./api-client";
import { coordinateScrape } from "./scrape-coordinator";

let currentRecipe: Recipe | null = null;
let currentMatches: ProductMatch[] | null = null;
let userLocation: { lat: number; lng: number } | null = null;

chrome.runtime.onMessage.addListener(
  (message: PopupMessage, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true;
  }
);

async function handleMessage(
  message: PopupMessage,
  sendResponse: (response: WorkerToPopupMessage) => void
) {
  try {
    switch (message.type) {
      case "PARSE_RECIPE": {
        const recipe = await parseRecipe(message.dishName, message.servings);
        currentRecipe = recipe;
        currentMatches = null;
        sendResponse({ type: "RECIPE_PARSED", recipe });
        break;
      }

      case "SET_LOCATION": {
        userLocation = { lat: message.lat, lng: message.lng };
        sendResponse({ type: "STATUS", status: "location_set" });
        break;
      }

      case "START_PRODUCT_SEARCH": {
        if (!currentRecipe) {
          sendResponse({ type: "ERROR", message: "No recipe loaded", step: "search" });
          return;
        }
        if (!userLocation) {
          sendResponse({ type: "LOCATION_NEEDED" });
          return;
        }

        const cacheResult = await checkCache(
          currentRecipe.ingredients,
          userLocation.lat,
          userLocation.lng
        );

        if (cacheResult.hit && cacheResult.matches) {
          currentMatches = cacheResult.matches;
          sendResponse({ type: "CACHE_HIT", matches: cacheResult.matches });
          return;
        }

        const port = chrome.runtime.connect({ name: "scrape-progress" });

        const scrapeResults = await coordinateScrape(
          currentRecipe.id,
          currentRecipe.ingredients,
          (ingredient, current, total) => {
            port.postMessage({
              type: "SCRAPE_PROGRESS",
              ingredient,
              current,
              total,
            });
          }
        );

        const { matches } = await submitScrapeResults({
          recipe_id: currentRecipe.id,
          ingredients: currentRecipe.ingredients,
          scrape_results: scrapeResults,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        currentMatches = matches;
        sendResponse({ type: "PRODUCTS_MATCHED", matches });
        break;
      }

      case "GENERATE_PLAN": {
        if (!currentRecipe || !currentMatches) {
          sendResponse({
            type: "ERROR",
            message: "No recipe or matches available",
            step: "plan",
          });
          return;
        }

        const { optimizeShoppingPlan } = await import("@/shared/optimizer");

        const plan = optimizeShoppingPlan(currentMatches, {
          strategy: message.strategy,
          maxStores: 3,
          dishName: currentRecipe.dish.name_en,
          recipeId: currentRecipe.id,
        });

        sendResponse({ type: "PLAN_READY", plan });
        break;
      }

      case "GET_STATUS": {
        sendResponse({
          type: "STATUS",
          status: currentRecipe ? "recipe_loaded" : "idle",
        });
        break;
      }
    }
  } catch (e) {
    sendResponse({
      type: "ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
      step: message.type,
    });
  }
}
