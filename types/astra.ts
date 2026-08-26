export type UserRole = "patient" | "staff" | "admin";

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
export type EmergencyStatus = "selecting" | "recommended" | "active" | "completed" | "redirected";

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
}

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

