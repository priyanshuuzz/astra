import type { AcceptanceRequest, AstraAuditEvent, DeclineReason, EmergencyState, Hospital, UserRole } from "@/types/astra";

export const ACCEPTANCE_TIMEOUT_SECONDS = 90;

export function createAcceptanceRequests(hospitals: Hospital[], sentAt = new Date().toISOString()): AcceptanceRequest[] {
  const expiresAt = new Date(Date.parse(sentAt) + ACCEPTANCE_TIMEOUT_SECONDS * 1000).toISOString();
  return hospitals.slice(0, 3).map((hospital, index) => ({
    id: `req-${Date.now()}-${index}`,
    hospitalId: hospital.id,
    status: "pending",
    sentAt,
    expiresAt,
  }));
}

export function expireAcceptanceRequests(requests: AcceptanceRequest[], now = Date.now(), timeoutSeconds = ACCEPTANCE_TIMEOUT_SECONDS): AcceptanceRequest[] {
  return requests.map((request) => {
    if (request.status !== "pending" && request.status !== "needs_clarification") return request;
    const sentTime = new Date(request.sentAt).getTime();
    if ((now - sentTime) / 1000 >= timeoutSeconds) {
      return { ...request, status: "timeout", respondedAt: new Date(now).toISOString() };
    }
    return request;
  });
}

export function clarifyAcceptance(requests: AcceptanceRequest[], hospitalId: string, notes: string, respondedAt = new Date().toISOString()): AcceptanceRequest[] {
  return requests.map((request) =>
    request.hospitalId === hospitalId && (request.status === "pending" || request.status === "needs_clarification")
      ? {
          ...request,
          status: "needs_clarification",
          clarificationNotes: notes.trim() || "Hospital requested clinical clarification before acceptance decision.",
          respondedAt,
          responderName: "Hospital Emergency Coordinator",
        }
      : request
  );
}

export function answerClarification(requests: AcceptanceRequest[], hospitalId: string, answer: string, answeredAt = new Date().toISOString()): AcceptanceRequest[] {
  return requests.map((request) =>
    request.hospitalId === hospitalId && request.status === "needs_clarification"
      ? {
          ...request,
          status: "pending",
          clarificationNotes: `${request.clarificationNotes ?? "Clarification requested"} | Answered: ${answer.trim()}`,
          respondedAt: answeredAt,
        }
      : request
  );
}

export function declineAcceptance(
  requests: AcceptanceRequest[],
  hospitalId: string,
  declineReason: DeclineReason = "capability_unavailable",
  declineNotes?: string,
  respondedAt = new Date().toISOString()
): AcceptanceRequest[] {
  return requests.map((request) =>
    request.hospitalId === hospitalId && (request.status === "pending" || request.status === "needs_clarification")
      ? {
          ...request,
          status: "declined",
          declineReason,
          declineNotes: declineNotes?.trim() || "Hospital marked operational inability to receive patient.",
          respondedAt,
          responderName: "Hospital Emergency Coordinator",
        }
      : request
  );
}

export function resolveAcceptance(requests: AcceptanceRequest[], hospitalId: string, respondedAt = new Date().toISOString()): { destinationId?: string; requests: AcceptanceRequest[] } {
  // Prevent duplicate acceptance locking
  const alreadyAccepted = requests.find((request) => request.status === "accepted");
  if (alreadyAccepted) {
    return { destinationId: alreadyAccepted.hospitalId, requests };
  }

  const target = requests.find((request) => request.hospitalId === hospitalId && (request.status === "pending" || request.status === "needs_clarification"));
  if (!target) return { requests };

  const updatedRequests = requests.map((request) => {
    if (request.hospitalId === hospitalId) {
      return { ...request, status: "accepted" as const, respondedAt, responderName: "Hospital Emergency Coordinator" };
    }
    if (request.status === "pending" || request.status === "needs_clarification") {
      return { ...request, status: "assigned_elsewhere" as const };
    }
    return request;
  });

  return { destinationId: hospitalId, requests: updatedRequests };
}

export function validateStateTransition(current: EmergencyState, target: EmergencyState): boolean {
  const allowedMap: Record<EmergencyState, EmergencyState[]> = {
    DRAFT: ["SUBMITTED", "MATCHING"],
    SUBMITTED: ["MATCHING", "REFERRAL_SENT"],
    MATCHING: ["REFERRAL_SENT", "FAILOVER"],
    REFERRAL_SENT: ["PENDING_ACCEPTANCE", "CLARIFICATION_REQUIRED", "ACCEPTED", "DECLINED", "FAILOVER"],
    PENDING_ACCEPTANCE: ["CLARIFICATION_REQUIRED", "ACCEPTED", "DECLINED", "NEXT_CANDIDATE", "FAILOVER"],
    CLARIFICATION_REQUIRED: ["PENDING_ACCEPTANCE", "ACCEPTED", "DECLINED", "FAILOVER"],
    ACCEPTED: ["DESTINATION_CONFIRMED"],
    DESTINATION_CONFIRMED: [],
    DECLINED: ["NEXT_CANDIDATE", "FAILOVER"],
    NEXT_CANDIDATE: ["REFERRAL_SENT", "PENDING_ACCEPTANCE", "FAILOVER"],
    FAILOVER: ["MATCHING", "DESTINATION_CONFIRMED"],
  };

  return allowedMap[current]?.includes(target) ?? false;
}

export function createAuditEvent(
  emergencyId: string,
  eventType: AstraAuditEvent["eventType"],
  actorRole: UserRole,
  details: string,
  payload?: Record<string, unknown>,
  actorId?: string
): AstraAuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    emergencyId,
    eventType,
    timestamp: new Date().toISOString(),
    actorRole,
    actorId,
    details,
    payload,
  };
}
