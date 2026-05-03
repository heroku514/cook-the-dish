import type {
  ProductMatch,
  ShoppingPlan,
  ShoppingStop,
  ShoppingItem,
  Store,
  OptimizationStrategy,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

interface OptimizerOptions {
  strategy: OptimizationStrategy;
  maxStores: number;
  dishName: string;
  recipeId: string;
}

export function optimizeShoppingPlan(
  matches: ProductMatch[],
  options: OptimizerOptions
): ShoppingPlan {
  const { strategy, maxStores, dishName, recipeId } = options;

  const inStockMatches = matches.filter((m) => m.in_stock);

  const ingredientIds = [
    ...new Set(inStockMatches.map((m) => m.ingredient_id)),
  ];

  let stops: ShoppingStop[];

  switch (strategy) {
    case "single_store":
      stops = optimizeSingleStore(inStockMatches, ingredientIds);
      break;
    case "cheapest":
      stops = optimizeCheapest(inStockMatches, ingredientIds, maxStores);
      break;
    case "fewest_stops":
      stops = optimizeFewestStops(inStockMatches, ingredientIds, maxStores);
      break;
    case "balanced":
    default:
      stops = optimizeBalanced(inStockMatches, ingredientIds, maxStores);
      break;
  }

  const totalCost = stops.reduce((sum, stop) => sum + stop.subtotal, 0);
  const totalItems = stops.reduce((sum, stop) => sum + stop.items.length, 0);

  return {
    id: uuidv4(),
    dish_name: dishName,
    recipe_id: recipeId,
    strategy,
    stops,
    total_cost: Math.round(totalCost * 100) / 100,
    total_stores: stops.length,
    total_items: totalItems,
    created_at: new Date().toISOString(),
  };
}

function optimizeSingleStore(
  matches: ProductMatch[],
  ingredientIds: string[]
): ShoppingStop[] {
  const storeScores = new Map<
    string,
    { store: Store; covered: Set<string>; totalCost: number; items: ProductMatch[] }
  >();

  for (const match of matches) {
    const storeId = match.store.id;
    if (!storeScores.has(storeId)) {
      storeScores.set(storeId, {
        store: match.store,
        covered: new Set(),
        totalCost: 0,
        items: [],
      });
    }
    const entry = storeScores.get(storeId)!;

    const existing = entry.items.find(
      (i) => i.ingredient_id === match.ingredient_id
    );
    if (!existing || match.match_score > existing.match_score) {
      if (existing) {
        entry.totalCost -= existing.price;
        entry.items = entry.items.filter(
          (i) => i.ingredient_id !== match.ingredient_id
        );
      }
      entry.covered.add(match.ingredient_id);
      entry.totalCost += match.price;
      entry.items.push(match);
    }
  }

  let bestStore: { store: Store; items: ProductMatch[]; totalCost: number } | null = null;
  let bestScore = -1;

  for (const entry of storeScores.values()) {
    const coverageScore = entry.covered.size / ingredientIds.length;
    const score = coverageScore * 100 - entry.totalCost * 0.1;
    if (score > bestScore) {
      bestScore = score;
      bestStore = entry;
    }
  }

  if (!bestStore) return [];

  return [
    {
      order: 1,
      store: bestStore.store,
      items: bestStore.items.map(toShoppingItem),
      subtotal:
        Math.round(
          bestStore.items.reduce((sum, m) => sum + m.price, 0) * 100
        ) / 100,
    },
  ];
}

function optimizeCheapest(
  matches: ProductMatch[],
  ingredientIds: string[],
  maxStores: number
): ShoppingStop[] {
  const assignment = new Map<string, ProductMatch>();

  for (const ingId of ingredientIds) {
    const candidates = matches
      .filter((m) => m.ingredient_id === ingId)
      .sort((a, b) => a.price - b.price);
    if (candidates.length > 0) {
      assignment.set(ingId, candidates[0]);
    }
  }

  return buildStopsFromAssignment(assignment, maxStores);
}

function optimizeFewestStops(
  matches: ProductMatch[],
  ingredientIds: string[],
  maxStores: number
): ShoppingStop[] {
  const uncovered = new Set(ingredientIds);
  const selectedStores: string[] = [];
  const assignment = new Map<string, ProductMatch>();

  while (uncovered.size > 0 && selectedStores.length < maxStores) {
    let bestStoreId = "";
    let bestCoverage = 0;

    const storeIds = [...new Set(matches.map((m) => m.store.id))];
    for (const storeId of storeIds) {
      if (selectedStores.includes(storeId)) continue;
      const covers = matches.filter(
        (m) => m.store.id === storeId && uncovered.has(m.ingredient_id)
      ).length;
      if (covers > bestCoverage) {
        bestCoverage = covers;
        bestStoreId = storeId;
      }
    }

    if (!bestStoreId || bestCoverage === 0) break;

    selectedStores.push(bestStoreId);
    const storeMatches = matches.filter((m) => m.store.id === bestStoreId);
    for (const match of storeMatches) {
      if (uncovered.has(match.ingredient_id)) {
        const existing = assignment.get(match.ingredient_id);
        if (!existing || match.match_score > existing.match_score) {
          assignment.set(match.ingredient_id, match);
        }
        uncovered.delete(match.ingredient_id);
      }
    }
  }

  return buildStopsFromAssignment(assignment, maxStores);
}

function optimizeBalanced(
  matches: ProductMatch[],
  ingredientIds: string[],
  maxStores: number
): ShoppingStop[] {
  const assignment = new Map<string, ProductMatch>();

  for (const ingId of ingredientIds) {
    const candidates = matches
      .filter((m) => m.ingredient_id === ingId)
      .sort((a, b) => {
        const scoreA = a.match_score * 50 - a.price * 2 - a.store.distance_miles * 3;
        const scoreB = b.match_score * 50 - b.price * 2 - b.store.distance_miles * 3;
        return scoreB - scoreA;
      });
    if (candidates.length > 0) {
      assignment.set(ingId, candidates[0]);
    }
  }

  const storeCount = new Set([...assignment.values()].map((m) => m.store.id)).size;
  if (storeCount > maxStores) {
    return optimizeFewestStops(matches, ingredientIds, maxStores);
  }

  return buildStopsFromAssignment(assignment, maxStores);
}

function buildStopsFromAssignment(
  assignment: Map<string, ProductMatch>,
  _maxStores: number
): ShoppingStop[] {
  const storeGroups = new Map<string, { store: Store; items: ProductMatch[] }>();

  for (const match of assignment.values()) {
    const storeId = match.store.id;
    if (!storeGroups.has(storeId)) {
      storeGroups.set(storeId, { store: match.store, items: [] });
    }
    storeGroups.get(storeId)!.items.push(match);
  }

  const stops: ShoppingStop[] = [];
  let order = 1;

  const sorted = [...storeGroups.values()].sort(
    (a, b) => a.store.distance_miles - b.store.distance_miles
  );

  for (const group of sorted) {
    stops.push({
      order: order++,
      store: group.store,
      items: group.items.map(toShoppingItem),
      subtotal:
        Math.round(
          group.items.reduce((sum, m) => sum + m.price, 0) * 100
        ) / 100,
    });
  }

  return stops;
}

function toShoppingItem(match: ProductMatch): ShoppingItem {
  return {
    ingredient_name: match.ingredient_name,
    product_name: match.product_name,
    brand: match.brand,
    quantity: 1,
    price: match.price,
    aisle: match.aisle,
    checked: false,
  };
}
