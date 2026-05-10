import type { ScrapedProduct } from "@/types/instacart";

function extractPrice(container: Element): string | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim() || "";
    const match = text.match(/^\$\d+\.\d{2}$/);
    if (match) return match[0];
  }
  return null;
}

function extractUnitPrice(container: Element): string | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim() || "";
    const match = text.match(/\$[\d.]+\s*\/\s*\w+/);
    if (match) return match[0];
  }
  return null;
}

function inferSizeFromText(container: Element): string | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim() || "";
    const match = text.match(/\d+\.?\d*\s*(oz|lb|lbs|g|kg|ml|fl\s*oz|ct|count|pack|each)/i);
    if (match) return match[0];
  }
  return null;
}

export function extractProductCards(): ScrapedProduct[] {
  const productLinks = document.querySelectorAll('a[href*="/product/"]');
  const seen = new Set<string>();
  const products: ScrapedProduct[] = [];

  for (const link of productLinks) {
    const href = (link as HTMLAnchorElement).getAttribute("href") || "";
    if (seen.has(href)) continue;
    seen.add(href);

    const card = link.closest('[data-testid="item-card"]') || link;

    const nameEl = card.querySelector(
      'h2, h3, [data-testid="item-title"], span[class*="ItemName"], span[class*="item-name"]'
    );
    const name = nameEl?.textContent?.trim() || "";
    if (!name) continue;

    const priceText = extractPrice(card);
    const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, "")) : null;

    const brandEl = card.querySelector(
      '[class*="Brand"], [data-testid="item-brand"], span[class*="brand"]'
    );
    const brand = brandEl?.textContent?.trim() || null;

    const img = card.querySelector("img");
    const image_url = img?.src || null;

    const outOfStock = card.querySelector(
      '[class*="OutOfStock"], [class*="out-of-stock"], [class*="unavailable"]'
    );

    products.push({
      name,
      brand,
      price,
      price_text: priceText || "",
      unit_price: extractUnitPrice(card),
      size: inferSizeFromText(card),
      image_url,
      product_url: href,
      in_stock: !outOfStock,
      source: "instacart",
      scraped_at: new Date().toISOString(),
    });
  }

  return products;
}
