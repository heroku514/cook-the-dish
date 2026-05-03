import { NextRequest, NextResponse } from "next/server";
import { discoverStores } from "@/lib/stores/store-discovery";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat = 37.7749, lng = -122.4194, radius_miles = 5 } = body;

    const stores = await discoverStores(lat, lng, radius_miles);

    return NextResponse.json({ stores });
  } catch (error) {
    console.error("Store discovery error:", error);
    return NextResponse.json(
      { error: "Failed to find nearby stores." },
      { status: 500 }
    );
  }
}
