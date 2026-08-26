import { describe, expect, it } from "vitest";
import { demoHospitals, demoLocation } from "../data/demo";
import { HospitalRecommendationEngine, distanceKm, freshnessScore } from "../lib/astra/recommendation";

describe("ASTRA V2 recommendation engine", () => {
  const engine = new HospitalRecommendationEngine();
  it("calculates a positive geographic distance", () => expect(distanceKm(demoLocation, demoHospitals[0].location)).toBeGreaterThan(0));
  it("downgrades aging data", () => { const now = Date.now(); expect(freshnessScore(new Date(now - 2 * 60_000).toISOString(), now)).toBeGreaterThan(freshnessScore(new Date(now - 45 * 60_000).toISOString(), now)); });
  it("applies hard clinical gates before ranking", () => { const result = engine.rankWithExcluded("trauma", demoLocation, demoHospitals); expect(result.eligible[0].hospital.name).toBe("Metro Trauma Institute"); expect(result.excluded.some(({ score }) => score.gateFailures?.includes("ICU"))).toBe(true); });
  it("keeps a closer capability-adequate hospital ahead of a farther confirmed one", () => { const close = { ...demoHospitals[0], id: "close", name: "Close Adequate", location: { ...demoLocation, label: "Close" }, verificationStatus: "unknown" as const, isVerified: false }; const far = { ...demoHospitals[0], id: "far", name: "Far Confirmed", location: { latitude: demoLocation.latitude + 0.08, longitude: demoLocation.longitude + 0.08, label: "Far" }, verificationStatus: "verified" as const, isVerified: true }; const ranked = engine.rank("trauma", demoLocation, [close, far]); expect(ranked[0].hospital.id).toBe("close"); });
});
