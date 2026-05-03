import { describe, it, expect } from "vitest";
import { discoverStores } from "../store-discovery";

describe("discoverStores", () => {
  it("returns demo stores sorted by distance", async () => {
    const stores = await discoverStores(37.7749, -122.4194);
    expect(stores.length).toBeGreaterThan(0);
    for (let i = 1; i < stores.length; i++) {
      expect(stores[i].distance_miles).toBeGreaterThanOrEqual(
        stores[i - 1].distance_miles
      );
    }
  });

  it("includes expected store types", async () => {
    const stores = await discoverStores(37.7749, -122.4194);
    const types = new Set(stores.map((s) => s.type));
    expect(types.has("mainstream")).toBe(true);
    expect(types.has("ethnic")).toBe(true);
    expect(types.has("organic")).toBe(true);
  });

  it("filters by radius", async () => {
    const stores = await discoverStores(37.7749, -122.4194, 1);
    for (const store of stores) {
      expect(store.distance_miles).toBeLessThanOrEqual(1);
    }
  });

  it("returns all stores within default 5-mile radius", async () => {
    const stores = await discoverStores(37.7749, -122.4194);
    expect(stores.length).toBe(7);
  });

  it("each store has required fields", async () => {
    const stores = await discoverStores(37.7749, -122.4194);
    for (const store of stores) {
      expect(store.id).toBeTruthy();
      expect(store.name).toBeTruthy();
      expect(store.chain).toBeTruthy();
      expect(store.address).toBeTruthy();
      expect(typeof store.lat).toBe("number");
      expect(typeof store.lng).toBe("number");
      expect(typeof store.distance_miles).toBe("number");
    }
  });
});
