import { NextResponse } from "next/server";
import { getProductMatchCache } from "@/lib/db";
import { instacartCacheKey } from "@/lib/db/cache-keys";

export async function POST(request: Request) {
  try {
    const { ingredients, lat, lng } = await request.json();

    if (!ingredients || !lat || !lng) {
      return NextResponse.json(
        { error: "Missing ingredients, lat, or lng" },
        { status: 400 }
      );
    }

    const cacheK = instacartCacheKey(ingredients, lat, lng);
    const cached = await getProductMatchCache(cacheK);

    if (cached) {
      return NextResponse.json({ hit: true, matches: cached });
    }

    return NextResponse.json({ hit: false });
  } catch (e) {
    console.error("cache-check error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
