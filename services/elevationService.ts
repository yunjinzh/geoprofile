import { Coordinate, ElevationPoint } from '../types';

// Helper to calculate distance between two coords in meters (Haversine formula)
export const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
  const R = 6371e3; // metres
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Interpolate points between start and end
const interpolatePoints = (start: Coordinate, end: Coordinate, samples: number): Coordinate[] => {
  const points: Coordinate[] = [];
  for (let i = 0; i <= samples; i++) {
    const ratio = i / samples;
    points.push({
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    });
  }
  return points;
};

// SIMULATED Elevation API
// In a production app, this would fetch from Google Maps Elevation API or OpenTopography.
// Public free APIs are often unreliable or CORS restricted for client-side apps.
// This generator creates a realistic looking terrain profile based on randomness and sine waves relative to coordinates.
export const fetchElevationProfile = async (start: Coordinate, end: Coordinate): Promise<ElevationPoint[]> => {
  const totalDistance = calculateDistance(start, end);
  const samples = 50; // Number of data points
  const coords = interpolatePoints(start, end, samples);
  
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  let currentElevation = Math.max(0, (Math.sin(start.lat * 10) * 500) + (Math.cos(start.lng * 10) * 500) + 1000);
  
  return coords.map((coord, index) => {
    const dist = (index / samples) * totalDistance;
    
    // Create some "noise" and "terrain features"
    const noise = Math.random() * 20 - 10;
    const terrainTrend = Math.sin(dist / (totalDistance / 3)) * 200; // Large hills
    
    // Adjust elevation gradually to look connected
    currentElevation += (Math.random() - 0.5) * 50 + (terrainTrend * 0.05);
    if (currentElevation < 0) currentElevation = 0; // Sea level base

    return {
      distance: parseFloat(dist.toFixed(1)),
      elevation: parseFloat((currentElevation + noise).toFixed(1)),
      location: coord
    };
  });
};