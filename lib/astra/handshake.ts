import type { AcceptanceRequest, Hospital } from "@/types/astra";

export const ACCEPTANCE_TIMEOUT_SECONDS = 90;

export function createAcceptanceRequests(hospitals: Hospital[], sentAt = new Date().toISOString()): AcceptanceRequest[] {
  const expiresAt = new Date(Date.parse(sentAt) + ACCEPTANCE_TIMEOUT_SECONDS * 1000).toISOString();
  return hospitals.slice(0, 3).map((hospital, index) => ({ id: `request-${Date.now()}-${index}`, hospitalId: hospital.id, status: "pending", sentAt, expiresAt }));
}

export function expireAcceptanceRequests(requests: AcceptanceRequest[], now = Date.now(), timeoutSeconds = ACCEPTANCE_TIMEOUT_SECONDS): AcceptanceRequest[] {
  return requests.map((request) => request.status !== "pending" || (now - new Date(request.sentAt).getTime()) / 1000 < timeoutSeconds ? request : { ...request, status: "timeout", respondedAt: new Date(now).toISOString() });
}

export function clarifyAcceptance(requests: AcceptanceRequest[], hospitalId: string, notes: string, respondedAt = new Date().toISOString()): AcceptanceRequest[] {
  return requests.map((request) => request.hospitalId === hospitalId && request.status === "pending"
    ? { ...request, status: "needs_clarification", clarificationNotes: notes.trim() || "Hospital requested clarification.", respondedAt, responderName: "Hospital Emergency Coordinator" }
    : request);
}

export function resolveAcceptance(requests: AcceptanceRequest[], hospitalId: string, respondedAt = new Date().toISOString()): { destinationId?: string; requests: AcceptanceRequest[] } {
  if (requests.some((request) => request.status === "accepted")) return { destinationId: requests.find((request) => request.status === "accepted")?.hospitalId, requests };
  const target = requests.find((request) => request.hospitalId === hospitalId && request.status === "pending");
  if (!target) return { requests };
  return { destinationId: hospitalId, requests: requests.map((request) => request.hospitalId === hospitalId ? { ...request, status: "accepted", respondedAt, responderName: "Hospital Emergency Coordinator" } : request.status === "pending" ? { ...request, status: "assigned_elsewhere" } : request) };
}
