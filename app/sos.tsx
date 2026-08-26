import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AstraScreen, DemoPill, PrimaryButton, SafetyNotice } from "@/components/astra/ui";
import { useAstra } from "@/lib/astra/store";
import { emergencyLabels, type EmergencyType } from "@/types/astra";

const options: { type: EmergencyType; icon: keyof typeof MaterialIcons.glyphMap; note: string }[] = [
  { type: "cardiac", icon: "favorite", note: "Chest pain or a heart concern" },
  { type: "stroke", icon: "psychology", note: "Face drooping, speech, or weakness" },
  { type: "trauma", icon: "car-crash", note: "Serious accident or injury" },
  { type: "respiratory", icon: "air", note: "Severe breathing difficulty" },
  { type: "bleeding", icon: "water-drop", note: "Bleeding that will not stop" },
  { type: "burns", icon: "whatshot", note: "Serious burn injury" },
  { type: "obstetric", icon: "pregnant-woman", note: "Urgent pregnancy concern" },
  { type: "pediatric", icon: "child-care", note: "Child or infant emergency" },
  { type: "unknown", icon: "help-outline", note: "Not sure what is happening" },
];

export default function SosScreen() {
  const router = useRouter();
  const { beginEmergency } = useAstra();
  const start = (type: EmergencyType) => { const session = beginEmergency(type); router.push({ pathname: "/recommendation", params: { emergencyId: session.id } } as never); };
  return <AstraScreen back title="Emergency help"><ScrollView contentContainerStyle={styles.content}><DemoPill /><Text style={styles.title}>What happened?</Text><Text style={styles.subtitle}>Choose the closest description. You do not need to diagnose yourself.</Text><SafetyNotice compact /><View style={styles.options}>{options.map((item) => <Pressable key={item.type} onPress={() => start(item.type)} style={({ pressed }) => [styles.option, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={emergencyLabels[item.type]}><View style={styles.icon}><MaterialIcons name={item.icon} size={22} color="#0B78C6" /></View><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{emergencyLabels[item.type]}</Text><Text style={styles.optionNote}>{item.note}</Text></View><MaterialIcons name="chevron-right" size={22} color="#8A98A6" /></Pressable>)}</View><PrimaryButton label="Call local emergency services" tone="quiet" icon="phone-in-talk" onPress={() => undefined} /><Text style={styles.bottomNote}>ASTRA will use a simulated location in demo mode. If location access is unavailable, you can enter it manually.</Text></ScrollView></AstraScreen>;
}

const styles = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 30 }, title: { color: "#0B2942", fontSize: 30, lineHeight: 36, fontWeight: "900", marginHorizontal: 20, marginTop: 18 }, subtitle: { color: "#536273", fontSize: 14, lineHeight: 20, marginHorizontal: 20, marginTop: 8 }, options: { gap: 9, marginHorizontal: 20, marginTop: 16, marginBottom: 18 }, option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E4EBF1" }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" }, optionTitle: { color: "#0B2942", fontSize: 14, fontWeight: "800" }, optionNote: { color: "#536273", fontSize: 11, marginTop: 3 }, pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] }, bottomNote: { color: "#748395", fontSize: 11, lineHeight: 16, textAlign: "center", marginHorizontal: 35, marginTop: 14 } });
