"use client";

import { useAppStore } from "@/lib/store";
import type { OptimizationStrategy } from "@/types";

const STRATEGIES: { value: OptimizationStrategy; label: string; desc: string }[] = [
  {
    value: "balanced",
    label: "Balanced",
    desc: "Best mix of price, quality, and convenience",
  },
  {
    value: "cheapest",
    label: "Cheapest",
    desc: "Minimize total cost across all stores",
  },
  {
    value: "fewest_stops",
    label: "Fewest Stops",
    desc: "Get everything in as few stores as possible",
  },
  {
    value: "single_store",
    label: "Single Store",
    desc: "Everything from one store",
  },
];

export default function MatchingProgress() {
  const {
    loading,
    productMatches,
    stores,
    strategy,
    setStrategy,
    generatePlan,
    setStep,
  } = useAppStore();

  if (loading && productMatches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-6">
          <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Finding the best products...
        </h2>
        <p className="text-gray-500">
          Searching {stores.length} nearby stores and matching ingredients to
          real products
        </p>
      </div>
    );
  }

  if (productMatches.length === 0) return null;

  const inStockCount = productMatches.filter((m) => m.in_stock).length;
  const uniqueIngredients = new Set(productMatches.map((m) => m.ingredient_id)).size;
  const coveredIngredients = new Set(
    productMatches.filter((m) => m.in_stock).map((m) => m.ingredient_id)
  ).size;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setStep("recipe")}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to recipe
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Products Found
        </h2>
        <p className="text-gray-500 mb-6">
          Found {inStockCount} products across {stores.length} stores covering{" "}
          {coveredIngredients}/{uniqueIngredients} ingredients
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {stores.map((store) => {
            const storeMatches = productMatches.filter(
              (m) => m.store.id === store.id && m.in_stock
            );
            return (
              <div
                key={store.id}
                className="p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {store.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      store.type === "ethnic"
                        ? "bg-purple-100 text-purple-700"
                        : store.type === "organic"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {store.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {store.distance_miles} mi &middot; {storeMatches.length}{" "}
                  items available
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Choose Shopping Strategy
        </h3>
        <div className="space-y-3 mb-6">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStrategy(s.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                strategy === s.value
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="font-semibold text-gray-900">{s.label}</span>
              <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="w-full px-6 py-4 bg-orange-500 text-white text-lg font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Optimizing...
            </>
          ) : (
            "Generate Shopping Plan"
          )}
        </button>
      </div>
    </div>
  );
}
