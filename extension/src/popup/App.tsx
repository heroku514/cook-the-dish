import { useStore } from "./store";
import { RecipeInput } from "./components/RecipeInput";
import { IngredientList } from "./components/IngredientList";
import { ScrapeProgress } from "./components/ScrapeProgress";
import { ShoppingPlan } from "./components/ShoppingPlan";

export function App() {
  const { step, error } = useStore();

  return (
    <div className="bg-gray-50 min-h-[500px]">
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {step === "input" && <RecipeInput />}
      {step === "recipe" && <IngredientList />}
      {step === "scraping" && <ScrapeProgress />}
      {step === "plan" && <ShoppingPlan />}
    </div>
  );
}
