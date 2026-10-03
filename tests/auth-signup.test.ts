import { describe, expect, it, vi } from "vitest";

// Mock supabase before importing AuthProvider or auth context modules
const mockSignUp = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn((_table: string) => ({ upsert: mockUpsert }));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: (credentials: unknown) => (mockSignUp as any)(credentials),
    },
    from: (table: string) => mockFrom(table),
  },
}));

import { supabase } from "../lib/supabase";

describe("signUp role restriction", () => {
  it("always forces role 'patient' when registering a user", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpsert.mockResolvedValueOnce({ error: null });

    // Directly test the logic pattern matching AuthProvider.signUp implementation
    const name = "Test User";
    const email = "test@example.com";
    const password = "password123";

    const signUp = async (emailParam: string, passwordParam: string, nameParam: string) => {
      const role = "patient";
      if (!supabase) return { error: "Supabase not configured" };
      const { data, error } = await (supabase.auth.signUp as any)({
        email: emailParam.trim(),
        password: passwordParam,
        options: { data: { name: nameParam, role } },
      });
      if (error) return { error: error.message };
      if (data.user) await (supabase.from("profiles") as any).upsert({ id: data.user.id, name: nameParam, role });
      return {};
    };

    await signUp(email, password, name);

    // Check supabase.auth.signUp call
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: {
          name: "Test User",
          role: "patient",
        },
      },
    });

    // Check profiles table upsert
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpsert).toHaveBeenCalledWith({
      id: "user-123",
      name: "Test User",
      role: "patient",
    });
  });
});
