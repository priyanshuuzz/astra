import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AstraScreen, DemoPill, PrimaryButton, SafetyNotice } from "@/components/astra/ui";
import { useAstra } from "@/lib/astra/store";
import { parseClinicalIntake } from "@/lib/astra/intake";
import { emergencyLabels, type EmergencyType } from "@/types/astra";

const options: { type: EmergencyType; icon: keyof typeof MaterialIcons.glyphMap; note: string }[] = [
  { type: "stroke", icon: "psychology", note: "Face drooping, speech, or sudden weakness" },
  { type: "cardiac", icon: "favorite", note: "Chest pain or acute cardiac concern" },
  { type: "snakebite", icon: "bug-report", note: "Suspected snakebite or envenomation" },
  { type: "trauma", icon: "car-crash", note: "Serious accident or severe injury" },
  { type: "respiratory", icon: "air", note: "Severe breathing difficulty / asthma" },
  { type: "bleeding", icon: "water-drop", note: "Severe uncontrolled hemorrhage" },
  { type: "burns", icon: "whatshot", note: "Serious burn injury" },
  { type: "obstetric", icon: "pregnant-woman", note: "Urgent pregnancy concern" },
  { type: "pediatric", icon: "child-care", note: "Child or infant emergency" },
  { type: "unknown", icon: "help-outline", note: "Unclear or general emergency" },
];

