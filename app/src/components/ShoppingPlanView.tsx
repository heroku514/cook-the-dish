"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function ShoppingPlanView() {
  const { shoppingPlan, reset, setStep } = useAppStore();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  if (!shoppingPlan) return null;

  const toggleItem = (stopOrder: number, itemIndex: number) => {
    const key = `${stopOrder}-${itemIndex}`;
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalChecked = checkedItems.size;
  const totalItems = shoppingPlan.total_items;
  const progress = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;

  const handleShare = async () => {
    const text = shoppingPlan.stops
      .map(
        (stop) =>
          `${stop.store.name} (${stop.store.address}):\n${stop.items.map((item) => `  - ${item.product_name} (${item.brand}) — $${item.price.toFixed(2)}`).join("\n")}`
      )
      .join("\n\n");

    const fullText = `Shopping list for ${shoppingPlan.dish_name}\n\n${text}\n\nTotal: $${shoppingPlan.total_cost.toFixed(2)}`;

    if (navigator.share) {
      await navigator.share({ title: `Shopping list: ${shoppingPlan.dish_name}`, text: fullText });
    } else {
      await navigator.clipboard.writeText(fullText);
      alert("Shopping list copied to clipboard!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => setStep("matching")}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Change strategy
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Shopping Plan
            </h2>
            <p className="text-gray-500 mt-1">
              {shoppingPlan.dish_name} &middot;{" "}
              {shoppingPlan.total_stores}{" "}
              {shoppingPlan.total_stores === 1 ? "store" : "stores"} &middot;{" "}
              {shoppingPlan.total_items} items
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-500">
              ${shoppingPlan.total_cost.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">estimated total</p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {totalChecked}/{totalItems} items checked off
        </p>
      </div>

      <div className="space-y-6">
        {shoppingPlan.stops.map((stop) => (
          <div
            key={stop.order}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                    {stop.order}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{stop.store.name}</h3>
                    <p className="text-orange-100 text-sm">
                      {stop.store.address} &middot;{" "}
                      {stop.store.distance_miles} mi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    ${stop.subtotal.toFixed(2)}
                  </p>
                  <p className="text-orange-100 text-sm">
                    {stop.items.length} items
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {stop.items.map((item, idx) => {
                  const key = `${stop.order}-${idx}`;
                  const isChecked = checkedItems.has(key);

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer ${
                        isChecked ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleItem(stop.order, idx)}
                    >
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isChecked
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-medium ${isChecked ? "line-through text-gray-400" : "text-gray-900"}`}
                        >
                          {item.product_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.brand}
                          {item.aisle && ` · ${item.aisle}`}
                          {" · for "}
                          <span className="text-orange-600">
                            {item.ingredient_name}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`text-lg font-semibold ${isChecked ? "text-gray-400" : "text-gray-900"}`}
                      >
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={handleShare}
          className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share List
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Cook Another Dish
        </button>
      </div>
    </div>
  );
}
