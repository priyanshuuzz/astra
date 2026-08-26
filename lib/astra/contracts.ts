import type { Coordinates, EmergencySession, Hospital, HospitalScore } from "@/types/astra";

export interface HospitalRepository {
  listHospitals(): Promise<Hospital[]>;
  updateHospital(id: string, changes: Partial<Hospital>): Promise<Hospital>;
}

export interface LocationService {
  getCurrentLocation(): Promise<Coordinates>;
}

export interface RoutingService {
  estimateRoute(origin: Coordinates, destination: Coordinates): Promise<{ distanceKm: number; etaMinutes: number }>;
}

export interface RecommendationService {
  rank(session: EmergencySession, hospitals: Hospital[]): HospitalScore[];
}

export interface AmbulanceService {
  request(session: EmergencySession): Promise<EmergencySession>;
}

export interface NotificationService {
  alert(title: string, body: string): Promise<void>;
}

