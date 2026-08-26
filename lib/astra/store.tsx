import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoContacts, demoHospitals, demoLocation } from "@/data/demo";
import { HospitalRecommendationEngine } from "@/lib/astra/recommendation";
import type { AmbulanceStatus, AstraNotification, Coordinates, EmergencyContact, EmergencySession, EmergencyType, Hospital, UserRole } from "@/types/astra";

const STORAGE_KEY = "astra.demo.state.v1";
const engine = new HospitalRecommendationEngine();

type PersistedState = {
  hasOnboarded: boolean;
  role: UserRole;
  hospitals: Hospital[];
  contacts: EmergencyContact[];
  history: EmergencySession[];
  notifications: AstraNotification[];
};

type AstraContextValue = PersistedState & {
  hydrated: boolean;
  currentLocation: Coordinates;
  activeEmergency?: EmergencySession;
  setRole: (role: UserRole) => void;
  completeOnboarding: () => void;
  beginEmergency: (type: EmergencyType, location?: Coordinates) => EmergencySession;
  selectHospital: (hospitalId: string) => void;
  requestAmbulance: () => void;
  updateAmbulanceStatus: (status: AmbulanceStatus) => void;
  setHospitalDecision: (accepted: boolean) => void;
  completeEmergency: () => void;
  updateHospital: (hospitalId: string, update: Partial<Hospital>) => void;
  addContact: (contact: Omit<EmergencyContact, "id">) => void;
  markContactsNotified: () => void;
  addNotification: (title: string, body: string, level?: AstraNotification["level"]) => void;
  resetDemo: () => void;
};

const defaultState: PersistedState = { hasOnboarded: false, role: "patient", hospitals: demoHospitals, contacts: demoContacts, history: [], notifications: [] };
const AstraContext = createContext<AstraContextValue | undefined>(undefined);

function createNotification(title: string, body: string, level: AstraNotification["level"] = "info", emergencyId?: string): AstraNotification {
  return { id: `notice-${Date.now()}-${Math.random().toString(16).slice(2)}`, title, body, level, createdAt: new Date().toISOString(), emergencyId };
}

