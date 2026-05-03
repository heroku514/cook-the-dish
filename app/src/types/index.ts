export interface Dish {
  name_en: string;
  name_original?: string;
  cuisine: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  description: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  name_original?: string;
  quantity: number;
  unit: string;
  weight_g?: number;
  category:
    | "produce"
    | "protein"
    | "dairy"
    | "spice"
    | "sauce"
    | "grain"
    | "staple"
    | "other";
  is_specialty: boolean;
  substitutes: string[];
  notes?: string;
  in_pantry?: boolean;
}

export interface Recipe {
  id: string;
  dish: Dish;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface Store {
  id: string;
  name: string;
  chain: string;
  address: string;
  distance_miles: number;
  lat: number;
  lng: number;
  type: "mainstream" | "specialty" | "ethnic" | "organic";
}

export interface ProductMatch {
  ingredient_id: string;
  ingredient_name: string;
  store: Store;
  product_name: string;
  brand: string;
  size: string;
  price: number;
  price_per_unit?: string;
  aisle?: string;
  in_stock: boolean;
  match_score: number;
  match_notes?: string;
  image_url?: string;
}

export interface ShoppingItem {
  ingredient_name: string;
  product_name: string;
  brand: string;
  quantity: number;
  price: number;
  aisle?: string;
  checked: boolean;
}

export interface ShoppingStop {
  order: number;
  store: Store;
  items: ShoppingItem[];
  subtotal: number;
}

export type OptimizationStrategy =
  | "fewest_stops"
  | "cheapest"
  | "balanced"
  | "single_store";

export interface ShoppingPlan {
  id: string;
  dish_name: string;
  recipe_id: string;
  strategy: OptimizationStrategy;
  stops: ShoppingStop[];
  total_cost: number;
  total_stores: number;
  total_items: number;
  created_at: string;
}
