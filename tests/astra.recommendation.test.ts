import { describe, expect, it } from "vitest";
import { demoHospitals, demoLocation } from "../data/demo";
import { HospitalRecommendationEngine, distanceKm, freshnessScore } from "../lib/astra/recommendation";

describe("ASTRA V2 recommendation engine", () => {
  const engine = new HospitalRecommendationEngine();
  it("calculates a positive geographic distance", () => expect(distanceKm(demoLocation, demoHospitals[0].location)).toBeGreaterThan(0));
  it("downgrades aging data", () => { const now = Date.now(); expect(freshnessScore(new Date(now - 2 * 60_000).toISOString(), now)).toBeGreaterThan(freshnessScore(new Date(now - 45 * 60_000).toISOString(), now)); });
  it("applies hard clinical gates before ranking", () => { const result = engine.rankWithExcluded("trauma", demoLocation, demoHospitals); expect(result.eligible[0].hospital.name).toBe("Metro Trauma Institute"); expect(result.excluded.some(({ score }) => score.gateFailures?.includes("ICU"))).toBe(true); });
  it("does not route to an unpromoted real-data hospital even when it has matching capabilities", () => { const candidate = { ...demoHospitals[0], id: "unpromoted", name: "Unpromoted Facility", isVerified: true, routingCandidate: false, verificationStatus: "verified" as const }; const result = engine.rankWithExcluded("trauma", demoLocation, [candidate]); expect(result.eligible).toHaveLength(0); expect(result.excluded[0].score.reasons[0]).toBe("Not an active verified routing candidate"); });
  it("keeps the local demo path available only for explicitly verified demo records", () => { const demo = { ...demoHospitals[0], routingCandidate: undefined, isVerified: true }; expect(engine.rank("trauma", demoLocation, [demo])).toHaveLength(1); });
});
