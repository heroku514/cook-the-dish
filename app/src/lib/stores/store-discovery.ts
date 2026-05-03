import type { Store } from "@/types";

// For MVP, we use curated demo stores based on location.
// In production, this would call Google Maps Places API.
// Structure is ready for real API integration.

const DEMO_STORES: Store[] = [
  {
    id: "store-kroger-1",
    name: "Kroger",
    chain: "Kroger",
    address: "1234 Main St",
    distance_miles: 0.8,
    lat: 37.7749,
    lng: -122.4194,
    type: "mainstream",
  },
  {
    id: "store-walmart-1",
    name: "Walmart Supercenter",
    chain: "Walmart",
    address: "5678 Oak Ave",
    distance_miles: 1.5,
    lat: 37.776,
    lng: -122.418,
    type: "mainstream",
  },
  {
    id: "store-safeway-1",
    name: "Safeway",
    chain: "Safeway",
    address: "910 Pine St",
    distance_miles: 1.1,
    lat: 37.7755,
    lng: -122.42,
    type: "mainstream",
  },
  {
    id: "store-hmart-1",
    name: "H Mart",
    chain: "H Mart",
    address: "2345 Asian Ave",
    distance_miles: 2.3,
    lat: 37.778,
    lng: -122.415,
    type: "ethnic",
  },
  {
    id: "store-99ranch-1",
    name: "99 Ranch Market",
    chain: "99 Ranch",
    address: "6789 Pacific Blvd",
    distance_miles: 3.1,
    lat: 37.78,
    lng: -122.41,
    type: "ethnic",
  },
  {
    id: "store-wholefoods-1",
    name: "Whole Foods Market",
    chain: "Whole Foods",
    address: "1357 Organic Lane",
    distance_miles: 1.9,
    lat: 37.7765,
    lng: -122.422,
    type: "organic",
  },
  {
    id: "store-traderjoes-1",
    name: "Trader Joe's",
    chain: "Trader Joe's",
    address: "2468 Quirky Rd",
    distance_miles: 1.4,
    lat: 37.7752,
    lng: -122.417,
    type: "mainstream",
  },
];

export async function discoverStores(
  lat: number,
  lng: number,
  radiusMiles: number = 5
): Promise<Store[]> {
  // MVP: return demo stores, sorted by distance
  // TODO: Integrate Google Maps Places API
  //   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMiles * 1609}&type=supermarket&key=${API_KEY}`;

  return DEMO_STORES.filter((s) => s.distance_miles <= radiusMiles).sort(
    (a, b) => a.distance_miles - b.distance_miles
  );
}
