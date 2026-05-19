import { describe, it, expect } from "vitest";
import { regionCode, buildSearchQuery } from "@/shared/cache-keys";

describe("regionCode", () => {
  it("snaps nearby coordinates to the same grid cell", () => {
    const a = regionCode(37.77, -122.42);
    const b = regionCode(37.773, -122.418);
    expect(a).toBe(b);
  });

  it("assigns different grid cells to distant points", () => {
    const sf = regionCode(37.77, -122.42);
    const la = regionCode(34.05, -118.24);
    expect(sf).not.toBe(la);
  });

  it("returns formatted string with two decimal places", () => {
    const code = regionCode(37.77, -122.42);
    expect(code).toMatch(/^-?\d+\.\d{2},-?\d+\.\d{2}$/);
  });

  it("handles negative coordinates", () => {
    const code = regionCode(-33.87, 151.21);
    expect(code).toMatch(/^-?\d+\.\d{2},-?\d+\.\d{2}$/);
  });

  it("handles zero coordinates", () => {
    const code = regionCode(0, 0);
    expect(code).toBe("0.00,0.00");
  });
});

describe("buildSearchQuery", () => {
  it("strips parenthetical text", () => {
    expect(buildSearchQuery("tofu (firm)")).toBe("tofu");
  });

  it("lowercases the query", () => {
    expect(buildSearchQuery("Fresh Basil")).toBe("fresh basil");
  });

  it("collapses whitespace", () => {
    expect(buildSearchQuery("  rice   noodles  ")).toBe("rice noodles");
  });

  it("handles multiple parentheticals", () => {
    expect(buildSearchQuery("chicken (boneless) (skinless)")).toBe("chicken");
  });

  it("passes through simple names unchanged", () => {
    expect(buildSearchQuery("garlic")).toBe("garlic");
  });
});
