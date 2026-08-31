export type UserRole = "patient" | "crew" | "doctor" | "family" | "staff" | "admin";

export type EmergencyType =
  | "cardiac"
  | "stroke"
  | "trauma"
  | "respiratory"
  | "bleeding"
  | "burns"
  | "obstetric"
  | "pediatric"
  | "general"
  | "unknown";

export type Readiness = "ready" | "limited" | "unavailable" | "unknown";
export type SpecialistStatus = "available" | "on_call" | "busy" | "unavailable" | "unknown";
export type AmbulanceStatus = "requested" | "dispatched" | "arriving" | "picked_up" | "en_route" | "arrived";
export type EmergencyStatus = "created" | "classifying" | "searching" | "requests_sent" | "waiting_acceptance" | "accepted" | "destination_locked" | "en_route" | "arrived" | "completed" | "declined" | "timeout" | "escalated" | "fallback" | "cancelled" | "selecting" | "recommended" | "active" | "redirected";
export type VerificationStatus = "verified" | "unverified" | "expired" | "unknown";
export type CapabilityKey = "CT" | "MRI" | "ECG" | "CathLab" | "Thrombectomy" | "Neurology" | "Cardiology" | "TraumaCentre" | "EmergencySurgery" | "ICU" | "PICU" | "NICU" | "BloodBank" | "Dialysis" | "BurnsUnit" | "VentilatorSupport" | "EmergencyDepartment" | "ObstetricEmergency" | "PediatricEmergency";
export type DeclineReason = "capability_unavailable" | "clinical_team_unavailable" | "capacity_unavailable" | "department_saturated" | "equipment_unavailable" | "patient_unsuitable" | "other";

export interface CapabilityAttestation { available: boolean; verificationStatus: VerificationStatus; source: string; attestedBy: string; lastVerified: string; }

export interface Coordinates {
  latitude: number;
  longitude: number;
  label: string;
}

export interface Specialist {
  id: string;
  name: string;
  specialty: string;
  status: SpecialistStatus;
  lastUpdated: string;
}

export interface BedInventory {
  icu: number;
  emergency: number;
  general: number;
  ventilators: number;
}

export interface Hospital {
  id: string;
  name: string;
  type: "Public" | "Private" | "Teaching";
  address: string;
  phone: string;
  location: Coordinates;
  readiness: Readiness;
  beds: BedInventory;
  specialties: string[];
  facilities: string[];
  specialists: Specialist[];
  ambulanceAvailable: boolean;
  traffic: "light" | "moderate" | "heavy";
  dataLastUpdated: string;
  dataSource: "ASTRA DEMO";
  isVerified: boolean;
  /** True only when this facility has passed the promotion boundary for routing. */
  routingCandidate?: boolean;
  layer?: 1 | 2 | 3 | 4;
  classifications?: string[];
  verificationStatus?: VerificationStatus;
  lastVerified?: string;
  verifiedBy?: string;
  capabilities?: Partial<Record<CapabilityKey, CapabilityAttestation>>;
}

export interface HospitalScore {
  hospitalId: string;
  overall: number;
  clinical: number;
  availability: number;
  specialist: number;
  travel: number;
  readiness: number;
  freshness: number;
  distanceKm: number;
  etaMinutes: number;
  reasons: string[];
  eligible?: boolean;
  gateFailures?: string[];
  scoringVersion?: string;
}

export interface RankedHospital {
  hospital: Hospital;
  score: HospitalScore;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
}

export interface Ambulance {
  id: string;
  vehicleId: string;
  status: AmbulanceStatus;
  etaMinutes: number;
  location: Coordinates;
  driverName: string;
}

export interface EmergencySession {
  id: string;
  type: EmergencyType;
  startedAt: string;
  status: EmergencyStatus;
  patientLocation: Coordinates;
  selectedHospitalId?: string;
  recommendation?: HospitalScore;
  ambulance?: Ambulance;
  hospitalAccepted?: boolean;
  contactsNotified: boolean;
  notes: string[];
  acuity?: "low" | "moderate" | "high" | "critical";
  onsetMinutes?: number;
  requiredCapabilities?: CapabilityKey[];
  acceptanceRequests?: AcceptanceRequest[];
  finalOutcome?: "arrived" | "fallback" | "cancelled";
}

export type AcceptanceStatus = "pending" | "accepted" | "declined" | "needs_clarification" | "timeout" | "assigned_elsewhere";

export interface AcceptanceRequest { id: string; hospitalId: string; status: AcceptanceStatus; sentAt: string; expiresAt?: string; respondedAt?: string; declineReason?: DeclineReason; declineNotes?: string; clarificationNotes?: string; responderName?: string; }

export interface AstraNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  level: "info" | "success" | "warning" | "urgent";
  emergencyId?: string;
}

export const emergencyLabels: Record<EmergencyType, string> = {
  cardiac: "Heart / chest pain",
  stroke: "Stroke symptoms",
  trauma: "Serious accident",
  respiratory: "Breathing difficulty",
  bleeding: "Severe bleeding",
  burns: "Burns",
  obstetric: "Pregnancy emergency",
  pediatric: "Child emergency",
  general: "General emergency",
  unknown: "I don’t know",
};

