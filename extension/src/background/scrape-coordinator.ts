import type { RecipeIngredient } from "@/types";
import type { IngredientScrapeResult, ScrapeJob } from "@/types/instacart";
import type { ScraperResponse } from "@/types/messages";
import { buildSearchQuery } from "@/shared/cache-keys";

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function coordinateScrape(
  recipeId: string,
  ingredients: RecipeIngredient[],
  onProgress: (ingredient: string, current: number, total: number) => void
): Promise<IngredientScrapeResult[]> {
  const toBuy = ingredients.filter((i) => !i.in_pantry);
  const results: IngredientScrapeResult[] = [];

  const tab = await chrome.tabs.create({
    url: "https://www.instacart.com",
    active: false,
  });
  const tabId = tab.id!;

  const job: ScrapeJob = {
    id: `scrape-${Date.now()}`,
    recipe_id: recipeId,
    ingredients: toBuy.map((i) => ({
      id: i.id,
      name: i.name,
      search_query: buildSearchQuery(i.name),
    })),
    status: "in_progress",
    current_index: 0,
    results: [],
    started_at: new Date().toISOString(),
    instacart_tab_id: tabId,
  };

  await chrome.storage.session.set({ scrapeJob: job });

  await new Promise<void>((resolve) => {
    function onComplete(
      _tabId: number,
      info: chrome.tabs.TabChangeInfo
    ) {
      if (_tabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onComplete);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(onComplete);
  });

  for (let i = 0; i < toBuy.length; i++) {
    const ing = toBuy[i];
    const query = buildSearchQuery(ing.name);
    onProgress(ing.name, i + 1, toBuy.length);

    const searchUrl = `https://www.instacart.com/store/search/${encodeURIComponent(query)}`;
    await chrome.tabs.update(tabId, { url: searchUrl });

    await new Promise<void>((resolve) => {
      function onComplete(
        _tabId: number,
        info: chrome.tabs.TabChangeInfo
      ) {
        if (_tabId === tabId && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(onComplete);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(onComplete);
    });

    await randomDelay(1000, 2000);

    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: "SCRAPE_SEARCH_RESULTS",
      }) as ScraperResponse;

      if (response.type === "LOGIN_REQUIRED") {
        await chrome.tabs.update(tabId, { active: true });
        throw new Error(
          "Please log into Instacart and set a delivery address, then try again."
        );
      }

      if (response.type === "SCRAPE_COMPLETE") {
        results.push({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          search_query: query,
          products: response.products,
          scraped_at: new Date().toISOString(),
        });
      } else if (response.type === "SCRAPE_ERROR") {
        results.push({
          ingredient_id: ing.id,
          ingredient_name: ing.name,
          search_query: query,
          products: [],
          scraped_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("log into Instacart")
      ) {
        throw e;
      }
      results.push({
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        search_query: query,
        products: [],
        scraped_at: new Date().toISOString(),
      });
    }

    if (i < toBuy.length - 1) {
      await randomDelay(2000, 3500);
    }
  }

  await chrome.tabs.remove(tabId);
  await chrome.storage.session.remove("scrapeJob");

  return results;
}
