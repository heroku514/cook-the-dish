import { useStore } from "../store";

export function ScrapeProgress() {
  const { scrapeProgress } = useStore();

  const current = scrapeProgress?.current ?? 0;
  const total = scrapeProgress?.total ?? 1;
  const pct = Math.round((current / total) * 100);

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />

      <p className="font-medium text-sm">Searching Instacart...</p>

      {scrapeProgress && (
        <>
          <p className="text-xs text-gray-500 mt-2">
            {scrapeProgress.current} / {scrapeProgress.total}: {scrapeProgress.ingredient}
          </p>

          <div className="w-full mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        The extension is searching Instacart for each ingredient.
        <br />
        This may take a minute.
      </p>
    </div>
  );
}
