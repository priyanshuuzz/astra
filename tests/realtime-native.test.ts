import { describe, expect, it } from "vitest";
import { getNativeIntegrationStatus } from "../lib/native-config";
import { classifyLocationPermission } from "../lib/location-permissions";

describe("ASTRA Realtime and native integration contracts", () => {
  it("classifies iOS and Android permission outcomes safely", () => { expect(classifyLocationPermission("granted", true)).toBe("granted"); expect(classifyLocationPermission("denied", true)).toBe("denied"); expect(classifyLocationPermission("denied", false)).toBe("restricted"); });
  it("recognizes a restricted native maps key without exposing its value", () => { const configured = getNativeIntegrationStatus({ EXPO_PUBLIC_GOOGLE_MAPS_KEY: "restricted-test-key" }); expect(configured.mapsProvider).toBe("google"); expect(configured.mapsConfigured).toBe(true); expect(configured.locationPermissionConfigured).toBe(true); });
  it("provides a safe maps fallback when a key is absent", () => expect(getNativeIntegrationStatus({}).guidance).toContain("safe route fallback"));
});
