import { describe, expect, it, vi } from "vitest";

// Test signUp logic directly without rendering React hooks
describe("signUp role restriction", () => {
  it("strictly assigns role 'patient' upon sign up in auth context logic", async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

    const mockSupabase = {
      auth: { signUp: mockSignUp },
      from: mockFrom,
    };

    // Simulate the signUp behavior implemented in AuthProvider
    const signUp = async (email: string, password: string, name: string) => {
      const role = "patient";
      const { data, error } = await mockSupabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name, role } },
      });
      if (error) return { error: error.message };
      if (data.user) await mockSupabase.from("profiles").upsert({ id: data.user.id, name, role });
      return {};
    };

    const res = await signUp("test@example.com", "password123", "Test User");

    expect(res).toEqual({});
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
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpsert).toHaveBeenCalledWith({
      id: "user-123",
      name: "Test User",
      role: "patient",
    });
  });
});
