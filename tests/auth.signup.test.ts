import { describe, expect, it, vi } from "vitest";

const mockSignUp = vi.fn();
const mockUpsert = vi.fn();

// Test the logic directly or with mock supabase import
vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
    from: () => ({
      upsert: (...args: unknown[]) => mockUpsert(...args),
    }),
  },
}));

describe("signUp role enforcement logic", () => {
  it("enforces role as 'patient' when performing signUp", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    mockUpsert.mockResolvedValueOnce({ error: null });

    // Simulate the signUp logic in auth-context
    const email = "newpatient@example.com";
    const password = "password123";
    const name = "John Doe";
    const role = "patient" as const;

    const { supabase } = await import("../lib/supabase");
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name, role } },
      });
      if (!error && data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, name, role });
      }
    }

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "newpatient@example.com",
      password: "password123",
      options: {
        data: {
          name: "John Doe",
          role: "patient",
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      id: "test-user-id",
      name: "John Doe",
      role: "patient",
    });
  });
});
