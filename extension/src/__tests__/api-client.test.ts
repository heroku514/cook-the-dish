import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseRecipe, checkCache, submitScrapeResults } from "@/background/api-client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve(message),
  });
}

describe("parseRecipe", () => {
  it("sends POST to /api/recipe with correct body", async () => {
    const recipe = { id: "r1", dish: { name_en: "Pad Thai" }, ingredients: [], steps: [] };
    mockOk(recipe);

    const result = await parseRecipe("Pad Thai", 2);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cookthedish.dev01.top/api/recipe",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: "Pad Thai", servings: 2 }),
      })
    );
    expect(result).toEqual(recipe);
  });

  it("throws on non-OK response", async () => {
    mockError(500, "Internal server error");
    await expect(parseRecipe("Bad", 1)).rejects.toThrow("API /api/recipe failed (500)");
  });
});

describe("checkCache", () => {
  it("sends ingredients and location to cache-check endpoint", async () => {
    mockOk({ hit: false });

    const result = await checkCache(
      [{ id: "i1", name: "tofu" }],
      37.77,
      -122.42
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cookthedish.dev01.top/api/ext/cache-check",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ingredients: [{ id: "i1", name: "tofu" }],
          lat: 37.77,
          lng: -122.42,
        }),
      })
    );
    expect(result.hit).toBe(false);
  });

  it("returns matches on cache hit", async () => {
    const matches = [{ ingredient_id: "i1", product_name: "Tofu" }];
    mockOk({ hit: true, matches });

    const result = await checkCache(
      [{ id: "i1", name: "tofu" }],
      37.77,
      -122.42
    );

    expect(result.hit).toBe(true);
    expect(result.matches).toEqual(matches);
  });
});

describe("submitScrapeResults", () => {
  it("posts scrape results and returns matches", async () => {
    const matches = [{ ingredient_id: "i1", product_name: "Firm Tofu" }];
    mockOk({ matches });

    const result = await submitScrapeResults({
      recipe_id: "r1",
      ingredients: [] as any,
      scrape_results: [],
      lat: 37.77,
      lng: -122.42,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://cookthedish.dev01.top/api/ext/scrape-results",
      expect.anything()
    );
    expect(result.matches).toEqual(matches);
  });
});
