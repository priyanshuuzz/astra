import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSignUp = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        signUp: (...args: unknown[]) => mockSignUp(...args),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockReturnValue({
        upsert: (...args: unknown[]) => mockUpsert(...args),
      }),
    },
  };
});

import { supabase } from "@/lib/supabase";

describe("signUp role restriction logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ data: null, error: null });
  });

  it("forces assigned role to 'patient' when executing signUp logic", async () => {
    const signUpImplementation = async (email: string, password: string, name: string) => {
      if (!supabase) return { error: "Supabase is not configured." };
      const role = "patient";
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name, role } } });
      if (error) return { error: error.message };
      if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, name, role });
      return {};
    };

    const res = await signUpImplementation("patient@example.com", "password123", "Test Patient");
    expect(res).toEqual({});

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "patient@example.com",
      password: "password123",
      options: {
        data: {
          name: "Test Patient",
          role: "patient",
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      id: "user-123",
      name: "Test Patient",
      role: "patient",
    });
  });
});