export function AstraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<EmergencySession | undefined>();

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

  const addNotification = useCallback((title: string, body: string, level: AstraNotification["level"] = "info") => {
    setState((previous) => ({ ...previous, notifications: [createNotification(title, body, level, activeEmergency?.id), ...previous.notifications].slice(0, 30) }));
  }, [activeEmergency?.id]);

  const beginEmergency = useCallback((type: EmergencyType, location = demoLocation) => {
    const ranked = engine.rank(type, location, state.hospitals);
    const session: EmergencySession = {
      id: `ASTRA-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      type,
      startedAt: new Date().toISOString(),
      status: "recommended",
      patientLocation: location,
      recommendation: ranked[0]?.score,
      notes: ["Emergency session created with simulated location."],
      contactsNotified: false,
    };
    setActiveEmergency(session);
    setState((previous) => ({ ...previous, notifications: [createNotification("Emergency activated", `ASTRA is ranking suitable hospitals for ${type}.`, "urgent", session.id), ...previous.notifications] }));
    return session;
  }, [state.hospitals]);

  const selectHospital = useCallback((hospitalId: string) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, selectedHospitalId: hospitalId, status: "active" as const, notes: [...previous.notes, "Destination confirmed by user."] };
      setState((current) => ({ ...current, notifications: [createNotification("Hospital destination confirmed", "The selected hospital has been added to this emergency session.", "success", updated.id), ...current.notifications] }));
      return updated;
    });
  }, []);

  const requestAmbulance = useCallback(() => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const ambulance = { id: "amb-17", vehicleId: "ASTRA-AMB-17", status: "dispatched" as const, etaMinutes: 6, location: { latitude: 12.967, longitude: 77.585, label: "Ambulance en route" }, driverName: "Rahul K." };
      const updated = { ...previous, ambulance, notes: [...previous.notes, "Simulated ambulance dispatched."] };
      setState((current) => ({ ...current, notifications: [createNotification("Ambulance dispatched", "ASTRA-AMB-17 is en route. Estimated arrival: 6 min.", "success", updated.id), ...current.notifications] }));
      return updated;
    });
  }, []);

  const updateAmbulanceStatus = useCallback((status: AmbulanceStatus) => {
    setActiveEmergency((previous) => previous?.ambulance ? { ...previous, ambulance: { ...previous.ambulance, status, etaMinutes: Math.max(0, previous.ambulance.etaMinutes - 1) } } : previous);
  }, []);

  const setHospitalDecision = useCallback((accepted: boolean) => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      if (accepted) {
        const updated = { ...previous, hospitalAccepted: true, notes: [...previous.notes, "Hospital accepted simulated pre-alert."] };
        setState((current) => ({ ...current, notifications: [createNotification("Hospital accepted pre-alert", "The destination confirmed emergency readiness.", "success", updated.id), ...current.notifications] }));
        return updated;
      }
      const unavailableId = previous.selectedHospitalId;
      const hospitals = state.hospitals.map((hospital) => hospital.id === unavailableId ? { ...hospital, readiness: "unavailable" as const, beds: { ...hospital.beds, icu: 0 } } : hospital);
      const newBest = engine.rank(previous.type, previous.patientLocation, hospitals)[0];
      const updated = { ...previous, hospitalAccepted: false, selectedHospitalId: newBest?.hospital.id, recommendation: newBest?.score, status: "redirected" as const, notes: [...previous.notes, "Original hospital unavailable; explicit alternative recommended."] };
      setState((current) => ({ ...current, hospitals, notifications: [createNotification("Hospital availability changed", `ASTRA recommends ${newBest?.hospital.name ?? "an alternative hospital"}. Review before continuing.`, "warning", updated.id), ...current.notifications] }));
      return updated;
    });
  }, [state.hospitals]);

  const completeEmergency = useCallback(() => {
    setActiveEmergency((previous) => {
      if (!previous) return previous;
      const completed = { ...previous, status: "completed" as const, notes: [...previous.notes, "Emergency session completed in demo mode."] };
      setState((current) => ({ ...current, history: [completed, ...current.history], notifications: [createNotification("Emergency session completed", `${completed.id} is now stored in local demo history.`, "success", completed.id), ...current.notifications] }));
      return undefined;
    });
  }, []);

  const value = useMemo<AstraContextValue>(() => ({
    ...state,
    hydrated,
    currentLocation: activeEmergency?.patientLocation ?? demoLocation,
    activeEmergency,
    setRole: (role) => setState((previous) => ({ ...previous, role })),
    completeOnboarding: () => setState((previous) => ({ ...previous, hasOnboarded: true })),
    beginEmergency,
    selectHospital,
    requestAmbulance,
    updateAmbulanceStatus,
    setHospitalDecision,
    completeEmergency,
    updateHospital: (hospitalId, update) => setState((previous) => ({ ...previous, hospitals: previous.hospitals.map((hospital) => hospital.id === hospitalId ? { ...hospital, ...update, dataLastUpdated: new Date().toISOString() } : hospital) })),
    addContact: (contact) => setState((previous) => ({ ...previous, contacts: [...previous.contacts, { ...contact, id: `contact-${Date.now()}` }].sort((a, b) => a.priority - b.priority) })),
    markContactsNotified: () => setActiveEmergency((previous) => previous ? { ...previous, contactsNotified: true, notes: [...previous.notes, "Emergency contacts alerted in simulated notification channel."] } : previous),
    addNotification,
    resetDemo: () => { setState(defaultState); setActiveEmergency(undefined); },
  }), [state, hydrated, activeEmergency, beginEmergency, selectHospital, requestAmbulance, updateAmbulanceStatus, setHospitalDecision, completeEmergency, addNotification]);

  return <AstraContext.Provider value={value}>{children}</AstraContext.Provider>;
}

export function useAstra() {
  const context = useContext(AstraContext);
  if (!context) throw new Error("useAstra must be used inside AstraProvider");
  return context;
}

