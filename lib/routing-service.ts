import type { Coordinates } from "@/types/astra";

export type RoutePoint = { latitude: number; longitude: number };

function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = []; let index = 0; let latitude = 0; let longitude = 0;
  while (index < encoded.length) {
    let shift = 0; let result = 0; let byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude += (result & 1) ? ~(result >> 1) : result >> 1; shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude += (result & 1) ? ~(result >> 1) : result >> 1; points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

export async function fetchLiveRoute(origin: Coordinates, destination: Coordinates): Promise<RoutePoint[]> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [{ latitude: origin.latitude, longitude: origin.longitude }, { latitude: destination.latitude, longitude: destination.longitude }];
  const query = new URLSearchParams({ origin: `${origin.latitude},${origin.longitude}`, destination: `${destination.latitude},${destination.longitude}`, mode: "driving", key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${query.toString()}`);
  if (!response.ok) throw new Error(`Directions request failed with HTTP ${response.status}`);
  const body = await response.json() as { status: string; routes?: { overview_polyline?: { points?: string } }[] };
  const encoded = body.routes?.[0]?.overview_polyline?.points;
  if (body.status !== "OK" || !encoded) throw new Error(`Directions provider returned ${body.status}`);
  return decodePolyline(encoded);
}
