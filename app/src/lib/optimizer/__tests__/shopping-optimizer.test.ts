import { describe, it, expect } from "vitest";
import { optimizeShoppingPlan } from "../shopping-optimizer";
import type { ProductMatch, Store } from "@/types";

const kroger: Store = {
  id: "store-1",
  name: "Kroger",
  chain: "Kroger",
  address: "123 Main St",
  distance_miles: 0.8,
  lat: 37.77,
  lng: -122.42,
  type: "mainstream",
};

const hmart: Store = {
  id: "store-2",
  name: "H Mart",
  chain: "H Mart",
  address: "456 Oak Ave",
  distance_miles: 2.3,
  lat: 37.78,
  lng: -122.41,
  type: "ethnic",
};

function match(
  ingredientId: string,
  ingredientName: string,
  store: Store,
  price: number,
  inStock: boolean = true,
  score: number = 0.9
): ProductMatch {
  return {
    ingredient_id: ingredientId,
    ingredient_name: ingredientName,
    store,
    product_name: `${ingredientName} product`,
    brand: "Brand",
    size: "1 unit",
    price,
    in_stock: inStock,
    match_score: score,
  };
}

const baseOpts = {
  maxStores: 3,
  dishName: "Test Dish",
  recipeId: "recipe-1",
};

describe("optimizeShoppingPlan", () => {
  const matches: ProductMatch[] = [
    match("ing-0", "tofu", kroger, 2.29),
    match("ing-0", "tofu", hmart, 2.49),
    match("ing-1", "garlic", kroger, 0.69),
    match("ing-1", "garlic", hmart, 0.49),
    match("ing-2", "doubanjiang", kroger, 0, false, 0),
    match("ing-2", "doubanjiang", hmart, 4.99),
  ];

  it("returns a plan with correct metadata", () => {
    const plan = optimizeShoppingPlan(matches, {
      ...baseOpts,
      strategy: "balanced",
    });
    expect(plan.dish_name).toBe("Test Dish");
    expect(plan.recipe_id).toBe("recipe-1");
    expect(plan.strategy).toBe("balanced");
    expect(plan.total_items).toBeGreaterThan(0);
    expect(plan.total_cost).toBeGreaterThan(0);
    expect(plan.stops.length).toBeGreaterThanOrEqual(1);
  });

  it("excludes out-of-stock items", () => {
    const plan = optimizeShoppingPlan(matches, {
      ...baseOpts,
      strategy: "single_store",
    });
    const allItems = plan.stops.flatMap((s) => s.items);
    const outOfStock = allItems.filter(
      (item) => item.product_name.includes("not available")
    );
    expect(outOfStock).toHaveLength(0);
  });

  describe("single_store strategy", () => {
    it("uses exactly one store", () => {
      const plan = optimizeShoppingPlan(matches, {
        ...baseOpts,
        strategy: "single_store",
      });
      expect(plan.stops).toHaveLength(1);
      expect(plan.total_stores).toBe(1);
    });
  });

  describe("cheapest strategy", () => {
    it("picks the cheapest option for each ingredient", () => {
      const plan = optimizeShoppingPlan(matches, {
        ...baseOpts,
        strategy: "cheapest",
      });
      const allItems = plan.stops.flatMap((s) => s.items);
      const tofuItem = allItems.find((i) => i.ingredient_name === "tofu");
      const garlicItem = allItems.find((i) => i.ingredient_name === "garlic");
      expect(tofuItem?.price).toBe(2.29);
      expect(garlicItem?.price).toBe(0.49);
    });
  });

  describe("fewest_stops strategy", () => {
    it("respects maxStores limit", () => {
      const plan = optimizeShoppingPlan(matches, {
        ...baseOpts,
        strategy: "fewest_stops",
        maxStores: 1,
      });
      expect(plan.stops.length).toBeLessThanOrEqual(1);
    });
  });

  describe("balanced strategy", () => {
    it("covers all available ingredients", () => {
      const plan = optimizeShoppingPlan(matches, {
        ...baseOpts,
        strategy: "balanced",
      });
      const coveredIngredients = new Set(
        plan.stops.flatMap((s) => s.items.map((i) => i.ingredient_name))
      );
      expect(coveredIngredients.has("tofu")).toBe(true);
      expect(coveredIngredients.has("garlic")).toBe(true);
      expect(coveredIngredients.has("doubanjiang")).toBe(true);
    });
  });

  it("computes correct subtotals", () => {
    const plan = optimizeShoppingPlan(matches, {
      ...baseOpts,
      strategy: "balanced",
    });
    for (const stop of plan.stops) {
      const expectedSubtotal =
        Math.round(stop.items.reduce((s, i) => s + i.price, 0) * 100) / 100;
      expect(stop.subtotal).toBe(expectedSubtotal);
    }
  });

  it("computes correct total cost from stop subtotals", () => {
    const plan = optimizeShoppingPlan(matches, {
      ...baseOpts,
      strategy: "cheapest",
    });
    const sumOfSubtotals =
      Math.round(plan.stops.reduce((s, stop) => s + stop.subtotal, 0) * 100) /
      100;
    expect(plan.total_cost).toBe(sumOfSubtotals);
  });

  it("orders stops by distance (nearest first)", () => {
    const plan = optimizeShoppingPlan(matches, {
      ...baseOpts,
      strategy: "cheapest",
    });
    if (plan.stops.length > 1) {
      for (let i = 1; i < plan.stops.length; i++) {
        expect(plan.stops[i].store.distance_miles).toBeGreaterThanOrEqual(
          plan.stops[i - 1].store.distance_miles
        );
      }
    }
  });

  it("handles empty matches gracefully", () => {
    const plan = optimizeShoppingPlan([], {
      ...baseOpts,
      strategy: "balanced",
    });
    expect(plan.stops).toHaveLength(0);
    expect(plan.total_cost).toBe(0);
    expect(plan.total_items).toBe(0);
  });
});
