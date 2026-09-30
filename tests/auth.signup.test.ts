import { describe, expect, it, vi, beforeEach } from "vitest";

const { signUpMock, upsertMock } = vi.hoisted(() => ({
  signUpMock: vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-123" } },
    error: null,
  }),
  upsertMock: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      upsert: (...args: unknown[]) => upsertMock(...args),
    }),
  },
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      upsert: (...args: unknown[]) => upsertMock(...args),
    }),
  },
}));

import { performSignUp } from "../lib/auth-context";

describe("Public self-registration (performSignUp) security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strictly enforces 'patient' role when performSignUp is called from lib/auth-context", async () => {
    // Call performSignUp with an attempt to pass 'admin' role
    await performSignUp("attacker@example.com", "password123", "Attacker", "admin");

    expect(signUpMock).toHaveBeenCalledWith({
      email: "attacker@example.com",
      password: "password123",
      options: { data: { name: "Attacker", role: "patient" } },
    });
    expect(upsertMock).toHaveBeenCalledWith({
      id: "test-user-123",
      name: "Attacker",
      role: "patient",
    });
  });
});
