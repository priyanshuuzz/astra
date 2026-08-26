import { describe, expect, it } from "vitest";
import { demoHospitals, demoLocation } from "../data/demo";
import { HospitalRecommendationEngine, distanceKm, freshnessScore } from "../lib/astra/recommendation";

describe("ASTRA recommendation engine", () => {
  const engine = new HospitalRecommendationEngine();

  it("calculates a positive geographic distance", () => {
    expect(distanceKm(demoLocation, demoHospitals[0].location)).toBeGreaterThan(0);
  });

  it("downgrades aging data", () => {
    const fresh = freshnessScore(new Date().toISOString());
    const old = freshnessScore(new Date(Date.now() - 40 * 60_000).toISOString());
    expect(fresh).toBeGreaterThan(old);
    expect(old).toBe(20);
  });

  it("ranks trauma hospitals by more than distance", () => {
    const ranked = engine.rank("trauma", demoLocation, demoHospitals);
    expect(ranked.length).toBeGreaterThan(1);
    expect(ranked[0].hospital.name).toBe("Metro Trauma Institute");
    expect(ranked[0].score.clinical).toBeGreaterThan(ranked[1].score.clinical);
    expect(ranked[0].score.reasons.length).toBeGreaterThan(2);
  });

  it("changes clinical preference for cardiac emergencies", () => {
    const cardiac = engine.rank("cardiac", demoLocation, demoHospitals);
    expect(cardiac.find((item) => item.hospital.id === "sunrise-heart")?.score.clinical).toBeGreaterThan(70);
  });
});
