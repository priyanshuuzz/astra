import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusPill } from "@/components/astra/ui";
import type { RankedHospital } from "@/types/astra";
import { ProvenancePanel } from "@/components/astra/provenance-panel";

// ⚡ Optimization: Memoize HospitalCard to prevent unnecessary re-renders when parent components
// (such as HospitalsScreen search or RecommendationScreen countdown timers) re-render.
// Skips re-renders for unchanged hospital items in FlatList, improving list responsiveness.
export const HospitalCard = memo(function HospitalCard({ item, emphasis = false, onPress }: { item: RankedHospital; emphasis?: boolean; onPress?: () => void }) {
  const router = useRouter();
  const { hospital, score } = item;
  const ageMinutes = Math.max(1, Math.round((Date.now() - new Date(hospital.dataLastUpdated).getTime()) / 60_000));
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${hospital.name}`} onPress={onPress ?? (() => router.push((`/hospitals/${hospital.id}`) as never))} style={({ pressed }) => [styles.card, emphasis && styles.emphasis, pressed && { opacity: 0.75 }]}>
    <View style={styles.topRow}><View style={{ flex: 1, paddingRight: 8 }}><Text style={styles.name}>{hospital.name}</Text><Text style={styles.address}>{hospital.type} · {hospital.address}</Text></View><StatusPill status={hospital.readiness} /></View>
    <View style={styles.metrics}><View style={styles.item}><MaterialIcons name="near-me" size={16} color="#0B78C6" /><Text style={styles.metric}>{score.distanceKm} km</Text></View><View style={styles.item}><MaterialIcons name="schedule" size={16} color="#0B78C6" /><Text style={styles.metric}>{score.etaMinutes} min ETA</Text></View><View style={styles.item}><MaterialIcons name="verified" size={16} color="#1E7A52" /><Text style={styles.metric}>{score.eligible ? "Capability fit" : "Excluded"}</Text></View></View><Text style={styles.capability}>{score.reasons[0]}</Text>
    <ProvenancePanel hospital={hospital} capability={score.eligible ? score.reasons[0] : "Clinical gate"} />
    <View style={styles.bottomRow}><View style={styles.freshness}><MaterialIcons name={ageMinutes <= 5 ? "verified" : "history"} size={14} color={ageMinutes <= 5 ? "#1E7A52" : "#A86A00"} /><Text style={styles.freshnessText}>{ageMinutes <= 5 ? "FRESH" : ageMinutes <= 30 ? "AGEING" : "STALE"} · {ageMinutes} min ago · SIMULATED</Text></View><View style={styles.score}><Text style={styles.scoreValue}>{score.overall}%</Text><Text style={styles.scoreLabel}>match</Text></View></View>
  </Pressable>;
});

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#E4EBF1", shadowColor: "#0B2942", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  emphasis: { borderColor: "#79B9E6", borderWidth: 1.5, backgroundColor: "#FBFDFF" },
  topRow: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: "#0B2942", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  address: { color: "#536273", fontSize: 11, lineHeight: 16, marginTop: 3 },
  metrics: { flexDirection: "row", gap: 15, paddingVertical: 14, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#EDF2F6" },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  metric: { color: "#294155", fontSize: 12, fontWeight: "700" },
  capability: { color: "#0B5E9A", backgroundColor: "#EAF4FC", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 10, fontWeight: "800" },
  bottomRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  freshness: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  freshnessText: { color: "#536273", fontSize: 11, fontWeight: "600" },
  score: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  scoreValue: { color: "#0B78C6", fontSize: 18, fontWeight: "900" },
  scoreLabel: { color: "#536273", fontSize: 11, fontWeight: "700" },
});

