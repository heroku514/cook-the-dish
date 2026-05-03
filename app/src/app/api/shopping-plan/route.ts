import { NextRequest, NextResponse } from "next/server";
import { optimizeShoppingPlan } from "@/lib/optimizer/shopping-optimizer";
import type { ProductMatch, OptimizationStrategy } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      matches,
      strategy = "balanced",
      max_stores = 3,
      dish_name,
      recipe_id,
    } = body as {
      matches: ProductMatch[];
      strategy: OptimizationStrategy;
      max_stores: number;
      dish_name: string;
      recipe_id: string;
    };

    if (!matches?.length || !dish_name || !recipe_id) {
      return NextResponse.json(
        { error: "matches, dish_name, and recipe_id are required" },
        { status: 400 }
      );
    }

    const plan = optimizeShoppingPlan(matches, {
      strategy,
      maxStores: max_stores,
      dishName: dish_name,
      recipeId: recipe_id,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Shopping plan error:", error);
    return NextResponse.json(
      { error: "Failed to generate shopping plan." },
      { status: 500 }
    );
  }
}
