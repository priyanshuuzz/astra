import { supabase } from "@/lib/supabase";
import type { Hospital } from "@/types/astra";

function toHospital(row: any): Hospital {
  return { id: row.id, name: row.name, type: row.type, address: row.address, phone: row.phone, location: { latitude: row.latitude, longitude: row.longitude, label: row.name }, readiness: row.readiness, beds: { icu: row.icu_available, emergency: row.emergency_beds_available, general: row.general_beds_available, ventilators: row.ventilators_available }, specialties: row.specialties ?? [], facilities: row.facilities ?? [], specialists: [], ambulanceAvailable: row.ambulance_available, traffic: row.traffic, dataLastUpdated: row.data_last_updated, dataSource: row.data_source === "ASTRA DEMO" ? "ASTRA DEMO" : "ASTRA DEMO", isVerified: Boolean(row.is_verified), routingCandidate: row.routing_candidate === undefined ? undefined : Boolean(row.routing_candidate), verificationStatus: row.verification_status === "verified" ? "verified" : row.verification_status === "stale" ? "expired" : row.verification_status === "rejected" ? "unknown" : undefined };
}

export async function fetchLiveHospitals(): Promise<Hospital[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("hospitals").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(toHospital);
}

export async function updateLiveHospital(id: string, update: Partial<Pick<Hospital, "readiness" | "beds" | "ambulanceAvailable">>, actorId?: string): Promise<Hospital> {
  if (!supabase) throw new Error("Supabase is not configured");
  const payload: Record<string, unknown> = { updated_by: actorId, data_last_updated: new Date().toISOString() };
  if (update.readiness) payload.readiness = update.readiness;
  if (update.ambulanceAvailable !== undefined) payload.ambulance_available = update.ambulanceAvailable;
  if (update.beds) { payload.icu_available = update.beds.icu; payload.emergency_beds_available = update.beds.emergency; payload.general_beds_available = update.beds.general; payload.ventilators_available = update.beds.ventilators; }
  const { data, error } = await supabase.from("hospitals").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  if (actorId) await supabase.from("audit_events").insert({ actor_id: actorId, entity_type: "hospital", entity_id: id, action: "update_capacity", payload });
  return toHospital(data);
}

export type FacilityRegistryRecord = { id: string; sourceName: string; sourceRecordId: string; name: string; facilityCategory: string; administrativeGroup?: string; address: string; latitude?: number; longitude?: number; mapUrl?: string; sourceUrl: string; sourceRetrievedAt: string; verificationStatus: "pending_verification" | "verified" | "rejected" | "stale" };

export async function fetchFacilityRegistry(limit = 500): Promise<FacilityRegistryRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("facility_registry").select("id,source_name,source_record_id,name,facility_category,administrative_group,address,latitude,longitude,map_url,source_url,source_retrieved_at,verification_status").order("name").limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id, sourceName: row.source_name, sourceRecordId: row.source_record_id, name: row.name, facilityCategory: row.facility_category, administrativeGroup: row.administrative_group ?? undefined, address: row.address, latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined, mapUrl: row.map_url ?? undefined, sourceUrl: row.source_url, sourceRetrievedAt: row.source_retrieved_at, verificationStatus: row.verification_status }));
}
