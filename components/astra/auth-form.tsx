import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { PrimaryButton } from "@/components/astra/ui";

export function AuthForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("patient@astra.demo");
  const [password, setPassword] = useState("demo-password");
  const [name, setName] = useState("Demo patient");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }
    setBusy(true);
    const result = mode === "sign-in" ? await signIn(email, password) : await signUp(email, password, name, "patient");
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace("/" as never);
  };

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Text style={styles.title}>{mode === "sign-in" ? "Sign in to ASTRA" : "Create your ASTRA account"}</Text>
      <Text style={styles.subtitle}>Secure access for synced emergency sessions and hospital coordination.</Text>
      {mode === "sign-up" && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor="#8A98A6"
          style={styles.input}
          autoCapitalize="words"
          autoComplete="name"
          accessibilityLabel="Full name"
        />
      )}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        placeholderTextColor="#8A98A6"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        accessibilityLabel="Email address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8A98A6"
        style={styles.input}
        secureTextEntry
        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        accessibilityLabel="Password"
      />
      {error && (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {!configured && (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          Supabase configuration is unavailable. Use the local demo mode.
        </Text>
      )}
      <PrimaryButton
        label={busy ? "Connecting…" : mode === "sign-in" ? "Sign in" : "Create account"}
        onPress={submit}
        disabled={busy || !configured}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode === "sign-in" ? "New to ASTRA? Create an account" : "Already have an account? Sign in"}
        onPress={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError("");
        }}
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.switch}>
          {mode === "sign-in" ? "New to ASTRA? Create an account" : "Already have an account? Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 20, padding: 18, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  compact: { margin: 0 },
  title: { color: "#0B2942", fontSize: 20, fontWeight: "900" },
  subtitle: { color: "#536273", fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 14 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#D7E2EA", borderRadius: 12, paddingHorizontal: 13, color: "#0B2942", fontSize: 13, marginBottom: 10, backgroundColor: "#FBFDFF" },
  error: { color: "#B4232E", fontSize: 11, lineHeight: 16, marginBottom: 10 },
  switch: { color: "#0B78C6", textAlign: "center", fontSize: 12, fontWeight: "800", marginTop: 15 },
});
