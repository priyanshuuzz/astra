import { describe, expect, it } from "vitest";
import { fetchLiveRoute } from "../lib/routing-service";

describe("Open-source route configuration", () => {
  it("fetches route geometry from the keyless OSRM-compatible provider", async () => {
    const route = await fetchLiveRoute({ latitude: 17.385, longitude: 78.4867, label: "Hyderabad" }, { latitude: 17.428, longitude: 78.407, label: "Metro Trauma Institute" });
    expect(route.length).toBeGreaterThanOrEqual(2);
  }, 15_000);
});
