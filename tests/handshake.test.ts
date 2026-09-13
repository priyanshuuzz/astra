import { describe, expect, it } from "vitest";
import {
  answerClarification,
  clarifyAcceptance,
  createAcceptanceRequests,
  declineAcceptance,
  expireAcceptanceRequests,
  resolveAcceptance,
  validateStateTransition,
} from "../lib/astra/handshake";
import { demoHospitals } from "../data/demo";

describe("ASTRA acceptance handshake & state machine", () => {
  it("sends requests to at most three hospitals with a 90-second expiry", () => {
    const sentAt = "2026-08-26T12:00:00.000Z";
    const requests = createAcceptanceRequests(demoHospitals, sentAt);
    expect(requests).toHaveLength(3);
    expect(requests[0].expiresAt).toBe("2026-08-26T12:01:30.000Z");
  });

  it("times out pending requests after 90 seconds", () => {
    const sentAt = new Date("2026-08-26T12:00:00.000Z").toISOString();
    const requests = createAcceptanceRequests(demoHospitals, sentAt);
    expect(expireAcceptanceRequests(requests, Date.parse("2026-08-26T12:01:30.000Z"))[0].status).toBe("timeout");
  });

  it("records clarification request and processes clarification answer roundtrip", () => {
    const requests = createAcceptanceRequests(demoHospitals, "2026-08-26T12:00:00.000Z");
    const clarified = clarifyAcceptance(requests, demoHospitals[0].id, "Confirm last-known onset window");
    expect(clarified[0].status).toBe("needs_clarification");
    expect(clarified[0].clarificationNotes).toBe("Confirm last-known onset window");
    expect(clarified.filter((item) => item.status === "pending")).toHaveLength(2);

    // EMS answers clarification question
    const answered = answerClarification(clarified, demoHospitals[0].id, "Onset was 35 minutes ago.");
    expect(answered[0].status).toBe("pending");
    expect(answered[0].clarificationNotes).toContain("Answered: Onset was 35 minutes ago.");
  });

  it("records explicit decline with structured reason", () => {
    const requests = createAcceptanceRequests(demoHospitals, "2026-08-26T12:00:00.000Z");
    const declined = declineAcceptance(requests, demoHospitals[0].id, "department_saturated", "ER at full capacity");
    expect(declined[0].status).toBe("declined");
    expect(declined[0].declineReason).toBe("department_saturated");
    expect(declined[0].declineNotes).toBe("ER at full capacity");
  });

  it("locks the first valid acceptance and closes other pending requests without duplicate locking", () => {
    const requests = createAcceptanceRequests(demoHospitals, "2026-08-26T12:00:00.000Z");
    const resolved = resolveAcceptance(requests, demoHospitals[1].id, "2026-08-26T12:00:22.000Z");
    expect(resolved.destinationId).toBe(demoHospitals[1].id);
    expect(resolved.requests.filter((item) => item.status === "accepted")).toHaveLength(1);
    expect(resolved.requests.filter((item) => item.status === "assigned_elsewhere")).toHaveLength(2);

    // Race condition test: second acceptance attempt is ignored and locked destination is preserved
    const race = resolveAcceptance(resolved.requests, demoHospitals[0].id);
    expect(race.destinationId).toBe(demoHospitals[1].id);
  });

  it("validates legal state machine transitions", () => {
    expect(validateStateTransition("REFERRAL_SENT", "PENDING_ACCEPTANCE")).toBe(true);
    expect(validateStateTransition("PENDING_ACCEPTANCE", "CLARIFICATION_REQUIRED")).toBe(true);
    expect(validateStateTransition("CLARIFICATION_REQUIRED", "PENDING_ACCEPTANCE")).toBe(true);
    expect(validateStateTransition("PENDING_ACCEPTANCE", "ACCEPTED")).toBe(true);
    expect(validateStateTransition("ACCEPTED", "DESTINATION_CONFIRMED")).toBe(true);

    // Illegal transitions should be blocked
    expect(validateStateTransition("DRAFT", "ACCEPTED")).toBe(false);
    expect(validateStateTransition("DESTINATION_CONFIRMED", "PENDING_ACCEPTANCE")).toBe(false);
  });
});
