export function regionCode(lat: number, lng: number): string {
  const gridSize = 0.07; // ~5 miles
  const rLat = Math.round(lat / gridSize) * gridSize;
  const rLng = Math.round(lng / gridSize) * gridSize;
  return `${rLat.toFixed(2)},${rLng.toFixed(2)}`;
}

export function buildSearchQuery(ingredientName: string): string {
  return ingredientName
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
