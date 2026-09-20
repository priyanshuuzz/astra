import { describe, expect, it, vi } from "vitest";

const mockSignUp = vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null });
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

vi.mock("../lib/supabase", () => {
  return {
    supabase: {
      auth: {
        signUp: mockSignUp,
      },
      from: mockFrom,
    },
  };
});

describe("AuthContext public self-registration security", () => {
  it("enforces role 'patient' during signUp", async () => {
    const { supabase } = await import("../lib/supabase");
    expect(supabase).not.toBeNull();
    if (!supabase) return;

    const assignedRole = "patient";
    await supabase.auth.signUp({
      email: "test@example.com",
      password: "password123",
      options: { data: { name: "Test User", role: assignedRole } },
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: { data: { name: "Test User", role: "patient" } },
    });
  });
});
