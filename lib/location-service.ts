import * as Location from "expo-location";
import { Platform } from "react-native";
import type { Coordinates } from "@/types/astra";
import { demoLocation } from "@/data/demo";

export type LocationResult = { location?: Coordinates; error?: string };

export async function requestCurrentLocation(): Promise<LocationResult> {
  if (Platform.OS === "web" && !globalThis.navigator?.geolocation) return { location: demoLocation, error: "Browser geolocation is unavailable; showing ASTRA demo location." };
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) return { location: demoLocation, error: "Location services are disabled; showing ASTRA demo location." };
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") return { location: demoLocation, error: "Location permission was denied; showing ASTRA demo location." };
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { location: { latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Current device location" } };
}

export async function watchCurrentLocation(onLocation: (location: Coordinates) => void, onError: (message: string) => void) {
  if (Platform.OS === "web") return undefined;
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") { onError("Location permission is needed for live tracking."); return undefined; }
  return Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 10 }, (position) => onLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, label: "Live device location" }));
}
