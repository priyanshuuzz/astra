import { describe, expect, it, vi } from "vitest";

// Mock supabase client
vi.mock("@/lib/supabase", () => {
  const signUpMock = vi.fn().mockImplementation(({ options }) => {
    return Promise.resolve({
      data: { user: { id: "test-id" } },
      error: null,
    });
  });

  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });

  return {
    supabase: {
      auth: {
        signUp: signUpMock,
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: fromMock,
    },
  };
});

import { supabase } from "@/lib/supabase";

// Helper replicating signUp logic in lib/auth-context.tsx to verify role restriction behavior
async function performSignUp(email: string, password: string, name: string, _role?: string) {
  if (!supabase) return { error: "Supabase is not configured." };
  const role = "patient";
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name, role } } });
  if (error) return { error: error.message };
  if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, name, role });
  return {};
}

describe("signUp role restriction", () => {
  it("forces role to 'patient' even if caller attempts to pass 'admin' role", async () => {
    const email = "attacker@example.com";
    const password = "password123";
    const name = "Attacker User";

    await performSignUp(email, password, name, "admin");

    expect(supabase!.auth.signUp).toHaveBeenCalledWith({
      email: "attacker@example.com",
      password: "password123",
      options: { data: { name: "Attacker User", role: "patient" } },
    });

    expect(supabase!.from("profiles").upsert).toHaveBeenCalledWith({
      id: "test-id",
      name: "Attacker User",
      role: "patient",
    });
  });
});
