import { describe, expect, it } from "vitest";
import { clarifyAcceptance, createAcceptanceRequests, expireAcceptanceRequests, resolveAcceptance } from "../lib/astra/handshake";
import { demoHospitals } from "../data/demo";

describe("ASTRA acceptance handshake", () => {
  it("sends requests to at most three hospitals with a 90-second expiry", () => { const sentAt = "2026-08-26T12:00:00.000Z"; const requests = createAcceptanceRequests(demoHospitals, sentAt); expect(requests).toHaveLength(3); expect(requests[0].expiresAt).toBe("2026-08-26T12:01:30.000Z"); });
  it("times out pending requests after 90 seconds", () => { const sentAt = new Date("2026-08-26T12:00:00.000Z").toISOString(); const requests = createAcceptanceRequests(demoHospitals, sentAt); expect(expireAcceptanceRequests(requests, Date.parse("2026-08-26T12:01:30.000Z"))[0].status).toBe("timeout"); });
  it("records clarification without locking the destination", () => { const requests = createAcceptanceRequests(demoHospitals, "2026-08-26T12:00:00.000Z"); const clarified = clarifyAcceptance(requests, demoHospitals[0].id, "Confirm last-known onset window"); expect(clarified[0].status).toBe("needs_clarification"); expect(clarified[0].clarificationNotes).toBe("Confirm last-known onset window"); expect(clarified.filter((item) => item.status === "pending")).toHaveLength(2); });
  it("locks the first valid acceptance and closes other pending requests", () => { const requests = createAcceptanceRequests(demoHospitals, "2026-08-26T12:00:00.000Z"); const resolved = resolveAcceptance(requests, demoHospitals[1].id, "2026-08-26T12:00:22.000Z"); expect(resolved.destinationId).toBe(demoHospitals[1].id); expect(resolved.requests.filter((item) => item.status === "accepted")).toHaveLength(1); expect(resolved.requests.filter((item) => item.status === "assigned_elsewhere")).toHaveLength(2); const race = resolveAcceptance(resolved.requests, demoHospitals[0].id); expect(race.destinationId).toBe(demoHospitals[1].id); });
});
