import { useState } from "react";
import { useStore } from "../store";
import type { WorkerToPopupMessage } from "@/types/messages";

const QUICK_PICKS = ["Mapo Tofu", "Pad Thai", "Carbonara", "Tikka Masala", "Beef Pho"];

export function RecipeInput() {
  const [dish, setDish] = useState("");
  const [servings, setServings] = useState(2);
  const { setRecipe, setStep, setLoading, setError, loading } = useStore();

  async function handleSubmit(dishName: string) {
    if (!dishName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          chrome.runtime.sendMessage({
            type: "SET_LOCATION",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          chrome.runtime.sendMessage({
            type: "SET_LOCATION",
            lat: 37.7749,
            lng: -122.4194,
          });
        }
      );

      const response: WorkerToPopupMessage = await chrome.runtime.sendMessage({
        type: "PARSE_RECIPE",
        dishName,
        servings,
      });

      if (response.type === "RECIPE_PARSED") {
        setRecipe(response.recipe);
        setStep("recipe");
      } else if (response.type === "ERROR") {
        setError(response.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse recipe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">
          Cook<span className="text-orange-500">The</span>Dish
        </h1>
        <p className="text-sm text-gray-500 mt-1">Real Instacart prices for any recipe</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(dish)}
          placeholder="Enter a dish name..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          disabled={loading}
        />

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Serves</label>
          <select
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
            disabled={loading}
          >
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={() => handleSubmit(dish)}
            disabled={loading || !dish.trim()}
            className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-orange-600"
          >
            {loading ? "Loading..." : "Cook This!"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400 text-center mb-2">Or try a popular dish:</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {QUICK_PICKS.map((name) => (
            <button
              key={name}
              onClick={() => handleSubmit(name)}
              disabled={loading}
              className="px-2.5 py-1 text-xs border rounded-full hover:bg-gray-50 disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
