import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusPill } from "@/components/astra/ui";
import type { RankedHospital } from "@/types/astra";

export function HospitalCard({ item, emphasis = false, onPress }: { item: RankedHospital; emphasis?: boolean; onPress?: () => void }) {
  const router = useRouter();
  const { hospital, score } = item;
  const ageMinutes = Math.max(1, Math.round((Date.now() - new Date(hospital.dataLastUpdated).getTime()) / 60_000));
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${hospital.name}`} onPress={onPress ?? (() => router.push(`/hospitals/${hospital.id}`))} style={({ pressed }) => [styles.card, emphasis && styles.emphasis, pressed && { opacity: 0.75 }]}>
    <View style={styles.topRow}><View style={{ flex: 1, paddingRight: 8 }}><Text style={styles.name}>{hospital.name}</Text><Text style={styles.address}>{hospital.type} · {hospital.address}</Text></View><StatusPill status={hospital.readiness} /></View>
    <View style={styles.metrics}><View style={styles.item}><MaterialIcons name="near-me" size={16} color="#0B78C6" /><Text style={styles.metric}>{score.distanceKm} km</Text></View><View style={styles.item}><MaterialIcons name="schedule" size={16} color="#0B78C6" /><Text style={styles.metric}>{score.etaMinutes} min</Text></View><View style={styles.item}><MaterialIcons name="airline-seat-flat" size={16} color="#1E7A52" /><Text style={styles.metric}>ICU {hospital.beds.icu}</Text></View></View>
    <View style={styles.bottomRow}><View style={styles.freshness}><MaterialIcons name={ageMinutes <= 5 ? "verified" : "history"} size={14} color={ageMinutes <= 5 ? "#1E7A52" : "#A86A00"} /><Text style={styles.freshnessText}>{ageMinutes <= 5 ? "Confirmed" : "Last confirmed"} {ageMinutes} min ago</Text></View><View style={styles.score}><Text style={styles.scoreValue}>{score.overall}%</Text><Text style={styles.scoreLabel}>match</Text></View></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#E4EBF1", shadowColor: "#0B2942", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  emphasis: { borderColor: "#79B9E6", borderWidth: 1.5, backgroundColor: "#FBFDFF" },
  topRow: { flexDirection: "row", alignItems: "flex-start" },
  name: { color: "#0B2942", fontSize: 16, lineHeight: 21, fontWeight: "800" },
  address: { color: "#536273", fontSize: 11, lineHeight: 16, marginTop: 3 },
  metrics: { flexDirection: "row", gap: 15, paddingVertical: 14, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#EDF2F6" },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  metric: { color: "#294155", fontSize: 12, fontWeight: "700" },
  bottomRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  freshness: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  freshnessText: { color: "#536273", fontSize: 11, fontWeight: "600" },
  score: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  scoreValue: { color: "#0B78C6", fontSize: 18, fontWeight: "900" },
  scoreLabel: { color: "#536273", fontSize: 11, fontWeight: "700" },
});

