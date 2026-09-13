import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoContacts, demoHospitals, demoLocation } from "@/data/demo";
import { HospitalRecommendationEngine, requiredCapabilities } from "@/lib/astra/recommendation";
import { parseClinicalIntake, type IntakeOptions } from "@/lib/astra/intake";
import {
  answerClarification,
  clarifyAcceptance,
  createAcceptanceRequests,
  createAuditEvent,
  declineAcceptance,
  resolveAcceptance,
} from "@/lib/astra/handshake";
import type {
  AcceptanceRequest,
  AmbulanceStatus,
  AstraAuditEvent,
  AstraNotification,
  ClinicalIntakePacket,
  Coordinates,
  DeclineReason,
  EmergencyContact,
  EmergencySession,
  EmergencyType,
  Hospital,
  UserRole,
} from "@/types/astra";

const STORAGE_KEY = "astra.demo.state.v1";
const engine = new HospitalRecommendationEngine();

type PersistedState = {
  hasOnboarded: boolean;
  isDemoMode: boolean;
  role: UserRole;
  hospitals: Hospital[];
  contacts: EmergencyContact[];
  history: EmergencySession[];
  notifications: AstraNotification[];
};

type AstraContextValue = PersistedState & {
  hydrated: boolean;
  currentLocation: Coordinates;
  setCurrentLocation: (location: Coordinates) => void;
  activeEmergency?: EmergencySession;
  setRole: (role: UserRole) => void;
  completeOnboarding: () => void;
  enterDemoMode: () => void;
  beginEmergency: (type: EmergencyType, location?: Coordinates, intakeOptions?: Partial<IntakeOptions>) => EmergencySession;
  selectHospital: (hospitalId: string) => void;
  requestAmbulance: () => void;
  updateAmbulanceStatus: (status: AmbulanceStatus) => void;
  setHospitalDecision: (accepted: boolean) => void;
  acceptHospitalDecision: (hospitalId?: string) => void;
  declineHospitalDecision: (hospitalId?: string, reason?: DeclineReason, notes?: string) => void;
  requestHospitalClarification: (notes: string, hospitalId?: string) => void;
  respondToClarification: (answerText: string) => void;
  completeEmergency: () => void;
  updateHospital: (hospitalId: string, update: Partial<Hospital>) => void;
  addContact: (contact: Omit<EmergencyContact, "id">) => void;
  markContactsNotified: () => void;
  addNotification: (title: string, body: string, level?: AstraNotification["level"]) => void;
  resetDemo: () => void;
};

const defaultState: PersistedState = {
  hasOnboarded: false,
  isDemoMode: false,
  role: "patient",
  hospitals: demoHospitals,
  contacts: demoContacts,
  history: [],
  notifications: [],
};

const AstraContext = createContext<AstraContextValue | undefined>(undefined);

function createNotification(title: string, body: string, level: AstraNotification["level"] = "info", emergencyId?: string): AstraNotification {
  return { id: `notice-${Date.now()}-${Math.random().toString(16).slice(2)}`, title, body, level, createdAt: new Date().toISOString(), emergencyId };
}

