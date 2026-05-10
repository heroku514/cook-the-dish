import { useStore } from "../store";
import type { WorkerToPopupMessage } from "@/types/messages";

export function IngredientList() {
  const { recipe, setMatches, setStep, setScrapeProgress, setError, setLoading, loading } = useStore();

  if (!recipe) return null;

  async function startSearch() {
    const r = useStore.getState().recipe;
    if (!r) return;

    setLoading(true);
    setError(null);

    const port = chrome.runtime.connect({ name: "scrape-progress" });
    port.onMessage.addListener((msg) => {
      if (msg.type === "SCRAPE_PROGRESS") {
        setScrapeProgress({
          ingredient: msg.ingredient,
          current: msg.current,
          total: msg.total,
        });
      }
    });

    setStep("scraping");

    try {
      const response: WorkerToPopupMessage = await chrome.runtime.sendMessage({
        type: "START_PRODUCT_SEARCH",
        recipeId: r.id,
      });

      if (response.type === "PRODUCTS_MATCHED" || response.type === "CACHE_HIT") {
        const matches = response.type === "CACHE_HIT" ? response.matches : response.matches;
        setMatches(matches);

        const planResponse: WorkerToPopupMessage = await chrome.runtime.sendMessage({
          type: "GENERATE_PLAN",
          strategy: "balanced",
        });

        if (planResponse.type === "PLAN_READY") {
          useStore.getState().setPlan(planResponse.plan);
          setStep("plan");
        } else if (planResponse.type === "ERROR") {
          setError(planResponse.message);
          setStep("recipe");
        }
      } else if (response.type === "ERROR") {
        setError(response.message);
        setStep("recipe");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setStep("recipe");
    } finally {
      setLoading(false);
      setScrapeProgress(null);
      port.disconnect();
    }
  }

  const toBuy = recipe.ingredients.filter((i) => !i.in_pantry);

  return (
    <div className="p-4">
      <h2 className="font-bold text-lg">{recipe.dish.name_en}</h2>
      {recipe.dish.name_original && (
        <p className="text-sm text-gray-500">{recipe.dish.name_original}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {recipe.dish.cuisine} · {recipe.dish.servings} servings · {recipe.dish.prep_time_min + recipe.dish.cook_time_min} min
      </p>

      <div className="mt-3">
        <p className="text-sm font-medium mb-2">{toBuy.length} ingredients to buy:</p>
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {toBuy.map((ing) => (
            <li key={ing.id} className="text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span>
                {ing.quantity} {ing.unit} {ing.name}
                {ing.is_specialty && (
                  <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-1 rounded">specialty</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={startSearch}
        disabled={loading}
        className="mt-4 w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-orange-600"
      >
        {loading ? "Searching..." : "Search Instacart"}
      </button>

      <button
        onClick={() => useStore.getState().reset()}
        className="mt-2 w-full py-2 text-gray-500 text-xs hover:text-gray-700"
      >
        ← Start over
      </button>
    </div>
  );
}
