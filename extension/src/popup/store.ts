import { create } from "zustand";
import type { Recipe, ProductMatch, ShoppingPlan } from "@/types";

type Step = "input" | "recipe" | "scraping" | "plan";

interface AppState {
  step: Step;
  recipe: Recipe | null;
  matches: ProductMatch[] | null;
  plan: ShoppingPlan | null;
  scrapeProgress: { ingredient: string; current: number; total: number } | null;
  error: string | null;
  loading: boolean;

  setStep: (step: Step) => void;
  setRecipe: (recipe: Recipe) => void;
  setMatches: (matches: ProductMatch[]) => void;
  setPlan: (plan: ShoppingPlan) => void;
  setScrapeProgress: (progress: { ingredient: string; current: number; total: number } | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  step: "input",
  recipe: null,
  matches: null,
  plan: null,
  scrapeProgress: null,
  error: null,
  loading: false,

  setStep: (step) => set({ step }),
  setRecipe: (recipe) => set({ recipe }),
  setMatches: (matches) => set({ matches }),
  setPlan: (plan) => set({ plan }),
  setScrapeProgress: (scrapeProgress) => set({ scrapeProgress }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({
      step: "input",
      recipe: null,
      matches: null,
      plan: null,
      scrapeProgress: null,
      error: null,
      loading: false,
    }),
}));
