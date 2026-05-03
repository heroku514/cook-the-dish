"use client";

import { useAppStore } from "@/lib/store";

const CATEGORY_COLORS: Record<string, string> = {
  produce: "bg-green-100 text-green-700",
  protein: "bg-red-100 text-red-700",
  dairy: "bg-blue-100 text-blue-700",
  spice: "bg-yellow-100 text-yellow-700",
  sauce: "bg-purple-100 text-purple-700",
  grain: "bg-amber-100 text-amber-700",
  staple: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-600",
};

export default function RecipeView() {
  const { recipe, togglePantryItem, findStoresAndMatch, loading, reset } =
    useAppStore();

  if (!recipe) return null;

  const { dish, ingredients, steps } = recipe;
  const toBuy = ingredients.filter((ing) => !ing.in_pantry);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={reset}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Search another dish
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {dish.name_en}
            </h2>
            {dish.name_original && dish.name_original !== dish.name_en && (
              <p className="text-xl text-gray-500 mt-1">{dish.name_original}</p>
            )}
          </div>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
            {dish.cuisine}
          </span>
        </div>
        <p className="text-gray-600 mb-4">{dish.description}</p>
        <div className="flex gap-6 text-sm text-gray-500">
          <span>Serves {dish.servings}</span>
          <span>Prep: {dish.prep_time_min} min</span>
          <span>Cook: {dish.cook_time_min} min</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Ingredients
          </h3>
          <p className="text-sm text-gray-500">
            Check items you already have
          </p>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                ing.in_pantry ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
              }`}
            >
              <button
                onClick={() => togglePantryItem(ing.id)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  ing.in_pantry
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-orange-400"
                }`}
              >
                {ing.in_pantry && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${ing.in_pantry ? "line-through text-gray-400" : "text-gray-900"}`}
                  >
                    {ing.quantity} {ing.unit} {ing.name}
                  </span>
                  {ing.name_original && (
                    <span className="text-sm text-gray-400">
                      ({ing.name_original})
                    </span>
                  )}
                  {ing.is_specialty && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      Specialty
                    </span>
                  )}
                </div>
                {ing.notes && (
                  <p className="text-sm text-gray-500 mt-0.5">{ing.notes}</p>
                )}
              </div>

              <span
                className={`px-2 py-1 text-xs rounded-full ${CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.other}`}
              >
                {ing.category}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-orange-600">{toBuy.length}</span>{" "}
            items to buy
            {ingredients.length - toBuy.length > 0 && (
              <span className="text-gray-400">
                {" "}({ingredients.length - toBuy.length} already in pantry)
              </span>
            )}
          </p>
          <button
            onClick={findStoresAndMatch}
            disabled={loading || toBuy.length === 0}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Finding stores...
              </>
            ) : (
              <>
                Find Where to Buy
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          How to Cook
        </h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {i + 1}
              </span>
              <p className="text-gray-700 pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
