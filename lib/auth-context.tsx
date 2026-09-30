import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthValue = { user: User | null; session: Session | null; loading: boolean; configured: boolean; signIn: (email: string, password: string) => Promise<{ error?: string }>; signUp: (email: string, password: string, name: string, role?: "patient") => Promise<{ error?: string }>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | undefined>(undefined);

export async function performSignUp(email: string, password: string, name: string, _role?: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase is not configured." };
  // Public self-registration must strictly restrict assigned role to 'patient' to prevent privilege escalation
  const role = "patient";
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name, role } } });
  if (error) return { error: error.message };
  if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, name, role });
  return {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: Boolean(supabase),
    signIn: async (email, password) => {
      if (!supabase) return { error: "Supabase is not configured." };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? { error: error.message } : {};
    },
    signUp: (email, password, name, role) => performSignUp(email, password, name, role),
    signOut: async () => { if (supabase) await supabase.auth.signOut(); },
  }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
