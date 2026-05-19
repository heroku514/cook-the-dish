import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "@/popup/store";
import type { Recipe, ProductMatch, ShoppingPlan } from "@/types";

const mockRecipe: Recipe = {
  id: "r1",
  dish: {
    name_en: "Pad Thai",
    cuisine: "Thai",
    servings: 2,
    prep_time_min: 15,
    cook_time_min: 20,
    description: "Classic Thai stir-fried noodles",
  },
  ingredients: [
    {
      id: "i1",
      name: "rice noodles",
      quantity: 200,
      unit: "g",
      category: "grain",
      is_specialty: false,
      substitutes: [],
    },
  ],
  steps: ["Cook noodles"],
};

const mockStore = {
  id: "s1",
  name: "Kroger #123",
  chain: "Kroger",
  address: "123 Main St",
  distance_miles: 1.2,
  lat: 37.77,
  lng: -122.42,
  type: "mainstream" as const,
};

const mockMatch: ProductMatch = {
  ingredient_id: "i1",
  ingredient_name: "rice noodles",
  store: mockStore,
  product_name: "Thai Kitchen Rice Noodles",
  brand: "Thai Kitchen",
  size: "14 oz",
  price: 3.99,
  in_stock: true,
  match_score: 0.95,
};

describe("popup store", () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it("starts with initial state", () => {
    const state = useStore.getState();
    expect(state.step).toBe("input");
    expect(state.recipe).toBeNull();
    expect(state.matches).toBeNull();
    expect(state.plan).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("sets recipe and preserves other state", () => {
    useStore.getState().setRecipe(mockRecipe);
    const state = useStore.getState();
    expect(state.recipe).toEqual(mockRecipe);
    expect(state.step).toBe("input");
  });

  it("sets step", () => {
    useStore.getState().setStep("scraping");
    expect(useStore.getState().step).toBe("scraping");
  });

  it("sets matches", () => {
    useStore.getState().setMatches([mockMatch]);
    expect(useStore.getState().matches).toHaveLength(1);
    expect(useStore.getState().matches![0].product_name).toBe("Thai Kitchen Rice Noodles");
  });

  it("sets and clears scrape progress", () => {
    useStore.getState().setScrapeProgress({
      ingredient: "rice noodles",
      current: 1,
      total: 5,
    });
    expect(useStore.getState().scrapeProgress?.ingredient).toBe("rice noodles");

    useStore.getState().setScrapeProgress(null);
    expect(useStore.getState().scrapeProgress).toBeNull();
  });

  it("sets and clears error", () => {
    useStore.getState().setError("Something went wrong");
    expect(useStore.getState().error).toBe("Something went wrong");

    useStore.getState().setError(null);
    expect(useStore.getState().error).toBeNull();
  });

  it("toggles loading", () => {
    useStore.getState().setLoading(true);
    expect(useStore.getState().loading).toBe(true);

    useStore.getState().setLoading(false);
    expect(useStore.getState().loading).toBe(false);
  });

  it("resets all state", () => {
    useStore.getState().setRecipe(mockRecipe);
    useStore.getState().setStep("plan");
    useStore.getState().setMatches([mockMatch]);
    useStore.getState().setError("err");
    useStore.getState().setLoading(true);

    useStore.getState().reset();

    const state = useStore.getState();
    expect(state.step).toBe("input");
    expect(state.recipe).toBeNull();
    expect(state.matches).toBeNull();
    expect(state.plan).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });
});