export default function SosScreen() {
  const router = useRouter();
  const { beginEmergency } = useAstra();

  const [selectedType, setSelectedType] = useState<EmergencyType>("stroke");
  const [language, setLanguage] = useState<"en" | "hi" | "hinglish">("en");
  const [transcript, setTranscript] = useState("Patient experiencing sudden speech slurring and right-side arm weakness starting 30 minutes ago.");
  const [isListening, setIsListening] = useState(false);

  // Live parsed intake preview
  const intakePacket = useMemo(
    () =>
      parseClinicalIntake({
        transcript,
        language,
        selectedType,
      }),
    [transcript, language, selectedType]
  );

  const toggleVoiceRecording = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate voice-to-text intake stream
      setTimeout(() => {
        if (language === "hinglish") {
          setTranscript("Marez ko adha ghanta pehle lakwa aur bolne me dikkat shuru hui.");
        } else if (language === "hi") {
          setTranscript("रोगी को ३० मिनट से चेहरे में लकवा और बोलने में कठिनाई है।");
        } else {
          setTranscript("Patient developed sudden paralysis and difficulty speaking 30 minutes ago.");
        }
        setIsListening(false);
      }, 1200);
    }
  };

  const handleStartEmergency = (typeOverride?: EmergencyType) => {
    const finalType = typeOverride ?? selectedType;
    const session = beginEmergency(finalType, undefined, {
      transcript,
      language,
    });
    router.push({ pathname: "/recommendation", params: { emergencyId: session.id } } as never);
  };

  return (
    <AstraScreen back title="Emergency Intake">
      <ScrollView contentContainerStyle={styles.content}>
        <DemoPill />
        <Text style={styles.title}>Emergency Intake & Triage</Text>
        <Text style={styles.subtitle}>Voice-first or text intake. ASTRA extracts required capabilities and initiates verified hospital matching.</Text>

        <SafetyNotice compact />

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>INTAKE LANGUAGE</Text>
          <View style={styles.chipRow}>
            {(["en", "hi", "hinglish"] as const).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[styles.chip, language === lang && styles.chipActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, language === lang && styles.chipTextActive]}>
                  {lang === "en" ? "English" : lang === "hi" ? "हिंदी (Hindi)" : "Hinglish"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Voice & Transcript Input */}
        <View style={styles.sectionCard}>
          <View style={styles.voiceHeader}>
            <Text style={styles.cardHeader}>VOICE & CLINICAL TRANSCRIPT</Text>
            {isListening && <Text style={styles.recordingPill}>● LISTENING...</Text>}
          </View>

          <Pressable
            onPress={toggleVoiceRecording}
            style={({ pressed }) => [styles.voiceButton, isListening && styles.voiceButtonActive, pressed && styles.pressed]}
          >
            <MaterialIcons name={isListening ? "mic" : "mic-none"} size={24} color={isListening ? "#FFFFFF" : "#0B78C6"} />
            <Text style={[styles.voiceButtonText, isListening && styles.voiceButtonTextActive]}>
              {isListening ? "Listening... Tap to stop" : "Speak intake details"}
            </Text>
          </Pressable>

          <Text style={styles.inputLabel}>EDITABLE TRANSCRIPT</Text>
          <TextInput
            value={transcript}
            onChangeText={setTranscript}
            multiline
            placeholder="Type or speak symptoms, onset time, and clinical observations..."
            placeholderTextColor="#8A98A6"
            style={styles.transcriptInput}
          />
        </View>

        {/* Structured Extraction Card */}
        <View style={styles.extractionCard}>
          <View style={styles.extractionHeader}>
            <MaterialIcons name="auto-awesome" size={18} color="#0B78C6" />
            <Text style={styles.extractionTitle}>Derived Clinical Case Summary</Text>
          </View>

          <View style={styles.extRow}>
            <Text style={styles.extLabel}>SUSPECTED CONDITION:</Text>
            <Text style={styles.extValueHighlight}>{intakePacket.suspectedCondition}</Text>
          </View>

          <View style={styles.extRow}>
            <Text style={styles.extLabel}>SYMPTOMS:</Text>
            <Text style={styles.extValue}>{intakePacket.extractedSymptoms.join(", ")}</Text>
          </View>

          <View style={styles.extRow}>
            <Text style={styles.extLabel}>ONSET:</Text>
            <Text style={styles.extValue}>
              {typeof intakePacket.onsetMinutes === "number" ? `${intakePacket.onsetMinutes} min ago` : "UNKNOWN"}
            </Text>
          </View>

          <View style={styles.extRow}>
            <Text style={styles.extLabel}>ACUITY LEVEL:</Text>
            <Text style={styles.extValueBadge}>{intakePacket.acuity.toUpperCase()}</Text>
          </View>

          <Text style={styles.reqHeader}>DERIVED REQUIRED CAPABILITIES:</Text>
          <View style={styles.reqBadgeRow}>
            {intakePacket.requiredCapabilities.map((cap) => (
              <View key={cap} style={styles.reqBadge}>
                <Text style={styles.reqBadgeText}>✓ {cap}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Selector */}
        <Text style={styles.sectionTitle}>Select Emergency Category</Text>
        <View style={styles.options}>
          {options.map((item) => (
            <Pressable
              key={item.type}
              onPress={() => setSelectedType(item.type)}
              style={({ pressed }) => [styles.option, selectedType === item.type && styles.optionSelected, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <View style={[styles.icon, selectedType === item.type && styles.iconSelected]}>
                <MaterialIcons name={item.icon} size={22} color={selectedType === item.type ? "#FFFFFF" : "#0B78C6"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{emergencyLabels[item.type]}</Text>
                <Text style={styles.optionNote}>{item.note}</Text>
              </View>
              {selectedType === item.type ? (
                <MaterialIcons name="check-circle" size={22} color="#0B78C6" />
              ) : (
                <MaterialIcons name="chevron-right" size={22} color="#8A98A6" />
              )}
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Match Verified Facilities & Request Acceptance" icon="send" onPress={() => handleStartEmergency()} />

        <Text style={styles.bottomNote}>
          ASTRA uses deterministic capability rules to find suitable receiving facilities. AI structures information but does not make final routing decisions.
        </Text>
      </ScrollView>
    </AstraScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 35 },
  title: { color: "#0B2942", fontSize: 26, lineHeight: 32, fontWeight: "900", marginHorizontal: 20, marginTop: 14 },
  subtitle: { color: "#536273", fontSize: 13, lineHeight: 18, marginHorizontal: 20, marginTop: 6, marginBottom: 14 },
  sectionCard: { marginHorizontal: 20, marginBottom: 14, padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  cardHeader: { color: "#0B78C6", fontSize: 10, letterSpacing: 1, fontWeight: "900", marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F4F8FB" },
  chipActive: { backgroundColor: "#0B78C6" },
  chipText: { color: "#536273", fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  voiceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordingPill: { color: "#C82E38", fontSize: 10, fontWeight: "900" },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#EAF4FC",
    borderWidth: 1,
    borderColor: "#BDE0FE",
    marginBottom: 12,
  },
  voiceButtonActive: { backgroundColor: "#C82E38", borderColor: "#C82E38" },
  voiceButtonText: { color: "#0B78C6", fontSize: 13, fontWeight: "800" },
  voiceButtonTextActive: { color: "#FFFFFF" },
  inputLabel: { color: "#748395", fontSize: 10, fontWeight: "800", marginBottom: 6 },
  transcriptInput: { minHeight: 70, borderWidth: 1, borderColor: "#D7E2EA", borderRadius: 10, padding: 10, color: "#0B2942", fontSize: 12, textAlignVertical: "top" },
  extractionCard: { marginHorizontal: 20, marginBottom: 18, padding: 16, borderRadius: 18, backgroundColor: "#EAF4FC", borderWidth: 1, borderColor: "#BDE0FE" },
  extractionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  extractionTitle: { color: "#0B2942", fontSize: 14, fontWeight: "900" },
  extRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  extLabel: { color: "#536273", fontSize: 10, fontWeight: "900", width: 130 },
  extValue: { color: "#0B2942", fontSize: 12, fontWeight: "700", flex: 1 },
  extValueHighlight: { color: "#0B5E9A", fontSize: 13, fontWeight: "900", flex: 1 },
  extValueBadge: { color: "#C82E38", fontSize: 11, fontWeight: "900" },
  reqHeader: { color: "#0B78C6", fontSize: 10, fontWeight: "900", marginTop: 8, marginBottom: 6 },
  reqBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reqBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#BDE0FE" },
  reqBadgeText: { color: "#0B5E9A", fontSize: 10, fontWeight: "800" },
  sectionTitle: { color: "#0B2942", fontSize: 16, fontWeight: "900", marginHorizontal: 20, marginBottom: 10 },
  options: { gap: 8, marginHorizontal: 20, marginBottom: 18 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E4EBF1" },
  optionSelected: { borderColor: "#0B78C6", backgroundColor: "#F0F7FF" },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  iconSelected: { backgroundColor: "#0B78C6" },
  optionTitle: { color: "#0B2942", fontSize: 13, fontWeight: "800" },
  optionNote: { color: "#536273", fontSize: 10, marginTop: 2 },
  pressed: { opacity: 0.75 },
  bottomNote: { color: "#748395", fontSize: 10, lineHeight: 15, textAlign: "center", marginHorizontal: 30, marginTop: 14 },
});
