export type NativePlatform = "ios" | "android";
export type NativeIntegrationStatus = { mapsProvider: "google"; mapsConfigured: boolean; locationPermissionConfigured: boolean; guidance: string };

export function getNativeIntegrationStatus(env: Record<string, string | undefined> = process.env): NativeIntegrationStatus { const mapsConfigured = Boolean(env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || env.GOOGLE_MAPS_API_KEY); return { mapsProvider: "google", mapsConfigured, locationPermissionConfigured: true, guidance: mapsConfigured ? "Google Maps key is configured for native builds." : "Native maps use a safe route fallback until a restricted Google Maps key is configured." }; }
