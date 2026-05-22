/**
 * Calculate distance between two points on Earth using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance in a human-readable way
 * @param km Distance in kilometers
 * @returns Formatted string (e.g., "2.3km" or "850m")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Calculate distance from a reference point and add it to properties.
 * NOTE: referencePoint is [lat, lng]
 * NOTE: property.location is [lng, lat] (GeoJSON format from backend)
 */
export function addDistanceToProperties<T extends { location: [number, number] }>(
  properties: T[],
  referencePoint: [number, number]
): (T & { distance: number })[] {
  return properties.map(property => ({
    ...property,
    distance: calculateDistance(
      referencePoint[0],          // user lat
      referencePoint[1],          // user lng
      property.location[1],       // property lat (location[1] because format is [lng, lat])
      property.location[0]        // property lng (location[0] because format is [lng, lat])
    ),
  }));
}

/**
 * Filter properties within a certain radius.
 * NOTE: centerPoint is [lat, lng]
 * NOTE: property.location is [lng, lat] (GeoJSON format from backend)
 */
export function filterByRadius<T extends { location: [number, number] }>(
  properties: T[],
  centerPoint: [number, number],
  radiusKm: number
): T[] {
  return properties.filter(property => {
    const distance = calculateDistance(
      centerPoint[0],        // user lat
      centerPoint[1],        // user lng
      property.location[1],  // property lat (location[1] because format is [lng, lat])
      property.location[0]   // property lng (location[0] because format is [lng, lat])
    );
    return distance <= radiusKm;
  });
}

/**
 * Find optimal location that minimizes total distance to multiple points
 * (Geometric median approximation)
 */
export function findOptimalLocation(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  
  // Simple approximation: use centroid
  const avgLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const avgLon = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  
  return [avgLat, avgLon];
}

/**
 * Calculate total distance from a point to multiple destinations
 */
export function calculateTotalDistance(
  origin: [number, number],
  destinations: [number, number][]
): number {
  return destinations.reduce((total, dest) => {
    return total + calculateDistance(origin[0], origin[1], dest[0], dest[1]);
  }, 0);
}
