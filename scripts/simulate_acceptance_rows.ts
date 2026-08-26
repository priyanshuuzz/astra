import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (process.env.ASTRA_SIMULATE_REALTIME !== "1") throw new Error("Refusing to simulate rows. Set ASTRA_SIMULATE_REALTIME=1 explicitly.");
if (!url || !serviceKey) throw new Error("This script requires EXPO_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY; never place the service key in the mobile app.");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const emergencyId = process.env.ASTRA_EMERGENCY_ID ?? `sim-${Date.now()}`;
const hospitalIds = (process.env.ASTRA_HOSPITAL_IDS ?? "hospital-1,hospital-2,hospital-3").split(",").filter(Boolean);
const statuses = ["pending", "accepted", "declined", "timeout", "assigned_elsewhere"] as const;
const started = new Date().toISOString();

for (const [index, status] of statuses.entries()) {
  const { error } = await supabase.from("acceptance_requests").insert({ id: `${emergencyId}-${status}`, emergency_id: emergencyId, hospital_id: hospitalIds[index % hospitalIds.length], status, sent_at: started, responded_at: status === "pending" ? null : new Date(Date.now() + index * 1000).toISOString(), decline_reason: status === "declined" ? "capacity_full" : null, decline_notes: status === "declined" ? "Realtime simulator decline" : null, responder_name: status === "accepted" ? "Coordinator simulator" : null });
  if (error) throw new Error(`Failed to insert ${status}: ${error.message}`);
  console.log(`Inserted ${status} acceptance row for ${emergencyId}`);
}
console.log(`Listen on the coordinator dashboard for ${emergencyId}; remove simulator rows manually after verification.`);
