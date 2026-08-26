import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

type RegistryFile = { source_url: string; records: Array<Record<string, unknown>> };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (process.env.ASTRA_IMPORT_REAL_DATA !== "1") throw new Error("Refusing to import. Set ASTRA_IMPORT_REAL_DATA=1 explicitly.");
if (!url || !serviceKey) throw new Error("Requires EXPO_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY.");
const payload = JSON.parse(await readFile("data/real/hyderabad-government-facilities.json", "utf8")) as RegistryFile;
const client = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: run, error: runError } = await client.from("facility_import_runs").insert({ source_name: "Hyderabad District Government of Telangana", source_url: payload.source_url, status: "running" }).select("id").single();
if (runError || !run) throw new Error(`Could not start import run: ${runError?.message ?? "unknown error"}`);
try {
  const { error } = await client.from("facility_registry").upsert(payload.records, { onConflict: "source_name,source_record_id" });
  if (error) throw error;
  await client.from("facility_import_runs").update({ records_seen: payload.records.length, records_upserted: payload.records.length, status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
  console.log(`Imported ${payload.records.length} facility records; all remain pending_verification until authorized review.`);
} catch (error) {
  await client.from("facility_import_runs").update({ records_seen: payload.records.length, status: "failed", error_message: error instanceof Error ? error.message : String(error), completed_at: new Date().toISOString() }).eq("id", run.id);
  throw error;
}
