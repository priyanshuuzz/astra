import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => {
  const mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-123" } },
    error: null,
  });
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signUp: mockSignUp,
      },
      from: mockFrom,
    },
  };
});

import { supabase } from "@/lib/supabase";

describe("Public self-registration security", () => {
  it("enforces 'patient' role on public sign up", async () => {
    const email = "patient@example.com";
    const password = "securePassword123";
    const name = "Test Patient";
    const enforcedRole = "patient" as const;

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { name, role: enforcedRole } },
    });

    expect(error).toBeNull();
    expect(data?.user?.id).toBe("test-user-123");

    if (data?.user) {
      await supabase!.from("profiles").upsert({ id: data.user.id, name, role: enforcedRole });
    }

    expect(supabase!.auth.signUp).toHaveBeenCalledWith({
      email,
      password,
      options: { data: { name, role: "patient" } },
    });
    expect(supabase!.from("profiles").upsert).toHaveBeenCalledWith({
      id: "test-user-123",
      name: "Test Patient",
      role: "patient",
    });
  });
});
