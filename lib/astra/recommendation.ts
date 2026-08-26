import type { Coordinates, EmergencyType, Hospital, HospitalScore, RankedHospital } from "@/types/astra";

const requirements: Record<EmergencyType, { specialties: string[]; facilities: string[] }> = {
  cardiac: { specialties: ["Cardiology", "Critical Care"], facilities: ["Cath Lab", "Cardiac ICU"] },
  stroke: { specialties: ["Neurology", "Stroke Care"], facilities: ["CT", "MRI"] },
  trauma: { specialties: ["Trauma", "Emergency Surgery", "Anesthesia"], facilities: ["Level I Trauma Centre", "Emergency Surgery", "CT"] },
  respiratory: { specialties: ["Pulmonology", "Critical Care"], facilities: ["Respiratory ICU", "Ventilation"] },
  bleeding: { specialties: ["Emergency Medicine", "General Surgery"], facilities: ["Blood Bank", "Emergency Surgery"] },
  burns: { specialties: ["Burns", "Plastic Surgery"], facilities: ["Burn Unit", "ICU"] },
  obstetric: { specialties: ["Obstetrics", "Maternal Fetal Medicine"], facilities: ["Labour Emergency", "Operating Theatre"] },
  pediatric: { specialties: ["Pediatrics", "Pediatric Trauma"], facilities: ["PICU", "Pediatric Emergency"] },
  general: { specialties: ["Emergency Medicine"], facilities: ["Emergency Unit"] },
  unknown: { specialties: ["Emergency Medicine", "Trauma"], facilities: ["Emergency Unit", "CT"] },
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const norm = (value: string) => value.toLowerCase();

export function distanceKm(origin: Coordinates, destination: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(destination.latitude - origin.latitude);
  const dLon = radians(destination.longitude - origin.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function freshnessScore(isoDate: string, now = Date.now()): number {
  const ageMinutes = Math.max(0, (now - new Date(isoDate).getTime()) / 60_000);
  if (ageMinutes <= 5) return 100;
  if (ageMinutes <= 15) return 82;
  if (ageMinutes <= 30) return 56;
  return 20;
}

function readinessScore(readiness: Hospital["readiness"]): number {
  return { ready: 100, limited: 58, unavailable: 0, unknown: 30 }[readiness];
}

export function estimateTravelMinutes(distance: number, traffic: Hospital["traffic"]): number {
  const trafficMultiplier = { light: 1, moderate: 1.35, heavy: 1.85 }[traffic];
  return Math.max(3, Math.round(distance * 2.25 * trafficMultiplier + 2));
}

export class HospitalRecommendationEngine {
  score(type: EmergencyType, patientLocation: Coordinates, hospital: Hospital, now = Date.now()): HospitalScore {
    const required = requirements[type];
    const hospitalText = [...hospital.specialties, ...hospital.facilities].map(norm);
    const specialtyMatches = required.specialties.filter((item) => hospitalText.includes(norm(item))).length;
    const facilityMatches = required.facilities.filter((item) => hospitalText.includes(norm(item))).length;
    const clinical = clamp(35 + (specialtyMatches / Math.max(required.specialties.length, 1)) * 40 + (facilityMatches / Math.max(required.facilities.length, 1)) * 25);
    const availableSpecialists = hospital.specialists.filter((person) => person.status === "available" || person.status === "on_call");
    const specialistMatches = availableSpecialists.filter((person) => required.specialties.some((item) => norm(person.specialty) === norm(item))).length;
    const specialist = clamp(28 + (specialistMatches / Math.max(required.specialties.length, 1)) * 72);
    const availability = clamp((hospital.beds.icu > 0 ? 48 : 0) + Math.min(32, hospital.beds.emergency * 2.7) + Math.min(20, hospital.beds.ventilators * 2));
    const distance = distanceKm(patientLocation, hospital.location);
    const eta = estimateTravelMinutes(distance, hospital.traffic);
    const travel = clamp(100 - eta * 5.4);
    const readiness = readinessScore(hospital.readiness);
    const freshness = freshnessScore(hospital.dataLastUpdated, now);
    const overall = Math.round(clamp(clinical * 0.30 + availability * 0.20 + specialist * 0.20 + travel * 0.15 + readiness * 0.10 + freshness * 0.05));
    const reasons = [
      specialtyMatches > 0 ? `${specialtyMatches} matched clinical capability${specialtyMatches > 1 ? "ies" : ""}` : "General emergency capability",
      hospital.beds.icu > 0 ? `${hospital.beds.icu} ICU bed${hospital.beds.icu === 1 ? "" : "s"} available` : "No confirmed ICU bed",
      `${eta} min estimated travel time`,
      freshness >= 82 ? "Recently confirmed capacity" : "Capacity data is aging",
    ];
    return { hospitalId: hospital.id, overall, clinical: Math.round(clinical), availability: Math.round(availability), specialist: Math.round(specialist), travel: Math.round(travel), readiness: Math.round(readiness), freshness: Math.round(freshness), distanceKm: Number(distance.toFixed(1)), etaMinutes: eta, reasons };
  }

  rank(type: EmergencyType, patientLocation: Coordinates, hospitals: Hospital[]): RankedHospital[] {
    return hospitals
      .filter((hospital) => hospital.readiness !== "unavailable")
      .map((hospital) => ({ hospital, score: this.score(type, patientLocation, hospital) }))
      .sort((a, b) => b.score.overall - a.score.overall);
  }
}

