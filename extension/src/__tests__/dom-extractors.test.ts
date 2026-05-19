import { describe, it, expect, beforeEach } from "vitest";
import { extractProductCards } from "@/content/dom-extractors";

function createProductCard(opts: {
  name: string;
  price?: string;
  brand?: string;
  href?: string;
  outOfStock?: boolean;
  imageUrl?: string;
  size?: string;
}): HTMLElement {
  const card = document.createElement("div");
  card.setAttribute("data-testid", "item-card");

  const link = document.createElement("a");
  link.href = opts.href || `/product/test-${opts.name.toLowerCase().replace(/\s/g, "-")}`;

  const heading = document.createElement("h3");
  heading.textContent = opts.name;
  link.appendChild(heading);

  if (opts.price) {
    const priceSpan = document.createElement("span");
    priceSpan.textContent = opts.price;
    link.appendChild(priceSpan);
  }

  if (opts.brand) {
    const brandSpan = document.createElement("span");
    brandSpan.className = "Brand";
    brandSpan.textContent = opts.brand;
    link.appendChild(brandSpan);
  }

  if (opts.imageUrl) {
    const img = document.createElement("img");
    img.src = opts.imageUrl;
    link.appendChild(img);
  }

  if (opts.outOfStock) {
    const oos = document.createElement("div");
    oos.className = "OutOfStock";
    link.appendChild(oos);
  }

  if (opts.size) {
    const sizeSpan = document.createElement("span");
    sizeSpan.textContent = opts.size;
    link.appendChild(sizeSpan);
  }

  card.appendChild(link);
  return card;
}

describe("extractProductCards", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("extracts products from product card links", () => {
    const card = createProductCard({
      name: "Firm Tofu",
      price: "$3.49",
      brand: "Nasoya",
      href: "/product/firm-tofu-123",
    });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Firm Tofu");
    expect(products[0].price).toBe(3.49);
    expect(products[0].price_text).toBe("$3.49");
    expect(products[0].brand).toBe("Nasoya");
    expect(products[0].in_stock).toBe(true);
    expect(products[0].source).toBe("instacart");
  });

  it("handles out-of-stock products", () => {
    const card = createProductCard({
      name: "Organic Tofu",
      price: "$4.99",
      href: "/product/organic-tofu-456",
      outOfStock: true,
    });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products[0].in_stock).toBe(false);
  });

  it("handles missing price", () => {
    const card = createProductCard({
      name: "Mystery Item",
      href: "/product/mystery-item",
    });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products[0].price).toBeNull();
    expect(products[0].price_text).toBe("");
  });

  it("deduplicates products by href", () => {
    const card1 = createProductCard({ name: "Tofu", href: "/product/tofu-1" });
    const card2 = createProductCard({ name: "Tofu", href: "/product/tofu-1" });
    document.body.appendChild(card1);
    document.body.appendChild(card2);

    const products = extractProductCards();
    expect(products).toHaveLength(1);
  });

  it("extracts multiple distinct products", () => {
    const cards = [
      createProductCard({ name: "Tofu", price: "$2.99", href: "/product/tofu" }),
      createProductCard({ name: "Garlic", price: "$0.99", href: "/product/garlic" }),
      createProductCard({ name: "Noodles", price: "$3.49", href: "/product/noodles" }),
    ];
    cards.forEach((c) => document.body.appendChild(c));

    const products = extractProductCards();
    expect(products).toHaveLength(3);
    expect(products.map((p) => p.name)).toEqual(["Tofu", "Garlic", "Noodles"]);
  });

  it("skips cards with empty names", () => {
    const card = createProductCard({ name: "", href: "/product/empty" });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products).toHaveLength(0);
  });

  it("extracts image URL", () => {
    const card = createProductCard({
      name: "Tofu",
      href: "/product/tofu",
      imageUrl: "https://cdn.instacart.com/tofu.jpg",
    });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products[0].image_url).toBe("https://cdn.instacart.com/tofu.jpg");
  });

  it("extracts size from text", () => {
    const card = createProductCard({
      name: "Rice Noodles",
      price: "$3.49",
      href: "/product/noodles",
      size: "14 oz",
    });
    document.body.appendChild(card);

    const products = extractProductCards();
    expect(products[0].size).toBe("14 oz");
  });

  it("returns empty array when no product links exist", () => {
    document.body.innerHTML = "<div>No products here</div>";
    const products = extractProductCards();
    expect(products).toHaveLength(0);
  });

  it("sets scraped_at timestamp", () => {
    const card = createProductCard({ name: "Tofu", href: "/product/tofu" });
    document.body.appendChild(card);

    const before = new Date().toISOString();
    const products = extractProductCards();
    const after = new Date().toISOString();

    expect(products[0].scraped_at >= before).toBe(true);
    expect(products[0].scraped_at <= after).toBe(true);
  });
});
