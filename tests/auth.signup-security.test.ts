import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (initial: any) => [typeof initial === "function" ? initial() : initial, vi.fn()],
    useEffect: vi.fn(),
    useMemo: (factory: any) => factory(),
  };
});

vi.mock("../lib/supabase", () => {
  const mockSignUp = vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-id" } },
    error: null,
  });
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        signUp: mockSignUp,
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    },
  };
});

import { supabase } from "../lib/supabase";
import { AuthProvider } from "../lib/auth-context";

describe("Auth Sign-Up Security", () => {
  it("prevents privilege escalation by restricting assigned role to 'patient'", async () => {
    const mockSignUp = supabase?.auth.signUp as ReturnType<typeof vi.fn>;
    const mockFrom = supabase?.from as ReturnType<typeof vi.fn>;

    // Instantiate AuthProvider component function with mocked hooks
    const element = AuthProvider({ children: null });
    const authContextValue = element.props.value;

    expect(authContextValue).toBeDefined();

    // Invoke the actual signUp implementation from AuthProvider with requested role 'admin'
    await authContextValue.signUp("test@example.com", "password123", "Test Admin", "admin");

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      options: {
        data: {
          name: "Test Admin",
          role: "patient",
        },
      },
    });

    const upsertSpy = mockFrom("profiles").upsert;
    expect(upsertSpy).toHaveBeenCalledWith({
      id: "test-user-id",
      name: "Test Admin",
      role: "patient",
    });
  });
});
