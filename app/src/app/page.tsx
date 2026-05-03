"use client";

import { useAppStore } from "@/lib/store";
import DishSearch from "@/components/DishSearch";
import RecipeView from "@/components/RecipeView";
import MatchingProgress from "@/components/MatchingProgress";
import ShoppingPlanView from "@/components/ShoppingPlanView";

export default function Home() {
  const { step, error } = useAppStore();

  return (
    <main className="min-h-screen py-12 px-4">
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === "search" && <DishSearch />}
      {step === "recipe" && <RecipeView />}
      {step === "matching" && <MatchingProgress />}
      {step === "plan" && <ShoppingPlanView />}

      <footer className="mt-16 text-center text-sm text-gray-400">
        <p>CookTheDish &mdash; AI-powered grocery shopping for any recipe</p>
      </footer>
    </main>
  );
}
