import type { Coordinates } from "@/types/astra";

export type RoutePoint = { latitude: number; longitude: number };
export const DEFAULT_OSRM_ENDPOINT = "https://router.project-osrm.org";

export function decodeGeoJsonRoute(coordinates: unknown): RoutePoint[] { if (!Array.isArray(coordinates)) return []; return coordinates.flatMap((pair) => Array.isArray(pair) && pair.length >= 2 && Number.isFinite(Number(pair[0])) && Number.isFinite(Number(pair[1])) ? [{ latitude: Number(pair[1]), longitude: Number(pair[0]) }] : []); }
function directFallback(origin: Coordinates, destination: Coordinates): RoutePoint[] { return [{ latitude: origin.latitude, longitude: origin.longitude }, { latitude: destination.latitude, longitude: destination.longitude }]; }

export async function fetchLiveRoute(origin: Coordinates, destination: Coordinates): Promise<RoutePoint[]> {
  const base = process.env.EXPO_PUBLIC_OSRM_ENDPOINT ?? DEFAULT_OSRM_ENDPOINT;
  const url = `${base.replace(/\/$/, "")}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&alternatives=false`;
  try {
    const response = await fetch(url);
    if (!response.ok) return directFallback(origin, destination);
    const body = await response.json() as { code?: string; routes?: { geometry?: { coordinates?: unknown } }[] };
    const decoded = decodeGeoJsonRoute(body.routes?.[0]?.geometry?.coordinates);
    return body.code === "Ok" && decoded.length >= 2 ? decoded : directFallback(origin, destination);
  } catch { return directFallback(origin, destination); }
}
