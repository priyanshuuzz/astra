import { describe, expect, it } from "vitest";
import { toCoordinatorAlert } from "../lib/coordinator-alerts";
import type { AcceptanceRequest } from "../types/astra";

const request = (status: AcceptanceRequest["status"]): AcceptanceRequest => ({ id: `req-${status}`, hospitalId: "hospital-1", status, sentAt: "2026-08-26T00:00:00.000Z" });

describe("coordinator acceptance alerts", () => {
  it("marks accepted ambulance requests for sound delivery", () => { const alert = toCoordinatorAlert(request("accepted")); expect(alert.title).toBe("Ambulance request accepted"); expect(alert.shouldSound).toBe(true); expect(alert.tone).toBe("success"); });
  it("keeps decline, clarification, timeout, and assigned-elsewhere events visible without sound", () => { for (const status of ["declined", "needs_clarification", "timeout", "assigned_elsewhere"] as const) expect(toCoordinatorAlert(request(status)).shouldSound).toBe(false); });
  it("explains a clarification request", () => { const alert = toCoordinatorAlert({ ...request("needs_clarification"), clarificationNotes: "Confirm onset window" }); expect(alert.title).toBe("Clarification requested"); expect(alert.body).toContain("Confirm onset window"); expect(alert.tone).toBe("urgent"); });
  it("creates an urgent alert for pending requests", () => expect(toCoordinatorAlert(request("pending")).tone).toBe("urgent"));
});
