import { NextRequest, NextResponse } from "next/server";
import { matchProducts } from "@/lib/ai/product-matcher";
import type { RecipeIngredient, Store } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredients, stores, lat, lng } = body as {
      ingredients: RecipeIngredient[];
      stores: Store[];
      lat?: number;
      lng?: number;
    };

    if (!ingredients?.length || !stores?.length) {
      return NextResponse.json(
        { error: "ingredients and stores are required" },
        { status: 400 }
      );
    }

    const matches = await matchProducts(ingredients, stores, lat, lng);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Product matching error:", error);
    return NextResponse.json(
      { error: "Failed to match products. Please try again." },
      { status: 500 }
    );
  }
}
