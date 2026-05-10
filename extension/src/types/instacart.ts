export interface ScrapedProduct {
  name: string;
  brand: string | null;
  price: number | null;
  price_text: string;
  unit_price: string | null;
  size: string | null;
  image_url: string | null;
  product_url: string;
  in_stock: boolean;
  source: "instacart";
  scraped_at: string;
}

export interface IngredientScrapeResult {
  ingredient_id: string;
  ingredient_name: string;
  search_query: string;
  products: ScrapedProduct[];
  scraped_at: string;
}

export interface ScrapeJob {
  id: string;
  recipe_id: string;
  ingredients: { id: string; name: string; search_query: string }[];
  status: "pending" | "in_progress" | "complete" | "error";
  current_index: number;
  results: IngredientScrapeResult[];
  started_at: string;
  instacart_tab_id: number | null;
}
