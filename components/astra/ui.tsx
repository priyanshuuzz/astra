import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import type { Readiness } from "@/types/astra";

export function AstraScreen({ children, back = false, title }: { children: ReactNode; back?: boolean; title?: string }) {
  const router = useRouter();
  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]}>
      {(back || title) && <View style={styles.topbar}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color="#0B2942" /></Pressable> : <View style={styles.iconButton} />}
        {title ? <Text style={styles.topTitle}>{title}</Text> : <View />}
        <View style={styles.iconButton} />
      </View>}
      {children}
    </ScreenContainer>
  );
}

export function DemoPill() {
  return <View style={styles.demoPill}><MaterialIcons name="science" size={13} color="#0B5E9A" /><Text style={styles.demoText}>DEMO DATA</Text></View>;
}

export function StatusPill({ status, label }: { status: Readiness; label?: string }) {
  const detail = { ready: { text: label ?? "Ready", color: "#1E7A52", bg: "#E9F7F0", icon: "check-circle" }, limited: { text: label ?? "Limited", color: "#A86A00", bg: "#FFF6E1", icon: "error-outline" }, unavailable: { text: label ?? "Unavailable", color: "#B4232E", bg: "#FDECEE", icon: "cancel" }, unknown: { text: label ?? "Unknown", color: "#536273", bg: "#EEF1F4", icon: "help-outline" } }[status];
  return <View style={[styles.statusPill, { backgroundColor: detail.bg }]}><MaterialIcons name={detail.icon as never} size={14} color={detail.color} /><Text style={[styles.statusText, { color: detail.color }]}>{detail.text}</Text></View>;
}

export function PrimaryButton({ label, onPress, tone = "blue", icon, disabled = false, accessibilityHint }: { label: string; onPress: () => void; tone?: "blue" | "sos" | "quiet"; icon?: keyof typeof MaterialIcons.glyphMap; disabled?: boolean; accessibilityHint?: string }) {
  const colors = tone === "sos" ? { bg: "#C82E38", text: "#FFFFFF" } : tone === "quiet" ? { bg: "#EAF3FA", text: "#0B5E9A" } : { bg: "#0B78C6", text: "#FFFFFF" };
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={() => { haptic.light(); onPress(); }} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.bg }, (pressed || disabled) && styles.pressed, disabled && { opacity: 0.5 }]}><View style={styles.buttonContent}>{icon && <MaterialIcons name={icon} size={19} color={colors.text} />}<Text style={[styles.buttonText, { color: colors.text }]}>{label}</Text></View></Pressable>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <View style={styles.sectionHeading}><View style={{ flex: 1 }}>{eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}<Text style={styles.sectionTitle}>{title}</Text></View>{action}</View>;
}

export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  return <View style={[styles.notice, compact && { marginHorizontal: 0, marginTop: 10 }]}><MaterialIcons name="local-hospital" size={18} color="#A86A00" /><Text style={styles.noticeText}>In a life-threatening emergency, contact your local emergency service immediately.</Text></View>;
}

export function Metric({ label, value, icon, tint = "#0B78C6" }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap; tint?: string }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${tint}16` }]}><MaterialIcons name={icon} size={18} color={tint} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  topbar: { minHeight: 54, paddingHorizontal: 18, alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F8FB" },
  topTitle: { color: "#0B2942", fontSize: 16, fontWeight: "700" },
  demoPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#EAF4FC", borderRadius: 99 },
  demoText: { color: "#0B5E9A", fontSize: 10, letterSpacing: 0.7, fontWeight: "800" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  statusText: { fontWeight: "800", fontSize: 12 },
  primaryButton: { minHeight: 52, justifyContent: "center", paddingHorizontal: 18, borderRadius: 15 },
  buttonContent: { alignItems: "center", justifyContent: "center", gap: 8, flexDirection: "row" },
  buttonText: { fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 26, marginBottom: 12 },
  eyebrow: { color: "#0B78C6", fontSize: 11, letterSpacing: 0.8, fontWeight: "800", textTransform: "uppercase", marginBottom: 2 },
  sectionTitle: { color: "#0B2942", fontSize: 20, lineHeight: 25, fontWeight: "800" },
  notice: { marginHorizontal: 20, marginTop: 14, padding: 12, borderRadius: 13, backgroundColor: "#FFF6E1", flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noticeText: { flex: 1, color: "#795200", fontSize: 12, lineHeight: 17, fontWeight: "600" },
  metric: { flex: 1, minHeight: 98, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 12, borderWidth: 1, borderColor: "#E4EBF1" },
  metricIcon: { height: 30, width: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  metricValue: { color: "#0B2942", fontSize: 18, lineHeight: 22, fontWeight: "800" },
  metricLabel: { color: "#536273", fontSize: 11, lineHeight: 15, fontWeight: "600", marginTop: 2 },
});

export const uiStyles = styles;

