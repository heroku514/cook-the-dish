import { describe, it, expect } from "vitest";
import { recipeKey, regionCode, productMatchKey } from "../cache-keys";
import type { RecipeIngredient, Store } from "@/types";

describe("recipeKey", () => {
  it("normalizes dish name to lowercase and trims whitespace", () => {
    expect(recipeKey("  Mapo Tofu  ", 2)).toBe("mapo tofu::2");
  });

  it("includes servings in the key", () => {
    expect(recipeKey("pad thai", 4)).toBe("pad thai::4");
    expect(recipeKey("pad thai", 2)).toBe("pad thai::2");
  });

  it("produces same key for different casing", () => {
    expect(recipeKey("MAPO TOFU", 2)).toBe(recipeKey("mapo tofu", 2));
  });

  it("handles non-ASCII characters", () => {
    expect(recipeKey("麻婆豆腐", 2)).toBe("麻婆豆腐::2");
  });
});

describe("regionCode", () => {
  it("rounds coordinates to a grid", () => {
    const code = regionCode(37.7749, -122.4194);
    expect(code).toMatch(/^-?\d+\.\d+,-?\d+\.\d+$/);
  });

  it("produces same code for nearby locations (~within 5 miles)", () => {
    const a = regionCode(37.7749, -122.4194);
    const b = regionCode(37.7780, -122.4150);
    expect(a).toBe(b);
  });

  it("produces different codes for distant locations", () => {
    const sf = regionCode(37.7749, -122.4194);
    const la = regionCode(34.0522, -118.2437);
    expect(sf).not.toBe(la);
  });
});

describe("productMatchKey", () => {
  const makeIngredient = (name: string): RecipeIngredient => ({
    id: `ing-${name}`,
    name,
    quantity: 1,
    unit: "piece",
    category: "produce",
    is_specialty: false,
    substitutes: [],
    in_pantry: false,
  });

  const makeStore = (chain: string): Store => ({
    id: `store-${chain}`,
    name: chain,
    chain,
    address: "123 Main St",
    distance_miles: 1,
    lat: 37.77,
    lng: -122.42,
    type: "mainstream",
  });

  it("returns a 32-char hex string", () => {
    const key = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    expect(key).toMatch(/^[a-f0-9]{32}$/);
  });

  it("produces same key for same inputs", () => {
    const args = [
      [makeIngredient("tofu"), makeIngredient("garlic")],
      [makeStore("Kroger")],
      37.77,
      -122.42,
    ] as const;
    expect(productMatchKey(...args)).toBe(productMatchKey(...args));
  });

  it("produces same key regardless of ingredient order", () => {
    const a = productMatchKey(
      [makeIngredient("garlic"), makeIngredient("tofu")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    const b = productMatchKey(
      [makeIngredient("tofu"), makeIngredient("garlic")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    expect(a).toBe(b);
  });

  it("excludes in_pantry ingredients", () => {
    const pantryItem = { ...makeIngredient("salt"), in_pantry: true };
    const withPantry = productMatchKey(
      [makeIngredient("tofu"), pantryItem],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    const withoutPantry = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    expect(withPantry).toBe(withoutPantry);
  });

  it("produces different key for different locations", () => {
    const sf = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    const la = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Kroger")],
      34.05,
      -118.24
    );
    expect(sf).not.toBe(la);
  });

  it("produces different key for different store chains", () => {
    const kroger = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Kroger")],
      37.77,
      -122.42
    );
    const walmart = productMatchKey(
      [makeIngredient("tofu")],
      [makeStore("Walmart")],
      37.77,
      -122.42
    );
    expect(kroger).not.toBe(walmart);
  });
});
