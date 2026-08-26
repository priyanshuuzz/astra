import * as Location from "expo-location";
import { Platform } from "react-native";
import type { Coordinates } from "@/types/astra";
import { demoLocation } from "@/data/demo";
import { classifyLocationPermission, type LocationPermissionState } from "@/lib/location-permissions";

export type LocationResult = { location?: Coordinates; state: LocationPermissionState; error?: string };
function fallback(state: LocationPermissionState, error: string): LocationResult { return { location: demoLocation, state, error }; }

export async function requestCurrentLocation(): Promise<LocationResult> {
  if (Platform.OS === "web" && !globalThis.navigator?.geolocation) return fallback("unavailable", "Browser geolocation is unavailable; showing ASTRA demo location.");
  try {
    if (!(await Location.hasServicesEnabledAsync())) return fallback("services_disabled", "Location services are disabled. Enable them to share the current route.");
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return fallback(classifyLocationPermission(permission.status, permission.canAskAgain), permission.canAskAgain ? "Location permission was denied." : "Location permission is restricted in device settings.");
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { state: "granted", location: { latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Current device location" } };
  } catch { return fallback("error", "Unable to read device location. Following the safe demo fallback."); }
}

export async function watchCurrentLocation(onLocation: (location: Coordinates) => void, onError: (message: string, state?: LocationPermissionState) => void) {
  if (Platform.OS === "web") return undefined;
  try {
    if (!(await Location.hasServicesEnabledAsync())) { onError("Location services are disabled.", "services_disabled"); return undefined; }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") { const state = classifyLocationPermission(permission.status, permission.canAskAgain); onError(state === "restricted" ? "Location permission is restricted in device settings." : "Location permission is needed for live tracking.", state); return undefined; }
    return Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 10 }, (position) => onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Live device location" }));
  } catch { onError("Live location is unavailable; use the manual location fallback.", "error"); return undefined; }
}
