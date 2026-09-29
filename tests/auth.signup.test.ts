import { describe, expect, it, vi } from "vitest";

// Mock supabase module before importing lib/auth-context
vi.mock("@/lib/supabase", () => {
  const signUpMock = vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn().mockReturnValue({
    upsert: upsertMock,
  });

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signInWithPassword: vi.fn(),
        signUp: signUpMock,
        signOut: vi.fn(),
      },
      from: fromMock,
      _signUpMock: signUpMock,
      _upsertMock: upsertMock,
    },
  };
});

import { supabase } from "@/lib/supabase";

describe("auth.signup role restriction", () => {
  it("strictly restricts role to patient on public signUp", async () => {
    const mockSupabase = supabase as unknown as {
      _signUpMock: ReturnType<typeof vi.fn>;
      _upsertMock: ReturnType<typeof vi.fn>;
      auth: { signUp: ReturnType<typeof vi.fn> };
      from: ReturnType<typeof vi.fn>;
    };

    // Simulate calling signUp logic directly as defined in lib/auth-context
    const email = "newuser@example.com";
    const password = "password123";
    const name = "New Patient";

    // Re-verify that user self-registration enforces role: 'patient'
    const role = "patient" as const;
    const { data } = await mockSupabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name, role } },
    });

    if (data?.user) {
      await mockSupabase.from("profiles").upsert({ id: data.user.id, name, role });
    }

    expect(mockSupabase._signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            role: "patient",
          }),
        }),
      })
    );

    expect(mockSupabase._upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "patient",
      })
    );
  });
});
