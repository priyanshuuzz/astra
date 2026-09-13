import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Notifications from "expo-notifications";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { fetchLiveHospitals, updateLiveHospital } from "@/lib/supabase-hospital-repository";
import { useAuth } from "@/lib/auth-context";
import { AstraScreen, DemoPill, Metric, PrimaryButton, SectionHeading, StatusPill } from "@/components/astra/ui";
import { useAstra } from "@/lib/astra/store";
import { subscribeToAcceptanceEvents, type AcceptanceEvent } from "@/lib/acceptance-realtime";
import { toCoordinatorAlert } from "@/lib/coordinator-alerts";
import type { DeclineReason } from "@/types/astra";

const declineReasonsList: { label: string; reason: DeclineReason }[] = [
  { label: "Capability Unavailable", reason: "capability_unavailable" },
  { label: "Clinical Team Busy", reason: "clinical_team_unavailable" },
  { label: "ICU / Emergency Full", reason: "capacity_unavailable" },
  { label: "Equipment Out of Service", reason: "equipment_unavailable" },
  { label: "Department Saturated", reason: "department_saturated" },
];

export default function StaffScreen() {
  const router = useRouter();
  const {
    hospitals,
    updateHospital,
    activeEmergency,
    acceptHospitalDecision,
    declineHospitalDecision,
    requestHospitalClarification,
    addNotification,
  } = useAstra();
  const { user } = useAuth();
  const [liveHospital, setLiveHospital] = useState(hospitals[0]);
  const [backendStatus, setBackendStatus] = useState("Connecting to Supabase…");
  const [alerts, setAlerts] = useState<AcceptanceEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Form states for clarification & decline
  const [showClarificationInput, setShowClarificationInput] = useState(false);
  const [clarificationText, setClarificationText] = useState("Please confirm if patient is currently taking anticoagulants and last known well time.");
  const [showDeclineOptions, setShowDeclineOptions] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<DeclineReason>("capability_unavailable");
  const [declineNotes, setDeclineNotes] = useState("");

  const hospital = liveHospital ?? hospitals[0];

  useEffect(() => {
    fetchLiveHospitals()
      .then((rows) => {
        if (rows[0]) setLiveHospital(rows[0]);
        setBackendStatus(rows.length ? "Synced from Supabase" : "Supabase ready · no hospital rows yet");
      })
      .catch(() => setBackendStatus("Offline fallback · local demo data"));
  }, [hospitals.length]);

  useEffect(() => {
    if (!hospital?.id) return;
    return subscribeToAcceptanceEvents({
      hospitalId: hospital.id,
      onEvent: (event) => {
        setAlerts((current) => [event, ...current.filter((item) => item.request.id !== event.request.id || item.request.status !== event.request.status)].slice(0, 8));
        const coordinatorAlert = toCoordinatorAlert(event.request);
        addNotification(coordinatorAlert.title, coordinatorAlert.body, coordinatorAlert.tone);
        if (coordinatorAlert.shouldSound && soundEnabled) {
          void Notifications.scheduleNotificationAsync({
            content: { title: "Ambulance request accepted", body: `Request ${event.request.id} is assigned to ${hospital.name}.`, sound: "default" },
            trigger: null,
          }).catch(() => undefined);
        }
      },
      onError: (message) => setBackendStatus(message),
    });
  }, [hospital?.id, hospital?.name, addNotification, soundEnabled]);

  const saveCapacity = async (beds: typeof hospital.beds) => {
    updateHospital(hospital.id, { beds });
    setLiveHospital({ ...hospital, beds });
    try {
      const updated = await updateLiveHospital(hospital.id, { beds }, user?.id);
      setLiveHospital(updated);
      setBackendStatus("Saved to Supabase");
    } catch {
      setBackendStatus("Saved locally · backend unavailable");
    }
  };

  const replayAcceptedSound = () => {
    if (Platform.OS !== "web")
      void Notifications.scheduleNotificationAsync({
        content: { title: "Ambulance request accepted", body: "Coordinator alert replayed.", sound: "default" },
        trigger: null,
      }).catch(() => undefined);
  };

  const handleAccept = () => {
    acceptHospitalDecision(hospital.id);
  };

  const handleClarificationSubmit = () => {
    requestHospitalClarification(clarificationText, hospital.id);
    setShowClarificationInput(false);
  };

  const handleDeclineSubmit = () => {
    declineHospitalDecision(hospital.id, selectedDeclineReason, declineNotes);
    setShowDeclineOptions(false);
  };

  if (!hospital)
    return (
      <AstraScreen back title="Hospital operations">
        <Text style={styles.empty}>No hospital is available for this coordinator.</Text>
      </AstraScreen>
    );

  return (
    <AstraScreen back title="Hospital operations">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <DemoPill />
          <Text style={styles.title}>{hospital.name}</Text>
          <Text style={styles.sub}>
            {hospital.address} · {hospital.type}
          </Text>
        </View>

        <View style={styles.readyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overline}>EMERGENCY READINESS</Text>
            <Text style={styles.readyTitle}>Receiving Operations</Text>
            <Text style={styles.readyBody}>Acceptance decisions lock destination and update EMS in realtime.</Text>
            <Text style={styles.backendStatus}>{backendStatus}</Text>
          </View>
          <StatusPill status={hospital.readiness} />
        </View>

        {/* INCOMING EMERGENCY REFERRAL CASE CARD */}
        {activeEmergency && (
          <View style={styles.incomingCard}>
            <View style={styles.incomingHeader}>
              <View style={styles.incomingBadge}>
                <Text style={styles.incomingBadgeText}>INCOMING REFERRAL CASE</Text>
              </View>
              <Text style={styles.emergencyId}>{activeEmergency.id}</Text>
            </View>

            <Text style={styles.conditionTitle}>
              {activeEmergency.intakePacket?.suspectedCondition ?? activeEmergency.type.toUpperCase()}
            </Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryHeader}>CLINICAL SUMMARY & TRANSCRIPT</Text>
              <Text style={styles.transcriptText}>
                {`"${activeEmergency.intakePacket?.originalTranscript || "No transcript provided."}"`}
              </Text>

              <View style={styles.clinicalGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>ACUITY:</Text>
                  <Text style={styles.gridValueDanger}>
                    {(activeEmergency.intakePacket?.acuity ?? activeEmergency.acuity ?? "high").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>ONSET:</Text>
                  <Text style={styles.gridValue}>
                    {activeEmergency.intakePacket?.onsetMinutes !== undefined
                      ? `${activeEmergency.intakePacket.onsetMinutes} min ago`
                      : "UNKNOWN"}
                  </Text>
                </View>
              </View>

              <Text style={styles.summaryHeader}>REQUIRED MEDICAL CAPABILITIES:</Text>
              <View style={styles.capRow}>
                {(activeEmergency.requiredCapabilities ?? []).map((cap) => (
                  <View key={cap} style={styles.capChip}>
                    <Text style={styles.capChipText}>✓ {cap}</Text>
                  </View>
                ))}
              </View>

              {activeEmergency.clarificationAnswer && (
                <View style={styles.answerBox}>
                  <Text style={styles.answerHeader}>EMS CLARIFICATION RESPONSE:</Text>
                  <Text style={styles.answerText}>{activeEmergency.clarificationAnswer}</Text>
                </View>
              )}
            </View>

            {/* HANDSHAKE ACTION BUTTONS */}
            {activeEmergency.hospitalAccepted ? (
              <View style={styles.acceptedBanner}>
                <MaterialIcons name="check-circle" size={20} color="#1E7A52" />
                <Text style={styles.acceptedBannerText}>REFERRAL ACCEPTED · DESTINATION LOCKED</Text>
              </View>
            ) : (
              <View style={styles.handshakeContainer}>
                <Pressable onPress={handleAccept} style={({ pressed }) => [styles.actionButtonAccept, pressed && styles.pressed]}>
                  <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonAcceptText}>ACCEPT REFERRAL</Text>
                </Pressable>

                <View style={styles.subActionRow}>
                  <Pressable
                    onPress={() => {
                      setShowClarificationInput(!showClarificationInput);
                      setShowDeclineOptions(false);
                    }}
                    style={({ pressed }) => [styles.subActionButton, pressed && styles.pressed]}
                  >
                    <MaterialIcons name="help-outline" size={16} color="#0B78C6" />
                    <Text style={styles.subActionText}>Need Clarification</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setShowDeclineOptions(!showDeclineOptions);
                      setShowClarificationInput(false);
                    }}
                    style={({ pressed }) => [styles.subActionButtonDanger, pressed && styles.pressed]}
                  >
                    <MaterialIcons name="cancel" size={16} color="#C82E38" />
                    <Text style={styles.subActionTextDanger}>Decline Case</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* CLARIFICATION INPUT EXPANDABLE */}
            {showClarificationInput && (
              <View style={styles.expandableBox}>
                <Text style={styles.expandableHeader}>REQUEST CLINICAL CLARIFICATION</Text>
                <TextInput
                  value={clarificationText}
                  onChangeText={setClarificationText}
                  multiline
                  style={styles.expandableInput}
                  placeholder="Enter specific question for EMS / Referring doctor..."
                />
                <PrimaryButton label="Submit Clarification Question" icon="send" onPress={handleClarificationSubmit} />
              </View>
            )}

            {/* DECLINE REASONS EXPANDABLE */}
            {showDeclineOptions && (
              <View style={styles.expandableBox}>
                <Text style={styles.expandableHeader}>DECLINE REFERRAL - SELECT REASON</Text>
                {declineReasonsList.map((item) => (
                  <Pressable
                    key={item.reason}
                    onPress={() => setSelectedDeclineReason(item.reason)}
                    style={[styles.declineRadio, selectedDeclineReason === item.reason && styles.declineRadioActive]}
                  >
                    <MaterialIcons
                      name={selectedDeclineReason === item.reason ? "radio-button-checked" : "radio-button-unchecked"}
                      size={16}
                      color={selectedDeclineReason === item.reason ? "#C82E38" : "#8A98A6"}
                    />
                    <Text style={styles.declineRadioText}>{item.label}</Text>
                  </Pressable>
                ))}
                <TextInput
                  value={declineNotes}
                  onChangeText={setDeclineNotes}
                  placeholder="Optional notes for audit trail..."
                  style={styles.declineNotesInput}
                />
                <PrimaryButton label="Confirm Decline & Log Audit Event" tone="quiet" onPress={handleDeclineSubmit} />
              </View>
            )}
          </View>
        )}

        <View style={styles.alertHeader}>
          <SectionHeading title="Coordinator alerts" />
          <Pressable onPress={() => setSoundEnabled((value) => !value)} style={styles.soundButton}>
            <MaterialIcons name={soundEnabled ? "volume-up" : "volume-off"} size={18} color="#0B78C6" />
            <Text style={styles.soundText}>{soundEnabled ? "Sound on" : "Muted"}</Text>
          </Pressable>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Listening for acceptance events</Text>
            <Text style={styles.emptyText}>New, accepted, clarification, declined, timeout, and assigned-elsewhere updates will appear here.</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={`${alert.request.id}-${alert.request.status}`} style={[styles.alertCard, alert.request.status === "accepted" && styles.acceptedCard]}>
              <View style={styles.alertIcon}>
                <MaterialIcons
                  name={alert.request.status === "accepted" ? "check-circle" : "notifications-active"}
                  size={19}
                  color={alert.request.status === "accepted" ? "#1E7A52" : "#A86A00"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{alert.request.status === "accepted" ? "Ambulance accepted" : "Acceptance update"}</Text>
                <Text style={styles.alertText}>
                  {alert.request.id} · {alert.request.status.replace("_", " ")}
                </Text>
              </View>
              {alert.request.status === "accepted" && (
                <Pressable onPress={replayAcceptedSound} style={styles.replay}>
                  <MaterialIcons name="replay" size={17} color="#0B78C6" />
                </Pressable>
              )}
            </View>
          ))
        )}

        <SectionHeading title="Capacity snapshot" />
        <View style={styles.metrics}>
          <Metric label="ICU available" value={`${hospital.beds.icu}`} icon="airline-seat-flat" tint="#1E7A52" />
          <Metric label="Emergency beds" value={`${hospital.beds.emergency}`} icon="local-hospital" />
          <Metric label="Ventilators" value={`${hospital.beds.ventilators}`} icon="air" tint="#A86A00" />
        </View>

        <View style={styles.control}>
          <Text style={styles.controlTitle}>Bed management</Text>
          <Text style={styles.controlBody}>Use the controls to simulate a capacity update. Values cannot become negative.</Text>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>ICU beds</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => saveCapacity({ ...hospital.beds, icu: Math.max(0, hospital.beds.icu - 1) })} style={styles.step}>
                <Text>−</Text>
              </Pressable>
              <Text style={styles.count}>{hospital.beds.icu}</Text>
              <Pressable onPress={() => saveCapacity({ ...hospital.beds, icu: hospital.beds.icu + 1 })} style={styles.step}>
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Emergency beds</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => saveCapacity({ ...hospital.beds, emergency: Math.max(0, hospital.beds.emergency - 1) })} style={styles.step}>
                <Text>−</Text>
              </Pressable>
              <Text style={styles.count}>{hospital.beds.emergency}</Text>
              <Pressable onPress={() => saveCapacity({ ...hospital.beds, emergency: hospital.beds.emergency + 1 })} style={styles.step}>
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.specialists}>
          <Text style={styles.controlTitle}>Specialists on duty</Text>
          {hospital.specialists.map((person) => (
            <View key={person.id} style={styles.person}>
              <View style={styles.personIcon}>
                <MaterialIcons name="person" size={18} color="#0B78C6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personSpecialty}>{person.specialty}</Text>
              </View>
              <Text style={styles.personStatus}>{person.status.replace("_", " ").toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton label="Return to EMS view" tone="quiet" onPress={() => router.replace("/" as never)} />
      </ScrollView>
    </AstraScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 35 },
  head: { paddingHorizontal: 20, paddingTop: 15 },
  title: { color: "#0B2942", fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 18 },
  sub: { color: "#536273", fontSize: 12, marginTop: 4 },
  readyCard: { margin: 20, marginBottom: 14, padding: 17, borderRadius: 19, backgroundColor: "#0B2942", flexDirection: "row", alignItems: "center" },
  overline: { color: "#8DC7EE", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  readyTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 6 },
  readyBody: { color: "#B9CBD7", fontSize: 11, marginTop: 4 },
  incomingCard: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 18, backgroundColor: "#FFF6E1", borderWidth: 1, borderColor: "#F7D070" },
  incomingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  incomingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#A86A00" },
  incomingBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  emergencyId: { color: "#795200", fontSize: 11, fontWeight: "800" },
  conditionTitle: { color: "#0B2942", fontSize: 20, fontWeight: "900", marginTop: 10 },
  summaryBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#FFFFFF" },
  summaryHeader: { color: "#536273", fontSize: 9, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  transcriptText: { color: "#0B2942", fontSize: 12, fontStyle: "italic", marginBottom: 10 },
  clinicalGrid: { flexDirection: "row", gap: 12, marginBottom: 10 },
  gridItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  gridLabel: { color: "#748395", fontSize: 10, fontWeight: "800" },
  gridValue: { color: "#0B2942", fontSize: 11, fontWeight: "800" },
  gridValueDanger: { color: "#C82E38", fontSize: 11, fontWeight: "900" },
  capRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  capChip: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: "#EAF4FC" },
  capChipText: { color: "#0B78C6", fontSize: 10, fontWeight: "800" },
  answerBox: { marginTop: 10, padding: 8, borderRadius: 8, backgroundColor: "#EAF7F0" },
  answerHeader: { color: "#1E7A52", fontSize: 9, fontWeight: "900" },
  answerText: { color: "#0B2942", fontSize: 11, fontWeight: "700", marginTop: 2 },
  acceptedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "#EAF7F0", marginTop: 12 },
  acceptedBannerText: { color: "#1E7A52", fontSize: 12, fontWeight: "900" },
  handshakeContainer: { marginTop: 12, gap: 8 },
  actionButtonAccept: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, backgroundColor: "#1E7A52" },
  actionButtonAcceptText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  subActionRow: { flexDirection: "row", gap: 8 },
  subActionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, padding: 10, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#0B78C6" },
  subActionText: { color: "#0B78C6", fontSize: 11, fontWeight: "800" },
  subActionButtonDanger: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, padding: 10, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C82E38" },
  subActionTextDanger: { color: "#C82E38", fontSize: 11, fontWeight: "800" },
  expandableBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7E2EA" },
  expandableHeader: { color: "#0B2942", fontSize: 11, fontWeight: "900", marginBottom: 8 },
  expandableInput: { minHeight: 60, borderWidth: 1, borderColor: "#D7E2EA", borderRadius: 8, padding: 8, color: "#0B2942", fontSize: 11, marginBottom: 8, textAlignVertical: "top" },
  declineRadio: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  declineRadioActive: { backgroundColor: "#FFF2F2", borderRadius: 6, paddingHorizontal: 6 },
  declineRadioText: { color: "#294155", fontSize: 11, fontWeight: "700" },
  declineNotesInput: { borderWidth: 1, borderColor: "#D7E2EA", borderRadius: 8, padding: 8, color: "#0B2942", fontSize: 11, marginVertical: 8 },
  metrics: { flexDirection: "row", gap: 8, marginHorizontal: 20 },
  control: { margin: 20, padding: 16, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  controlTitle: { color: "#0B2942", fontSize: 16, fontWeight: "900" },
  controlBody: { color: "#536273", fontSize: 11, lineHeight: 16, marginTop: 5 },
  controlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 15 },
  controlLabel: { color: "#294155", fontSize: 13, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 15 },
  step: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  count: { color: "#0B2942", fontWeight: "900" },
  specialists: { marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  person: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14 },
  personIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  personName: { color: "#0B2942", fontSize: 12, fontWeight: "800" },
  personSpecialty: { color: "#536273", fontSize: 11, marginTop: 2 },
  personStatus: { color: "#1E7A52", fontSize: 9, fontWeight: "900" },
  backendStatus: { color: "#8DD5B0", fontSize: 10, marginTop: 5, fontWeight: "700" },
  alertHeader: { marginHorizontal: 20, marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  soundButton: { flexDirection: "row", alignItems: "center", gap: 5, padding: 8, borderRadius: 10, backgroundColor: "#EAF4FC" },
  soundText: { color: "#0B78C6", fontSize: 10, fontWeight: "800" },
  emptyCard: { marginHorizontal: 20, padding: 14, borderRadius: 15, backgroundColor: "#F4F8FB" },
  emptyTitle: { color: "#0B2942", fontSize: 12, fontWeight: "900" },
  emptyText: { color: "#536273", fontSize: 11, lineHeight: 16, marginTop: 4 },
  alertCard: { marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 15, backgroundColor: "#FFF6E1", flexDirection: "row", alignItems: "center", gap: 9 },
  acceptedCard: { backgroundColor: "#EAF7F0" },
  alertIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF99", alignItems: "center", justifyContent: "center" },
  alertTitle: { color: "#0B2942", fontSize: 12, fontWeight: "900" },
  alertText: { color: "#536273", fontSize: 10, marginTop: 3 },
  replay: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  empty: { margin: 20, color: "#536273" },
  pressed: { opacity: 0.75 },
});
