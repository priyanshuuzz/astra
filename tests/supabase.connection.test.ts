import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it.runIf(!!process.env.EXPO_PUBLIC_SUPABASE_URL)("can reach the configured Auth settings endpoint", async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
    expect(url, "EXPO_PUBLIC_SUPABASE_URL must be configured").toBeTruthy();
    expect(key, "EXPO_PUBLIC_SUPABASE_KEY must be configured").toBeTruthy();
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key as string } });
    expect(response.ok, `Supabase returned HTTP ${response.status}`).toBe(true);
  }, 15_000);
});
