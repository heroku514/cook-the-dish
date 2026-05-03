import { NextRequest, NextResponse } from "next/server";
import { parseRecipe } from "@/lib/ai/recipe-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dish_name, servings = 2 } = body;

    if (!dish_name || typeof dish_name !== "string") {
      return NextResponse.json(
        { error: "dish_name is required" },
        { status: 400 }
      );
    }

    const recipe = await parseRecipe(dish_name.trim(), servings);

    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Recipe parsing error:", error);
    const message =
      error instanceof Error &&
      error.message.includes("authentication")
        ? "API key not configured. Add ANTHROPIC_API_KEY to .env.local"
        : "Failed to parse recipe. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