export function AstraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<EmergencySession | undefined>();
  const [liveLocation, setLiveLocation] = useState<Coordinates>(demoLocation);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setState({ ...defaultState, ...JSON.parse(saved) });
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  const setCurrentLocation = useCallback((location: Coordinates) => {
    setLiveLocation(location);
    setActiveEmergency((previous) => (previous ? { ...previous, patientLocation: location } : previous));
  }, []);

  const addNotification = useCallback(
    (title: string, body: string, level: AstraNotification["level"] = "info") => {
      setState((previous) => ({
        ...previous,
        notifications: [createNotification(title, body, level, activeEmergency?.id), ...previous.notifications].slice(0, 30),
      }));
    },
    [activeEmergency?.id]
  );

  const beginEmergency = useCallback(
    (type: EmergencyType, location = liveLocation, intakeOptions?: Partial<IntakeOptions>) => {
      const intakePacket: ClinicalIntakePacket = parseClinicalIntake({
        transcript: intakeOptions?.transcript ?? "",
        language: intakeOptions?.language,
        selectedType: type,
      });

      const ranked = engine.rank(type, location, state.hospitals);
      const sentAt = new Date().toISOString();
      const acceptanceRequests: AcceptanceRequest[] = createAcceptanceRequests(
        ranked.map(({ hospital }) => hospital),
        sentAt
      );

      const emergencyId = `ASTRA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const auditEvents: AstraAuditEvent[] = [
        createAuditEvent(emergencyId, "EMERGENCY_CREATED", state.role, `Emergency session initiated for ${type}`),
        createAuditEvent(emergencyId, "CLINICAL_INTAKE_PARSED", state.role, `Intake parsed: ${intakePacket.suspectedCondition}`, { intakePacket }),
        createAuditEvent(emergencyId, "HOSPITAL_MATCHED", "admin", `${ranked.length} candidate hospitals matched`),
        createAuditEvent(emergencyId, "REFERRAL_SENT", state.role, `Referral packet sent to ${acceptanceRequests.length} receiving facilities`),
      ];

      const session: EmergencySession = {
        id: emergencyId,
        type,
        startedAt: sentAt,
        status: acceptanceRequests.length ? "waiting_acceptance" : "fallback",
        currentState: acceptanceRequests.length ? "PENDING_ACCEPTANCE" : "FAILOVER",
        patientLocation: location,
        recommendation: ranked[0]?.score,
        requiredCapabilities: requiredCapabilities(type),
        acceptanceRequests,
        intakePacket,
        auditEvents,
        acuity: intakePacket.acuity !== "UNKNOWN" ? intakePacket.acuity : type === "unknown" ? "critical" : "high",
        onsetMinutes: typeof intakePacket.onsetMinutes === "number" ? intakePacket.onsetMinutes : undefined,
        notes: [
          acceptanceRequests.length
            ? `${acceptanceRequests.length} acceptance requests sent to suitable receiving facilities.`
            : "No capability-adequate hospital found; following standing emergency protocol.",
        ],
        contactsNotified: false,
      };

      setActiveEmergency(session);
      setState((previous) => ({
        ...previous,
        notifications: [createNotification("Emergency activated", `ASTRA derived required capabilities for ${type}.`, "urgent", session.id), ...previous.notifications],
      }));
      return session;
    },
    [state.hospitals, state.role, liveLocation]
  );

  const selectHospital = useCallback((hospitalId: string) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const audit = createAuditEvent(previous.id, "CLINICAL_DATA_UPDATED", "crew", `Hospital ${hospitalId} selected by user`);
      const updated: EmergencySession = {
        ...previous,
        selectedHospitalId: hospitalId,
        status: "active" as const,
        notes: [...previous.notes, "Destination selected by user."],
        auditEvents: [...(previous.auditEvents ?? []), audit],
      };
      setState((current) => ({
        ...current,
        notifications: [createNotification("Hospital destination chosen", "The selected hospital is active in this session.", "success", updated.id), ...current.notifications],
      }));
      return updated;
    });
  }, []);

  const requestAmbulance = useCallback(() => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const ambulance = {
        id: "amb-17",
        vehicleId: "ASTRA-AMB-17",
        status: "dispatched" as const,
        etaMinutes: 6,
        location: { latitude: 12.967, longitude: 77.585, label: "Ambulance en route" },
        driverName: "Rahul K.",
      };
      const updated = { ...previous, ambulance, notes: [...previous.notes, "Simulated ambulance dispatched."] };
      setState((current) => ({
        ...current,
        notifications: [createNotification("Ambulance dispatched", "ASTRA-AMB-17 is en route. Estimated arrival: 6 min.", "success", updated.id), ...current.notifications],
      }));
      return updated;
    });
  }, []);

  const updateAmbulanceStatus = useCallback((status: AmbulanceStatus) => {
    setActiveEmergency((previous) =>
      previous?.ambulance ? { ...previous, ambulance: { ...previous.ambulance, status, etaMinutes: Math.max(0, previous.ambulance.etaMinutes - 1) } } : previous
    );
  }, []);

  const requestHospitalClarification = useCallback((notes: string, hospitalId?: string) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const targetId = hospitalId ?? previous.selectedHospitalId ?? previous.recommendation?.hospitalId;
      if (!targetId) return previous;
      const updatedRequests = clarifyAcceptance(previous.acceptanceRequests ?? [], targetId, notes);
      const audit = createAuditEvent(previous.id, "CLINICAL_INTAKE_PARSED", "staff", `Clarification requested by hospital ${targetId}: ${notes}`, { hospitalId: targetId, notes });
      const updated: EmergencySession = {
        ...previous,
        status: "waiting_acceptance",
        currentState: "CLARIFICATION_REQUIRED",
        clarificationQuestion: notes,
        acceptanceRequests: updatedRequests,
        notes: [...previous.notes, `Hospital ${targetId} requested clinical clarification before acceptance.`],
        auditEvents: [...(previous.auditEvents ?? []), audit],
      };
      setState((current) => ({
        ...current,
        notifications: [createNotification("Clarification requested", notes || "Hospital requested clarification before accepting the referral.", "warning", updated.id), ...current.notifications],
      }));
      return updated;
    });
  }, []);

  const respondToClarification = useCallback((answerText: string) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const targetReq = (previous.acceptanceRequests ?? []).find((req) => req.status === "needs_clarification");
      const targetId = targetReq?.hospitalId ?? previous.selectedHospitalId ?? previous.recommendation?.hospitalId;
      if (!targetId) return previous;

      const updatedRequests = answerClarification(previous.acceptanceRequests ?? [], targetId, answerText);
      const audit = createAuditEvent(previous.id, "CLINICAL_INTAKE_PARSED", "crew", `Clarification answered: ${answerText}`, { answerText });

      const updated: EmergencySession = {
        ...previous,
        status: "waiting_acceptance",
        currentState: "PENDING_ACCEPTANCE",
        clarificationAnswer: answerText,
        acceptanceRequests: updatedRequests,
        notes: [...previous.notes, `Clarification provided: "${answerText}". Referral active for acceptance decision.`],
        auditEvents: [...(previous.auditEvents ?? []), audit],
      };
      setState((current) => ({
        ...current,
        notifications: [createNotification("Clarification sent", "Response shared with receiving hospital coordinator.", "info", updated.id), ...current.notifications],
      }));
      return updated;
    });
  }, []);

  const acceptHospitalDecision = useCallback((hospitalId?: string) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const destinationId = hospitalId ?? previous.selectedHospitalId ?? previous.recommendation?.hospitalId;
      if (!destinationId) return previous;

      const { destinationId: confirmedId, requests: updatedRequests } = resolveAcceptance(previous.acceptanceRequests ?? [], destinationId);

      const auditAccepted = createAuditEvent(previous.id, "REFERRAL_ACCEPTED", "staff", `Hospital ${confirmedId} accepted the referral`, { hospitalId: confirmedId });
      const auditLocked = createAuditEvent(previous.id, "DESTINATION_CONFIRMED", "system" as UserRole, `Destination locked to ${confirmedId}`);

      const updated: EmergencySession = {
        ...previous,
        hospitalAccepted: true,
        selectedHospitalId: confirmedId,
        status: "destination_locked",
        currentState: "DESTINATION_CONFIRMED",
        acceptanceRequests: updatedRequests,
        notes: [...previous.notes, `Hospital ${confirmedId} accepted pre-alert; destination confirmed and locked.`],
        auditEvents: [...(previous.auditEvents ?? []), auditAccepted, auditLocked],
      };

      setState((current) => ({
        ...current,
        notifications: [createNotification("Destination Confirmed", "Receiving hospital explicitly accepted referral.", "success", updated.id), ...current.notifications],
      }));
      return updated;
    });
  }, []);

  const declineHospitalDecision = useCallback(
    (hospitalId?: string, reason: DeclineReason = "capability_unavailable", notes?: string) => {
      setActiveEmergency((previous) => {
        if (!previous) return previous;
        const targetId = hospitalId ?? previous.selectedHospitalId ?? previous.recommendation?.hospitalId;
        if (!targetId) return previous;

        const updatedRequests = declineAcceptance(previous.acceptanceRequests ?? [], targetId, reason, notes);

        const audit = createAuditEvent(previous.id, "REFERRAL_DECLINED", "staff", `Hospital ${targetId} declined referral: ${reason}`, { hospitalId: targetId, reason, notes });

        // Update hospital readiness to limited/unavailable in store
        const updatedHospitals = state.hospitals.map((h) => (h.id === targetId ? { ...h, readiness: "unavailable" as const, beds: { ...h.beds, icu: 0 } } : h));

        const nextBest = engine.rank(previous.type, previous.patientLocation, updatedHospitals)[0];

        const updated: EmergencySession = {
          ...previous,
          hospitalAccepted: false,
          selectedHospitalId: nextBest?.hospital.id,
          recommendation: nextBest?.score,
          status: nextBest ? "escalated" : "fallback",
          currentState: nextBest ? "NEXT_CANDIDATE" : "FAILOVER",
          acceptanceRequests: updatedRequests,
          notes: [
            ...previous.notes,
            nextBest
              ? `Hospital ${targetId} declined (${reason.replace("_", " ")}). Escalating to next suitable candidate ${nextBest.hospital.name}.`
              : `Hospital ${targetId} declined. No other suitable hospital confirmed. Activating safe failover protocol.`,
          ],
          auditEvents: [...(previous.auditEvents ?? []), audit],
        };

        setState((current) => ({
          ...current,
          hospitals: updatedHospitals,
          notifications: [
            createNotification(
              "Hospital Referral Declined",
              nextBest ? `Escalated to ${nextBest.hospital.name}.` : "No confirmed hospital acceptance. Safe failover required.",
              "warning",
              updated.id
            ),
            ...current.notifications,
          ],
        }));
        return updated;
      });
    },
    [state.hospitals]
  );

  const setHospitalDecision = useCallback(
    (accepted: boolean) => {
      if (accepted) {
        acceptHospitalDecision();
      } else {
        declineHospitalDecision(undefined, "capability_unavailable", "Hospital coordinator indicated inability to receive.");
      }
    },
    [acceptHospitalDecision, declineHospitalDecision]
  );

  const completeEmergency = useCallback(() => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const completed = { ...previous, status: "completed" as const, notes: [...previous.notes, "Emergency session completed in demo mode."] };
      setState((current) => ({
        ...current,
        history: [completed, ...current.history],
        notifications: [createNotification("Emergency session completed", `${completed.id} stored in history.`, "success", completed.id), ...current.notifications],
      }));
      return undefined;
    });
  }, []);

  const value = useMemo<AstraContextValue>(
    () => ({
      ...state,
      hydrated,
      currentLocation: activeEmergency?.patientLocation ?? liveLocation,
      setCurrentLocation,
      activeEmergency,
      setRole: (role) => setState((previous) => ({ ...previous, role })),
      completeOnboarding: () => setState((previous) => ({ ...previous, hasOnboarded: true })),
      enterDemoMode: () => setState((previous) => ({ ...previous, hasOnboarded: true, isDemoMode: true, role: "patient" })),
      beginEmergency,
      selectHospital,
      requestAmbulance,
      updateAmbulanceStatus,
      setHospitalDecision,
      acceptHospitalDecision,
      declineHospitalDecision,
      requestHospitalClarification,
      respondToClarification,
      completeEmergency,
      updateHospital: (hospitalId, update) =>
        setState((previous) => ({
          ...previous,
          hospitals: previous.hospitals.map((hospital) => (hospital.id === hospitalId ? { ...hospital, ...update, dataLastUpdated: new Date().toISOString() } : hospital)),
        })),
      addContact: (contact) => setState((previous) => ({ ...previous, contacts: [...previous.contacts, { ...contact, id: `contact-${Date.now()}` }].sort((a, b) => a.priority - b.priority) })),
      markContactsNotified: () =>
        setActiveEmergency((previous) => (previous ? { ...previous, contactsNotified: true, notes: [...previous.notes, "Emergency contacts alerted in simulated notification channel."] } : previous)),
      addNotification,
      resetDemo: () => {
        setState(defaultState);
        setActiveEmergency(undefined);
        setLiveLocation(demoLocation);
      },
    }),
    [
      state,
      hydrated,
      activeEmergency,
      liveLocation,
      beginEmergency,
      selectHospital,
      requestAmbulance,
      updateAmbulanceStatus,
      setHospitalDecision,
      acceptHospitalDecision,
      declineHospitalDecision,
      requestHospitalClarification,
      respondToClarification,
      completeEmergency,
      addNotification,
      setCurrentLocation,
    ]
  );

  return <AstraContext.Provider value={value}>{children}</AstraContext.Provider>;
}

export function useAstra() {
  const context = useContext(AstraContext);
  if (!context) throw new Error("useAstra must be used inside AstraProvider");
  return context;
}
