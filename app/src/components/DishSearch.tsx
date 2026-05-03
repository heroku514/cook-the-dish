"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

const POPULAR_DISHES = [
  { name: "麻婆豆腐", label: "Mapo Tofu" },
  { name: "Pad Thai", label: "Pad Thai" },
  { name: "Chicken Tikka Masala", label: "Tikka Masala" },
  { name: "Carbonara", label: "Carbonara" },
  { name: "Beef Pho", label: "Beef Pho" },
  { name: "Tacos al Pastor", label: "Tacos al Pastor" },
  { name: "日式咖喱", label: "Japanese Curry" },
  { name: "Bibimbap", label: "Bibimbap" },
];

export default function DishSearch() {
  const [input, setInput] = useState("");
  const [servings, setServings] = useState(2);
  const { searchRecipe, loading } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      searchRecipe(input.trim(), servings);
    }
  };

  const handleQuickPick = (dish: string) => {
    setInput(dish);
    searchRecipe(dish, servings);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          Cook<span className="text-orange-500">The</span>Dish
        </h1>
        <p className="text-lg text-gray-600">
          Tell us what you want to cook. We&apos;ll tell you what to buy and
          where.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a dish name (e.g., 麻婆豆腐, Pad Thai, Carbonara...)"
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors bg-white"
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-4">
            <label className="text-sm text-gray-500 whitespace-nowrap">
              Serves
            </label>
            <select
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="text-lg font-semibold bg-transparent focus:outline-none"
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Cook This!"
            )}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm text-gray-500 mb-3 text-center">
          Or try a popular dish:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR_DISHES.map((dish) => (
            <button
              key={dish.name}
              onClick={() => handleQuickPick(dish.name)}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-50"
            >
              {dish.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
