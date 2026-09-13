import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AstraScreen, DemoPill, Metric, PrimaryButton, SafetyNotice, SectionHeading, StatusPill } from "@/components/astra/ui";
import { useAstra } from "@/lib/astra/store";
import type { AmbulanceStatus } from "@/types/astra";

const ambulanceLabels: Record<AmbulanceStatus, string> = {
  requested: "Request received",
  dispatched: "Dispatched",
  arriving: "Arriving",
  picked_up: "Patient picked up",
  en_route: "En route to hospital",
  arrived: "Arrived",
};

export default function EmergencyScreen() {
  const router = useRouter();
  const {
    activeEmergency,
    hospitals,
    requestAmbulance,
    updateAmbulanceStatus,
    markContactsNotified,
    respondToClarification,
    completeEmergency,
  } = useAstra();

  const [seconds, setSeconds] = useState(3600);
  const [clarificationResponseText, setClarificationResponseText] = useState("");
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const hospital = useMemo(
    () =>
      hospitals.find((item) => item.id === activeEmergency?.selectedHospitalId) ??
      hospitals.find((item) => item.id === activeEmergency?.recommendation?.hospitalId),
    [hospitals, activeEmergency?.selectedHospitalId, activeEmergency?.recommendation?.hospitalId]
  );

  const acceptanceSeconds = activeEmergency?.acceptanceRequests?.[0]
    ? Math.max(0, 90 - Math.floor((Date.now() - new Date(activeEmergency.acceptanceRequests[0].sentAt).getTime()) / 1000))
    : 0;

  if (!activeEmergency || !hospital)
    return (
      <AstraScreen back title="Emergency status">
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No active emergency</Text>
          <PrimaryButton label="Return to home" onPress={() => router.replace("/" as never)} />
        </View>
      </AstraScreen>
    );

  const ambulance = activeEmergency.ambulance;
  const nextStatus = ambulance
    ? ({ dispatched: "arriving", arriving: "picked_up", picked_up: "en_route", en_route: "arrived", arrived: "arrived", requested: "dispatched" } as const)[ambulance.status]
    : undefined;

  const currentState = activeEmergency.currentState ?? (activeEmergency.hospitalAccepted ? "DESTINATION_CONFIRMED" : "PENDING_ACCEPTANCE");

  const handleClarificationSubmit = () => {
    if (clarificationResponseText.trim().length > 0) {
      respondToClarification(clarificationResponseText);
      setClarificationResponseText("");
    }
  };

  return (
    <AstraScreen back title="Emergency Active">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTitle}>Emergency Active</Text>
            <Text style={styles.liveBody}>{activeEmergency.id} · EMS Referral Flow</Text>
          </View>
          <DemoPill />
        </View>

        {/* STATE MACHINE STATUS BADGE */}
        <View style={styles.stateBadgeContainer}>
          <Text style={styles.stateLabel}>CASE STATE:</Text>
          <View
            style={[
              styles.statePill,
              currentState === "DESTINATION_CONFIRMED" && styles.statePillConfirmed,
              currentState === "CLARIFICATION_REQUIRED" && styles.statePillWarning,
              (currentState === "DECLINED" || currentState === "FAILOVER") && styles.statePillDanger,
            ]}
          >
            <Text
              style={[
                styles.statePillText,
                currentState === "DESTINATION_CONFIRMED" && styles.statePillTextConfirmed,
                currentState === "CLARIFICATION_REQUIRED" && styles.statePillTextWarning,
                (currentState === "DECLINED" || currentState === "FAILOVER") && styles.statePillTextDanger,
              ]}
            >
              ● {currentState.replaceAll("_", " ")}
            </Text>
          </View>
        </View>

        <SafetyNotice compact />

        {/* CLARIFICATION REQUIRED PROMPT FOR EMS */}
        {currentState === "CLARIFICATION_REQUIRED" && (
          <View style={styles.clarificationPromptCard}>
            <View style={styles.promptHeader}>
              <MaterialIcons name="help-outline" size={20} color="#C82E38" />
              <Text style={styles.promptTitle}>Clarification Requested by Hospital</Text>
            </View>

            <Text style={styles.questionBox}>
              {`"${activeEmergency.clarificationQuestion ?? "Please confirm clinical details before hospital acceptance."}"`}
            </Text>

            <Text style={styles.responseLabel}>PROVIDE RESPONSE TO RECEIVING COORDINATOR:</Text>
            <TextInput
              value={clarificationResponseText}
              onChangeText={setClarificationResponseText}
              placeholder="e.g. Patient is not on anticoagulants. Last known well time: 30m ago."
              placeholderTextColor="#8A98A6"
              multiline
              style={styles.responseInput}
            />

            <PrimaryButton label="Submit Answer to Hospital" icon="send" onPress={handleClarificationSubmit} />
          </View>
        )}

        {/* ACCEPTANCE HANDSHAKE PROGRESS CARD */}
        {activeEmergency.acceptanceRequests && activeEmergency.acceptanceRequests.length > 0 && (
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View>
                <Text style={styles.requestEyebrow}>ACCEPTANCE HANDSHAKE</Text>
                <Text style={styles.requestTitle}>Requests sent to {activeEmergency.acceptanceRequests.length} candidate hospitals</Text>
              </View>
              <Text style={styles.countdown}>{acceptanceSeconds}s</Text>
            </View>

            <Text style={styles.requestBody}>
              First explicit hospital acceptance locks the destination. Verification guarantees capability, not admission.
            </Text>

            {activeEmergency.acceptanceRequests.map((request) => {
              const target = hospitals.find((item) => item.id === request.hospitalId);
              return (
                <View key={request.id} style={styles.requestRow}>
                  <View
                    style={[
                      styles.requestDot,
                      request.status === "accepted" && { backgroundColor: "#1E7A52" },
                      request.status === "needs_clarification" && { backgroundColor: "#A86A00" },
                      (request.status === "declined" || request.status === "timeout") && { backgroundColor: "#C82E38" },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestHospital}>{target?.name ?? "Hospital request"}</Text>
                    <Text style={styles.requestStatus}>
                      {request.status === "pending"
                        ? `WAITING · ${acceptanceSeconds}s remaining`
                        : request.status.replace("_", " ").toUpperCase()}
                    </Text>
                    {request.clarificationNotes && <Text style={styles.clarificationNotes}>Clarification: {request.clarificationNotes}</Text>}
                    {request.declineReason && <Text style={styles.declineReason}>Reason: {request.declineReason.replaceAll("_", " ")}</Text>}
                  </View>
                  {request.status === "pending" && <Text style={styles.waiting}>PENDING</Text>}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.timerCard}>
          <Text style={styles.timerEyebrow}>TIME-SENSITIVE CARE COUNTDOWN</Text>
          <Text style={styles.timer}>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </Text>
          <Text style={styles.timerNote}>Rapid capability-matched care matters. Prepare patient for transport.</Text>
        </View>

        {/* CONFIRMED DESTINATION CARD */}
        <View style={styles.summary}>
          <Text style={styles.summaryEyebrow}>DESTINATION FACILITY</Text>
          <Text style={styles.hospital}>{hospital.name}</Text>
          <Text style={styles.address}>{hospital.address}</Text>

          <View style={styles.summaryMetrics}>
            <Metric label="Estimated arrival" value={`${activeEmergency.recommendation?.etaMinutes ?? 8} min`} icon="schedule" />
            <Metric label="ICU confirmed" value={`${hospital.beds.icu} beds`} icon="airline-seat-flat" tint="#1E7A52" />
          </View>

          <StatusPill
            status={hospital.readiness}
            label={activeEmergency.hospitalAccepted ? "Destination Accepted & Confirmed" : "Awaiting Coordinator Handshake"}
          />
        </View>

        <SectionHeading title="Coordination status" />
        <View style={styles.statusList}>
          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <MaterialIcons name="location-on" size={19} color="#0B78C6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Route ready</Text>
              <Text style={styles.statusBody}>
                {activeEmergency.recommendation?.distanceKm ?? 0} km · {hospital.traffic} traffic
              </Text>
            </View>
            <Text style={styles.done}>READY</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, activeEmergency.contactsNotified && { backgroundColor: "#E9F7F0" }]}>
              <MaterialIcons name="people" size={19} color={activeEmergency.contactsNotified ? "#1E7A52" : "#0B78C6"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Emergency contacts</Text>
              <Text style={styles.statusBody}>{activeEmergency.contactsNotified ? "2 contacts notified" : "Ready to notify saved contacts"}</Text>
            </View>
            {!activeEmergency.contactsNotified && <PrimaryButton label="Notify" tone="quiet" onPress={markContactsNotified} />}
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, ambulance && { backgroundColor: "#FFF6E1" }]}>
              <MaterialIcons name="local-shipping" size={19} color={ambulance ? "#A86A00" : "#536273"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Ambulance</Text>
              <Text style={styles.statusBody}>
                {ambulance ? `${ambulance.vehicleId} · ${ambulanceLabels[ambulance.status]}` : "No ambulance assigned yet"}
              </Text>
            </View>
            {!ambulance ? (
              <PrimaryButton label="Request" tone="quiet" onPress={requestAmbulance} />
            ) : (
              nextStatus && <PrimaryButton label="Advance" tone="quiet" onPress={() => updateAmbulanceStatus(nextStatus)} />
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton label="View route" icon="map" onPress={() => router.push("/map" as never)} />
          <PrimaryButton label="Hospital Portal" tone="quiet" icon="local-hospital" onPress={() => router.push("/staff" as never)} />
        </View>

        {/* AUDIT TRAIL LOG TOGGLE */}
        <View style={styles.auditContainer}>
          <Pressable onPress={() => setShowAuditTrail(!showAuditTrail)} style={styles.auditHeader}>
            <MaterialIcons name="history" size={18} color="#0B78C6" />
            <Text style={styles.auditTitle}>Emergency Audit Trail ({activeEmergency.auditEvents?.length ?? 0} events)</Text>
            <MaterialIcons name={showAuditTrail ? "expand-less" : "expand-more"} size={20} color="#536273" />
          </Pressable>

          {showAuditTrail && (
            <View style={styles.auditList}>
              {(activeEmergency.auditEvents ?? []).map((event) => (
                <View key={event.id} style={styles.auditItem}>
                  <View style={styles.auditDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditEventTitle}>{event.eventType.replaceAll("_", " ")}</Text>
                    <Text style={styles.auditDetails}>{event.details}</Text>
                    <Text style={styles.auditMeta}>
                      Actor: {event.actorRole.toUpperCase()} · {new Date(event.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <PrimaryButton label="Complete demo session" tone="quiet" onPress={completeEmergency} />

        <Text style={styles.disclaimer}>
          ASTRA coordinates information & acceptance; it does not independently diagnose, guarantee admission, or replace emergency dispatch services.
        </Text>
      </ScrollView>
    </AstraScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 40 },
  liveHeader: { marginHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#C82E38" },
  liveTitle: { color: "#0B2942", fontSize: 17, fontWeight: "900" },
  liveBody: { color: "#536273", fontSize: 11, marginTop: 3 },
  stateBadgeContainer: { marginHorizontal: 20, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  stateLabel: { color: "#748395", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  statePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#EAF4FC", borderWidth: 1, borderColor: "#BDE0FE" },
  statePillConfirmed: { backgroundColor: "#EAF7F0", borderColor: "#8DD5B0" },
  statePillWarning: { backgroundColor: "#FFF6E1", borderColor: "#F7D070" },
  statePillDanger: { backgroundColor: "#FFF2F2", borderColor: "#F7B0B0" },
  statePillText: { color: "#0B78C6", fontSize: 11, fontWeight: "900" },
  statePillTextConfirmed: { color: "#1E7A52" },
  statePillTextWarning: { color: "#A86A00" },
  statePillTextDanger: { color: "#C82E38" },
  clarificationPromptCard: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: "#FFF6E1", borderWidth: 2, borderColor: "#A86A00" },
  promptHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  promptTitle: { color: "#0B2942", fontSize: 15, fontWeight: "900" },
  questionBox: { color: "#795200", fontSize: 12, fontStyle: "italic", marginVertical: 8, padding: 10, backgroundColor: "#FFFFFF", borderRadius: 8 },
  responseLabel: { color: "#536273", fontSize: 9, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  responseInput: { minHeight: 60, borderWidth: 1, borderColor: "#D7E2EA", borderRadius: 8, padding: 8, color: "#0B2942", fontSize: 12, backgroundColor: "#FFFFFF", marginBottom: 10, textAlignVertical: "top" },
  requestCard: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7E2EA" },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  requestEyebrow: { color: "#0B78C6", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  requestTitle: { color: "#0B2942", fontSize: 15, fontWeight: "900", marginTop: 5, flexShrink: 1 },
  countdown: { color: "#A86A00", fontSize: 22, fontWeight: "900" },
  requestBody: { color: "#536273", fontSize: 11, lineHeight: 16, marginTop: 10 },
  requestRow: { minHeight: 48, borderTopWidth: 1, borderTopColor: "#EDF2F6", flexDirection: "row", alignItems: "center", gap: 9, marginTop: 9, paddingTop: 9 },
  requestDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#A86A00" },
  requestHospital: { color: "#0B2942", fontSize: 12, fontWeight: "800" },
  requestStatus: { color: "#536273", fontSize: 10, marginTop: 3, fontWeight: "800" },
  clarificationNotes: { color: "#A86A00", fontSize: 10, marginTop: 2, fontWeight: "600" },
  declineReason: { color: "#C82E38", fontSize: 10, marginTop: 2, fontWeight: "600" },
  waiting: { color: "#A86A00", fontSize: 9, fontWeight: "900" },
  timerCard: { marginHorizontal: 20, marginTop: 16, padding: 18, borderRadius: 20, backgroundColor: "#0B2942", alignItems: "center" },
  timerEyebrow: { color: "#8DC7EE", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  timer: { color: "#FFFFFF", fontSize: 44, lineHeight: 50, fontWeight: "900", letterSpacing: 2, marginTop: 8 },
  timerNote: { color: "#B9CBD7", fontSize: 11, textAlign: "center", lineHeight: 16, marginTop: 6 },
  summary: { marginHorizontal: 20, marginTop: 14, padding: 17, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  summaryEyebrow: { color: "#0B78C6", fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  hospital: { color: "#0B2942", fontSize: 20, fontWeight: "900", marginTop: 8 },
  address: { color: "#536273", fontSize: 12, marginTop: 4 },
  summaryMetrics: { flexDirection: "row", gap: 8, marginVertical: 14 },
  statusList: { marginHorizontal: 20, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E4EBF1", paddingHorizontal: 14 },
  statusRow: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 11, borderBottomWidth: 1, borderColor: "#EDF2F6" },
  statusIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  statusTitle: { color: "#0B2942", fontSize: 13, fontWeight: "800" },
  statusBody: { color: "#536273", fontSize: 11, marginTop: 3 },
  done: { color: "#1E7A52", fontSize: 10, fontWeight: "900" },
  actionRow: { marginHorizontal: 20, marginTop: 16, flexDirection: "row", gap: 9 },
  auditContainer: { marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4EBF1" },
  auditHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  auditTitle: { color: "#0B2942", fontSize: 13, fontWeight: "800", flex: 1 },
  auditList: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#EDF2F6", gap: 10 },
  auditItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  auditDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0B78C6", marginTop: 5 },
  auditEventTitle: { color: "#0B5E9A", fontSize: 11, fontWeight: "900" },
  auditDetails: { color: "#294155", fontSize: 11, marginTop: 1 },
  auditMeta: { color: "#8A98A6", fontSize: 9, marginTop: 2 },
  disclaimer: { color: "#748395", fontSize: 11, lineHeight: 16, textAlign: "center", marginHorizontal: 28, marginTop: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: "#0B2942", fontSize: 22, fontWeight: "900", marginBottom: 18 },
});
