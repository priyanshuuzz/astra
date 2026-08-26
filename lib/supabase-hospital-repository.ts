import { supabase } from "@/lib/supabase";
import type { Hospital } from "@/types/astra";

function toHospital(row: any): Hospital {
  return { id: row.id, name: row.name, type: row.type, address: row.address, phone: row.phone, location: { latitude: row.latitude, longitude: row.longitude, label: row.name }, readiness: row.readiness, beds: { icu: row.icu_available, emergency: row.emergency_beds_available, general: row.general_beds_available, ventilators: row.ventilators_available }, specialties: row.specialties ?? [], facilities: row.facilities ?? [], specialists: [], ambulanceAvailable: row.ambulance_available, traffic: row.traffic, dataLastUpdated: row.data_last_updated, dataSource: "ASTRA DEMO", isVerified: row.is_verified };
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
