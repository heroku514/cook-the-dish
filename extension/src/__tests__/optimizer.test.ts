import { describe, it, expect, vi } from "vitest";
import { optimizeShoppingPlan } from "@/shared/optimizer";
import type { ProductMatch, Store } from "@/types";

vi.mock("uuid", () => ({
  v4: () => "test-uuid",
}));

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: "s1",
    name: "Store A",
    chain: "ChainA",
    address: "100 Main St",
    distance_miles: 1.0,
    lat: 37.77,
    lng: -122.42,
    type: "mainstream",
    ...overrides,
  };
}

function makeMatch(overrides: Partial<ProductMatch> = {}): ProductMatch {
  return {
    ingredient_id: "i1",
    ingredient_name: "tofu",
    store: makeStore(),
    product_name: "Firm Tofu",
    brand: "Brand X",
    size: "14 oz",
    price: 2.99,
    in_stock: true,
    match_score: 0.9,
    ...overrides,
  };
}

const storeA = makeStore({ id: "sA", name: "Store A", distance_miles: 1.0 });
const storeB = makeStore({ id: "sB", name: "Store B", distance_miles: 2.0 });

describe("optimizeShoppingPlan", () => {
  it("returns a plan with correct metadata", () => {
    const matches = [
      makeMatch({ ingredient_id: "i1", store: storeA, price: 2.99 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeA, price: 0.99, product_name: "Garlic" }),
    ];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "single_store",
      maxStores: 3,
      dishName: "Pad Thai",
      recipeId: "r1",
    });

    expect(plan.id).toBe("test-uuid");
    expect(plan.dish_name).toBe("Pad Thai");
    expect(plan.recipe_id).toBe("r1");
    expect(plan.strategy).toBe("single_store");
    expect(plan.total_items).toBe(2);
    expect(plan.total_stores).toBe(1);
    expect(plan.total_cost).toBe(3.98);
    expect(plan.created_at).toBeTruthy();
  });

  it("filters out out-of-stock matches", () => {
    const matches = [
      makeMatch({ ingredient_id: "i1", store: storeA, in_stock: true }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeA, in_stock: false }),
    ];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "balanced",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    expect(plan.total_items).toBe(1);
  });

  it("single_store picks the store covering the most ingredients", () => {
    const matches = [
      makeMatch({ ingredient_id: "i1", store: storeA, price: 5 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeA, price: 1 }),
      makeMatch({ ingredient_id: "i1", store: storeB, price: 4 }),
    ];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "single_store",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    expect(plan.total_stores).toBe(1);
    expect(plan.stops[0].store.id).toBe("sA");
    expect(plan.total_items).toBe(2);
  });

  it("cheapest picks the lowest price per ingredient", () => {
    const matches = [
      makeMatch({ ingredient_id: "i1", store: storeA, price: 5.00 }),
      makeMatch({ ingredient_id: "i1", store: storeB, price: 3.00 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeA, price: 1.00 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeB, price: 2.00 }),
    ];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "cheapest",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    expect(plan.total_cost).toBe(4.00);
  });

  it("fewest_stops minimizes number of stores visited", () => {
    const storeC = makeStore({ id: "sC", name: "Store C", distance_miles: 0.5 });

    const matches = [
      makeMatch({ ingredient_id: "i1", store: storeA, price: 2 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeA, price: 1 }),
      makeMatch({ ingredient_id: "i3", ingredient_name: "noodles", store: storeA, price: 3 }),
      makeMatch({ ingredient_id: "i1", store: storeB, price: 1 }),
      makeMatch({ ingredient_id: "i2", ingredient_name: "garlic", store: storeC, price: 0.5 }),
    ];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "fewest_stops",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    expect(plan.total_stores).toBe(1);
    expect(plan.stops[0].store.id).toBe("sA");
  });

  it("returns empty stops when no matches provided", () => {
    const plan = optimizeShoppingPlan([], {
      strategy: "balanced",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    expect(plan.stops).toHaveLength(0);
    expect(plan.total_cost).toBe(0);
    expect(plan.total_items).toBe(0);
  });

  it("shopping items have correct structure", () => {
    const matches = [makeMatch({ store: storeA, aisle: "Produce" })];

    const plan = optimizeShoppingPlan(matches, {
      strategy: "balanced",
      maxStores: 3,
      dishName: "Test",
      recipeId: "r1",
    });

    const item = plan.stops[0].items[0];
    expect(item.ingredient_name).toBe("tofu");
    expect(item.product_name).toBe("Firm Tofu");
    expect(item.brand).toBe("Brand X");
    expect(item.price).toBe(2.99);
    expect(item.checked).toBe(false);
  });
});
