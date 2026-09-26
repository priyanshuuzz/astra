import { describe, expect, it, vi } from "vitest";
import React from "react";
// @ts-ignore
import { renderToString } from "react-dom/server";

const { mockSignUp, mockUpsert, mockFrom } = vi.hoisted(() => {
  const mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });
  return { mockSignUp, mockUpsert, mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: mockSignUp,
    },
    from: mockFrom,
  },
}));

import { AuthProvider, useAuth } from "../lib/auth-context";

describe("Public self-registration (signUp)", () => {
  it("strictly enforces 'patient' role even when 'admin' or 'staff' is requested", async () => {
    let authValue: ReturnType<typeof useAuth> | undefined;

    function TestComponent() {
      authValue = useAuth();
      return null;
    }

    renderToString(
      React.createElement(AuthProvider, null, React.createElement(TestComponent))
    );

    expect(authValue).toBeDefined();

    await authValue!.signUp("attacker@example.com", "securePassword123", "Attacker", "admin" as any);

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "attacker@example.com",
      password: "securePassword123",
      options: {
        data: {
          name: "Attacker",
          role: "patient",
        },
      },
    });

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpsert).toHaveBeenCalledWith({
      id: "test-user-id",
      name: "Attacker",
      role: "patient",
    });
  });
});
