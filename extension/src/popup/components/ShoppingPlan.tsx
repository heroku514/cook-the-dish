import { useStore } from "../store";

export function ShoppingPlan() {
  const { plan } = useStore();

  if (!plan) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">Shopping Plan</h2>
        <span className="text-sm font-medium text-orange-600">
          ${plan.total_cost.toFixed(2)}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {plan.total_items} items · {plan.total_stores} {plan.total_stores === 1 ? "stop" : "stops"} · {plan.strategy}
      </p>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {plan.stops.map((stop) => (
          <div key={stop.order} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                  Stop {stop.order}
                </span>
                <span className="ml-2 font-medium text-sm">{stop.store.name}</span>
              </div>
              <span className="text-sm font-medium">${stop.subtotal.toFixed(2)}</span>
            </div>

            <ul className="space-y-1.5">
              {stop.items.map((item, i) => (
                <li key={i} className="flex items-start justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-gray-400">
                      {item.brand}{item.aisle ? ` · ${item.aisle}` : ""}
                    </p>
                  </div>
                  <span className="ml-2 text-gray-600">${item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={() => useStore.getState().reset()}
        className="mt-4 w-full py-2.5 border border-orange-500 text-orange-500 rounded-lg font-medium text-sm hover:bg-orange-50"
      >
        Cook another dish
      </button>
    </div>
  );
}
