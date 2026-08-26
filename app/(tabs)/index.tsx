import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { HospitalCard } from "@/components/astra/hospital-card";
import { AstraScreen, DemoPill, PrimaryButton, SafetyNotice, SectionHeading, uiStyles } from "@/components/astra/ui";
import { useAstra } from "@/lib/astra/store";
import { useAuth } from "@/lib/auth-context";
import { AuthForm } from "@/components/astra/auth-form";
import { HospitalRecommendationEngine } from "@/lib/astra/recommendation";
import type { EmergencyType } from "@/types/astra";

const emergencyShortcuts: { type: EmergencyType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { type: "cardiac", label: "Cardiac", icon: "favorite" },
  { type: "stroke", label: "Stroke", icon: "psychology" },
  { type: "trauma", label: "Trauma", icon: "car-crash" },
  { type: "respiratory", label: "Breathing", icon: "air" },
  { type: "pediatric", label: "Pediatric", icon: "child-care" },
  { type: "obstetric", label: "Obstetric", icon: "pregnant-woman" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { hasOnboarded, isDemoMode, completeOnboarding, enterDemoMode, hospitals, currentLocation, activeEmergency, role, setRole, beginEmergency } = useAstra();
  const { user, loading: authLoading } = useAuth();
  const engine = useMemo(() => new HospitalRecommendationEngine(), []);
  const nearby = useMemo(() => engine.rank("general", currentLocation, hospitals).slice(0, 3), [currentLocation, hospitals, engine]);

  if (!hasOnboarded) {
    return <AstraScreen><View style={styles.onboarding}><View style={styles.brandMark}><MaterialIcons name="local-hospital" size={32} color="#FFFFFF" /></View><Text style={styles.brand}>ASTRA</Text><Text style={styles.tagline}>The right hospital.{"\n"}The fastest route.</Text><Text style={styles.intro}>A clear, coordinated path to emergency care using simulated availability, travel time, and clinical capability data.</Text><View style={styles.onboardSteps}><View style={styles.step}><Text style={styles.stepNumber}>01</Text><View><Text style={styles.stepTitle}>Find the right hospital instantly</Text><Text style={styles.stepBody}>See capability and capacity in one place.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>02</Text><View><Text style={styles.stepTitle}>Know before you go</Text><Text style={styles.stepBody}>Freshness labels make uncertainty visible.</Text></View></View><View style={styles.step}><Text style={styles.stepNumber}>03</Text><View><Text style={styles.stepTitle}>Get there faster</Text><Text style={styles.stepBody}>Coordinate routes, ambulances, and contacts.</Text></View></View></View><SafetyNotice compact /><PrimaryButton label="Enable location & get started" icon="my-location" onPress={completeOnboarding} /><Text style={styles.disclaimer}>ASTRA is a demo coordination tool, not a diagnostic system or emergency service.</Text></View></AstraScreen>;
  }

  if (!authLoading && !user && !isDemoMode) return <AstraScreen><ScrollView contentContainerStyle={styles.content}><View style={styles.authGate}><Text style={styles.authEyebrow}>SECURE ACCESS</Text><Text style={styles.authTitle}>Sign in to sync ASTRA</Text><Text style={styles.authBody}>Your authenticated session connects emergency coordination and authorized hospital operations to Supabase.</Text><AuthForm compact /><PrimaryButton label="Continue in demo mode" tone="quiet" icon="science" onPress={enterDemoMode} /><Text style={styles.localDemo}>Demo mode uses local data and never requires an account.</Text></View></ScrollView></AstraScreen>;

  return <AstraScreen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><View style={styles.logoRow}><View style={styles.logoMini}><MaterialIcons name="local-hospital" size={18} color="#FFFFFF" /></View><Text style={styles.logoText}>ASTRA</Text><DemoPill /></View><View style={styles.locationRow}><MaterialIcons name="location-on" size={15} color="#0B78C6" /><Text style={styles.location}>{currentLocation.label}</Text><MaterialIcons name="keyboard-arrow-down" size={16} color="#536273" /></View></View><Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push("/profile" as never)} style={({ pressed }) => [styles.profileButton, pressed && uiStyles.pressed]}><MaterialIcons name="person-outline" size={21} color="#0B2942" /></Pressable></View>
    <SafetyNotice />
    <View style={styles.sosCard}><View style={styles.sosIcon}><MaterialIcons name="emergency" size={28} color="#FFFFFF" /></View><View style={{ flex: 1 }}><Text style={styles.sosEyebrow}>NEED HELP NOW?</Text><Text style={styles.sosTitle}>Start an emergency session</Text><Text style={styles.sosBody}>ASTRA will identify nearby hospitals and explain the best match.</Text></View><PrimaryButton label="SOS" tone="sos" icon="bolt" onPress={() => router.push("/sos" as never)} /></View>
    {activeEmergency && <Pressable onPress={() => router.push("/emergency" as never)} style={styles.activeBanner}><View style={styles.activeDot} /><View style={{ flex: 1 }}><Text style={styles.activeTitle}>Emergency session active</Text><Text style={styles.activeBody}>{activeEmergency.id} · Tap to view status</Text></View><MaterialIcons name="chevron-right" size={22} color="#0B5E9A" /></Pressable>}
    <SectionHeading title="Quick emergency type" action={<Text style={styles.viewAll}>All types</Text>} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutRow}>{emergencyShortcuts.map((item) => <Pressable key={item.type} accessibilityRole="button" accessibilityLabel={`Start ${item.label} emergency`} onPress={() => { const session = beginEmergency(item.type); router.push({ pathname: "/recommendation", params: { emergencyId: session.id } } as never); }} style={({ pressed }) => [styles.shortcut, pressed && uiStyles.pressed]}><View style={styles.shortcutIcon}><MaterialIcons name={item.icon} size={20} color="#0B78C6" /></View><Text style={styles.shortcutLabel}>{item.label}</Text></Pressable>)}</ScrollView>
    <View style={styles.searchRow}><MaterialIcons name="search" size={21} color="#536273" /><Text style={styles.searchText}>Search hospitals, specialties…</Text><Pressable onPress={() => router.push("/hospitals" as never)}><MaterialIcons name="tune" size={21} color="#0B78C6" /></Pressable></View>
    <View style={styles.metricsRow}><View style={styles.metric}><Text style={styles.metricValue}>{hospitals.length}</Text><Text style={styles.metricLabel}>Hospitals connected</Text></View><View style={styles.metric}><Text style={styles.metricValue}>18</Text><Text style={styles.metricLabel}>ICU beds nearby</Text></View><View style={styles.metric}><Text style={styles.metricValue}>6 min</Text><Text style={styles.metricLabel}>Avg. response</Text></View></View><View style={styles.operationsRow}><PrimaryButton label="Refer patient" icon="assignment" tone="quiet" onPress={() => router.push("/referral" as never)} /><PrimaryButton label="Crew mode" icon="local-shipping" tone="quiet" onPress={() => setRole("crew")} /></View>
    <SectionHeading eyebrow="NEARBY · {currentLocation.label}" title="Emergency hospitals" action={<Pressable onPress={() => router.push("/hospitals" as never)}><Text style={styles.viewAll}>See all</Text></Pressable>} />
    <FlatList data={nearby} scrollEnabled={false} keyExtractor={(item) => item.hospital.id} renderItem={({ item, index }) => <HospitalCard item={item} emphasis={index === 0} />} />
    <View style={styles.roleSwitcher}><Text style={styles.roleTitle}>Demo role</Text><View style={styles.roleRow}>{(["patient", "staff", "admin"] as const).map((item) => <Pressable key={item} onPress={() => { setRole(item); router.push((item === "patient" ? "/" : item === "staff" ? "/staff" : "/admin") as never); }} style={[styles.roleChip, role === item && styles.roleChipActive]}><Text style={[styles.roleChipText, role === item && styles.roleChipTextActive]}>{item === "patient" ? "Patient" : item === "staff" ? "Hospital staff" : "Administrator"}</Text></Pressable>)}</View></View>
    <Text style={styles.footer}>Simulated hospital, ambulance, and traffic data · ASTRA DEMO MODE</Text>
  </ScrollView></AstraScreen>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  onboarding: { flex: 1, paddingHorizontal: 24, paddingTop: 34, justifyContent: "center" },
  brandMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#0B78C6", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  brand: { color: "#0B2942", fontSize: 30, fontWeight: "900", letterSpacing: 2 },
  tagline: { color: "#0B2942", fontSize: 28, lineHeight: 34, fontWeight: "800", marginTop: 20 },
  intro: { color: "#536273", fontSize: 14, lineHeight: 21, marginTop: 16, maxWidth: 330 },
  onboardSteps: { marginTop: 28, gap: 16 },
  step: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  stepNumber: { color: "#0B78C6", fontSize: 12, fontWeight: "900", letterSpacing: 1, paddingTop: 2 },
  stepTitle: { color: "#0B2942", fontSize: 14, fontWeight: "800" },
  stepBody: { color: "#536273", fontSize: 12, marginTop: 3 },
  disclaimer: { color: "#748395", textAlign: "center", fontSize: 11, lineHeight: 16, marginTop: 12 },
  header: { paddingHorizontal: 20, paddingTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoMini: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#0B78C6", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#0B2942", fontSize: 20, fontWeight: "900", letterSpacing: 1.5, marginRight: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  location: { color: "#536273", fontSize: 11, fontWeight: "600", maxWidth: 205 },
  profileButton: { width: 42, height: 42, backgroundColor: "#FFFFFF", borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E4EBF1" },
  sosCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, backgroundColor: "#0B2942", padding: 18, flexDirection: "row", gap: 12, alignItems: "center" },
  sosIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#C82E38", alignItems: "center", justifyContent: "center" },
  sosEyebrow: { color: "#8DC7EE", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  sosTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginTop: 3 },
  sosBody: { color: "#B9CBD7", fontSize: 11, lineHeight: 16, marginTop: 3 },
  activeBanner: { marginHorizontal: 20, marginTop: 12, padding: 13, borderRadius: 14, backgroundColor: "#EAF4FC", flexDirection: "row", alignItems: "center", gap: 10 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#C82E38" },
  activeTitle: { color: "#0B5E9A", fontSize: 13, fontWeight: "800" },
  activeBody: { color: "#536273", fontSize: 11, marginTop: 2 },
  viewAll: { color: "#0B78C6", fontSize: 12, fontWeight: "800" },
  shortcutRow: { paddingHorizontal: 20, gap: 10 },
  shortcut: { width: 82, alignItems: "center", paddingVertical: 4 },
  shortcutIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  shortcutLabel: { color: "#294155", fontSize: 11, fontWeight: "700", marginTop: 7 },
  searchRow: { marginHorizontal: 20, marginTop: 24, backgroundColor: "#FFFFFF", borderRadius: 14, minHeight: 50, alignItems: "center", paddingHorizontal: 15, flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "#E4EBF1" },
  searchText: { flex: 1, color: "#748395", fontSize: 13 },
  metricsRow: { flexDirection: "row", gap: 9, marginHorizontal: 20, marginTop: 16 },
  operationsRow: { flexDirection: "row", gap: 9, marginHorizontal: 20, marginTop: 12 },
  metric: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  metricValue: { color: "#0B2942", fontSize: 17, fontWeight: "900" },
  metricLabel: { color: "#536273", fontSize: 10, lineHeight: 14, marginTop: 3, fontWeight: "600" },
  roleSwitcher: { marginHorizontal: 20, marginTop: 25, padding: 14, borderRadius: 16, backgroundColor: "#EAF4FC" },
  roleTitle: { color: "#0B2942", fontSize: 12, fontWeight: "800", marginBottom: 9 },
  roleRow: { flexDirection: "row", gap: 6 },
  roleChip: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 9, backgroundColor: "#FFFFFF" },
  roleChipActive: { backgroundColor: "#0B78C6" },
  roleChipText: { color: "#536273", fontSize: 10, fontWeight: "800" },
  roleChipTextActive: { color: "#FFFFFF" },
  footer: { color: "#8A98A6", fontSize: 10, textAlign: "center", marginTop: 21, paddingHorizontal: 20 },
  authGate: { paddingTop: 50, paddingHorizontal: 20 },
  authEyebrow: { color: "#0B78C6", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  authTitle: { color: "#0B2942", fontSize: 28, lineHeight: 34, fontWeight: "900", marginTop: 10 },
  authBody: { color: "#536273", fontSize: 13, lineHeight: 19, marginTop: 8 },
  localDemo: { color: "#748395", textAlign: "center", fontSize: 11, marginTop: 12 },
});
