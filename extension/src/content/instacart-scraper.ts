import { waitForSearchResults } from "./search-navigator";
import { extractProductCards } from "./dom-extractors";
import type { ContentScriptMessage, ScraperResponse } from "@/types/messages";

function checkLoginState(): boolean {
  const addressIndicator = document.querySelector(
    '[data-testid="address-display"], [class*="AddressDisplay"], [class*="delivery-address"]'
  );
  return !!addressIndicator;
}

chrome.runtime.onMessage.addListener(
  (message: ContentScriptMessage, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ type: "PONG" } satisfies ScraperResponse);
      return true;
    }

    if (message.type === "SCRAPE_SEARCH_RESULTS") {
      if (!checkLoginState()) {
        sendResponse({
          type: "LOGIN_REQUIRED",
        } satisfies ScraperResponse);
        return true;
      }

      (async () => {
        try {
          await waitForSearchResults();
          const products = extractProductCards();
          const url = new URL(window.location.href);
          const pathParts = url.pathname.split("/");
          const searchIndex = pathParts.indexOf("search");
          const query =
            searchIndex >= 0
              ? decodeURIComponent(pathParts[searchIndex + 1] || "")
              : "";

          sendResponse({
            type: "SCRAPE_COMPLETE",
            ingredientQuery: query,
            products,
          } satisfies ScraperResponse);
        } catch (e) {
          sendResponse({
            type: "SCRAPE_ERROR",
            ingredientQuery: "",
            error: e instanceof Error ? e.message : "Unknown error",
          } satisfies ScraperResponse);
        }
      })();

      return true;
    }

    return false;
  }
);
