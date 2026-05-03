import { create } from "zustand";
import type {
  Recipe,
  Store,
  ProductMatch,
  ShoppingPlan,
  OptimizationStrategy,
} from "@/types";

type Step = "search" | "recipe" | "matching" | "plan";

interface AppState {
  step: Step;
  loading: boolean;
  error: string | null;
  dishName: string;
  recipe: Recipe | null;
  stores: Store[];
  productMatches: ProductMatch[];
  shoppingPlan: ShoppingPlan | null;
  strategy: OptimizationStrategy;

  setStep: (step: Step) => void;
  setDishName: (name: string) => void;
  setStrategy: (strategy: OptimizationStrategy) => void;
  togglePantryItem: (ingredientId: string) => void;

  searchRecipe: (dishName: string, servings?: number) => Promise<void>;
  findStoresAndMatch: () => Promise<void>;
  generatePlan: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  step: "search",
  loading: false,
  error: null,
  dishName: "",
  recipe: null,
  stores: [],
  productMatches: [],
  shoppingPlan: null,
  strategy: "balanced",

  setStep: (step) => set({ step }),
  setDishName: (name) => set({ dishName: name }),
  setStrategy: (strategy) => set({ strategy }),

  togglePantryItem: (ingredientId) => {
    const recipe = get().recipe;
    if (!recipe) return;
    set({
      recipe: {
        ...recipe,
        ingredients: recipe.ingredients.map((ing) =>
          ing.id === ingredientId
            ? { ...ing, in_pantry: !ing.in_pantry }
            : ing
        ),
      },
    });
  },

  searchRecipe: async (dishName, servings = 2) => {
    set({ loading: true, error: null, dishName });
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish_name: dishName, servings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse recipe");
      set({ recipe: data, step: "recipe", loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze recipe. Please try again.";
      set({ error: message, loading: false });
    }
  },

  findStoresAndMatch: async () => {
    const { recipe } = get();
    if (!recipe) return;

    set({ loading: true, error: null });
    try {
      const storeRes = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 37.7749, lng: -122.4194 }),
      });
      if (!storeRes.ok) throw new Error("Failed to find stores");
      const { stores } = await storeRes.json();

      set({ stores, step: "matching" });

      const ingredientsToBuy = recipe.ingredients.filter(
        (ing) => !ing.in_pantry
      );

      const matchRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsToBuy, stores, lat: 37.7749, lng: -122.4194 }),
      });
      if (!matchRes.ok) throw new Error("Failed to match products");
      const { matches } = await matchRes.json();

      set({ productMatches: matches, loading: false });
    } catch {
      set({ error: "Failed to find products. Please try again.", loading: false });
    }
  },

  generatePlan: async () => {
    const { productMatches, strategy, recipe } = get();
    if (!productMatches.length || !recipe) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/shopping-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matches: productMatches,
          strategy,
          max_stores: 3,
          dish_name: recipe.dish.name_en,
          recipe_id: recipe.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const plan = await res.json();
      set({ shoppingPlan: plan, step: "plan", loading: false });
    } catch {
      set({
        error: "Failed to generate shopping plan. Please try again.",
        loading: false,
      });
    }
  },

  reset: () =>
    set({
      step: "search",
      loading: false,
      error: null,
      dishName: "",
      recipe: null,
      stores: [],
      productMatches: [],
      shoppingPlan: null,
    }),
}));
