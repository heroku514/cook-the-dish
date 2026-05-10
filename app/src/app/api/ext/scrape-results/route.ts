import { NextResponse } from "next/server";
import { analyzeScrapeResults } from "@/lib/ai/scrape-analyzer";

export async function POST(request: Request) {
  try {
    const { ingredients, scrape_results, lat, lng } = await request.json();

    if (!ingredients || !scrape_results || !lat || !lng) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const matches = await analyzeScrapeResults(
      ingredients,
      scrape_results,
      lat,
      lng
    );

    return NextResponse.json({ matches });
  } catch (e) {
    console.error("scrape-results error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
