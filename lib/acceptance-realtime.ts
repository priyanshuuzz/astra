import { supabase } from "@/lib/supabase";
import type { AcceptanceRequest, DeclineReason } from "@/types/astra";

export type AcceptanceEvent = { event: "INSERT" | "UPDATE" | "DELETE"; request: AcceptanceRequest; oldRequest?: Partial<AcceptanceRequest> };
export type AcceptanceEventHandler = (event: AcceptanceEvent) => void;

function mapRequest(row: Record<string, unknown>): AcceptanceRequest {
  return { id: String(row.id), hospitalId: String(row.hospital_id), status: row.status as AcceptanceRequest["status"], sentAt: String(row.sent_at), respondedAt: row.responded_at ? String(row.responded_at) : undefined, declineReason: row.decline_reason as DeclineReason | undefined, declineNotes: row.decline_notes ? String(row.decline_notes) : undefined, responderName: row.responder_name ? String(row.responder_name) : undefined };
}

export function subscribeToAcceptanceEvents(options: { emergencyId?: string; hospitalId?: string; onEvent: AcceptanceEventHandler; onError?: (message: string) => void }): () => void {
  if (!supabase) { options.onError?.("Realtime is unavailable because Supabase is not configured."); return () => undefined; }
  const client = supabase;
  const filters = options.emergencyId ? [{ event: "*", schema: "public", table: "acceptance_requests", filter: `emergency_id=eq.${options.emergencyId}` }] : options.hospitalId ? [{ event: "*", schema: "public", table: "acceptance_requests", filter: `hospital_id=eq.${options.hospitalId}` }] : [{ event: "*", schema: "public", table: "acceptance_requests" }];
  const channel = supabase.channel(`astra-acceptance-${options.emergencyId ?? options.hospitalId ?? "coordinator"}`);
  for (const filter of filters) channel.on("postgres_changes" as never, filter as never, (payload: any) => options.onEvent({ event: payload.eventType as AcceptanceEvent["event"], request: mapRequest(payload.new as Record<string, unknown>), oldRequest: payload.old ? mapRequest(payload.old as Record<string, unknown>) : undefined }));
  channel.subscribe((status) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") options.onError?.(`Realtime channel ${status.toLowerCase().replace("_", " ")}.`); });
  return () => { void client.removeChannel(channel); };
}
