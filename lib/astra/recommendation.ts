import type { CapabilityKey, Coordinates, EmergencyType, Hospital, HospitalScore, RankedHospital } from "@/types/astra";

export const SCORING_VERSION = "1.0";
export const scoringWeights = { clinical: 0.35, travel: 0.30, readiness: 0.15, confidence: 0.10, reliability: 0.10 } as const;

const capabilityRequirements: Record<EmergencyType, CapabilityKey[]> = {
  cardiac: ["ECG", "Cardiology", "CathLab", "ICU"], stroke: ["CT", "Neurology"], trauma: ["TraumaCentre", "EmergencySurgery", "ICU", "BloodBank", "CT"], respiratory: ["EmergencyDepartment", "ICU", "VentilatorSupport"], bleeding: ["EmergencyDepartment", "BloodBank", "EmergencySurgery"], burns: ["BurnsUnit", "ICU"], obstetric: ["ObstetricEmergency", "EmergencySurgery"], pediatric: ["PediatricEmergency", "PICU"], general: ["EmergencyDepartment"], unknown: ["EmergencyDepartment"],
};
const aliases: Record<CapabilityKey, string[]> = { CT: ["ct"], MRI: ["mri"], ECG: ["ecg"], CathLab: ["cath lab", "cathlab"], Thrombectomy: ["thrombectomy"], Neurology: ["neurology", "stroke care"], Cardiology: ["cardiology"], TraumaCentre: ["trauma centre", "trauma center", "trauma"], EmergencySurgery: ["emergency surgery"], ICU: ["icu", "critical care", "cardiac icu"], PICU: ["picu"], NICU: ["nicu"], BloodBank: ["blood bank"], Dialysis: ["dialysis"], BurnsUnit: ["burn unit", "burns"], VentilatorSupport: ["ventilation", "ventilator", "respiratory icu"], EmergencyDepartment: ["emergency unit", "emergency department", "emergency"], ObstetricEmergency: ["obstetric", "labour emergency"], PediatricEmergency: ["pediatric emergency", "pediatric trauma", "pediatrics"] };

// Bolt optimization: Pre-allocated lookup maps avoid object literal instantiation on hot paths
const trafficMultipliers: Record<Hospital["traffic"], number> = { light: 1, moderate: 1.35, heavy: 1.85 };
const readinessScores: Record<Hospital["readiness"], number> = { ready: 100, limited: 58, unavailable: 0, unknown: 30 };

// Bolt optimization: Constant conversion factor avoids closure allocations in trig calculations
const DEG_TO_RAD = Math.PI / 180;

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const norm = (value: string) => value.toLowerCase().replace(/[×_]/g, " ").trim();

export function requiredCapabilities(type: EmergencyType): CapabilityKey[] { return capabilityRequirements[type]; }

export function distanceKm(origin: Coordinates, destination: Coordinates): number {
  const dLat = (destination.latitude - origin.latitude) * DEG_TO_RAD;
  const dLon = (destination.longitude - origin.longitude) * DEG_TO_RAD;
  const lat1 = origin.latitude * DEG_TO_RAD;
  const lat2 = destination.latitude * DEG_TO_RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function freshnessScore(isoDate: string, now = Date.now()): number {
  // Bolt optimization: Date.parse is faster than instantiating Date objects
  const ageMinutes = Math.max(0, (now - Date.parse(isoDate)) / 60_000);
  if (ageMinutes <= 5) return 100;
  if (ageMinutes <= 15) return 82;
  if (ageMinutes <= 30) return 56;
  return 20;
}

export function estimateTravelMinutes(distance: number, traffic: Hospital["traffic"]): number {
  return Math.max(3, Math.round(distance * 2.25 * trafficMultipliers[traffic] + 2));
}

export function isRoutingCandidate(hospital: Hospital): boolean {
  const { latitude, longitude } = hospital.location;
  const validCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const verificationAllowed = hospital.verificationStatus !== "expired" && hospital.verificationStatus !== "unknown";
  // Demo records predate the promotion flag; their explicit isVerified label keeps the offline demo working.
  const promoted = hospital.routingCandidate === undefined ? hospital.isVerified : hospital.routingCandidate;
  return promoted && hospital.isVerified && verificationAllowed && validCoordinates;
}

function readinessScore(readiness: Hospital["readiness"]): number {
  return readinessScores[readiness];
}

// Bolt optimization: Helper to build normalized haystack array once when fallback capability check is needed
function getHaystack(hospital: Hospital): string[] {
  const haystack: string[] = [];
  const specs = hospital.specialties;
  for (let i = 0; i < specs.length; i++) {
    haystack.push(norm(specs[i]));
  }
  const facs = hospital.facilities;
  for (let i = 0; i < facs.length; i++) {
    haystack.push(norm(facs[i]));
  }
  return haystack;
}

function checkCapabilityAliases(capability: CapabilityKey, haystack: string[]): boolean {
  const aliasList = aliases[capability];
  for (let i = 0; i < aliasList.length; i++) {
    const alias = aliasList[i];
    for (let j = 0; j < haystack.length; j++) {
      if (haystack[j].includes(alias)) return true;
    }
  }
  return false;
}

export class HospitalRecommendationEngine {
  score(type: EmergencyType, patientLocation: Coordinates, hospital: Hospital, now = Date.now()): HospitalScore {
    const required = requiredCapabilities(type);
    const gateFailures: CapabilityKey[] = [];
    let haystack: string[] | undefined;

    // Bolt optimization: Single-pass required capability checking with lazy haystack normalization
    for (let i = 0; i < required.length; i++) {
      const cap = required[i];
      const attestation = hospital.capabilities?.[cap];
      if (attestation) {
        if (!attestation.available || attestation.verificationStatus === "expired") {
          gateFailures.push(cap);
        }
        continue;
      }
      if (!haystack) {
        haystack = getHaystack(hospital);
      }
      if (!checkCapabilityAliases(cap, haystack)) {
        gateFailures.push(cap);
      }
    }

    const eligible = isRoutingCandidate(hospital) && gateFailures.length === 0 && hospital.readiness !== "unavailable";
    const matched = required.length - gateFailures.length; const clinical = clamp((matched / Math.max(required.length, 1)) * 100); const distance = distanceKm(patientLocation, hospital.location); const eta = estimateTravelMinutes(distance, hospital.traffic); const travel = clamp(100 - eta * 5.4); const readiness = readinessScore(hospital.readiness); const freshness = freshnessScore(hospital.dataLastUpdated, now); const confidence = hospital.verificationStatus === "verified" || hospital.isVerified ? 100 : hospital.verificationStatus === "unverified" ? 45 : 25; const reliability = hospital.isVerified ? 90 : 55; const specialist = clamp(hospital.specialists.some((person) => person.status === "available" || person.status === "on_call") ? 90 : 40); const overall = Math.round(clamp(clinical * scoringWeights.clinical + travel * scoringWeights.travel + readiness * scoringWeights.readiness + confidence * scoringWeights.confidence + reliability * scoringWeights.reliability));
    const reasons = eligible ? [`${matched}/${required.length} required capabilities verified`, `${eta} min estimated travel time`, freshness >= 82 ? "Registry status recently confirmed" : "Registry status is ageing"] : !isRoutingCandidate(hospital) ? ["Not an active verified routing candidate", "ASTRA requires verified capability and coordinate review before routing"] : [`Excluded by hard clinical gate: ${gateFailures.join(", ")}`, "ASTRA will not route to a capability-inadequate facility", `${eta} min estimated travel time`];
    return { hospitalId: hospital.id, overall, clinical: Math.round(clinical), availability: Math.round(readiness), specialist: Math.round(specialist), travel: Math.round(travel), readiness: Math.round(readiness), freshness: Math.round(freshness), distanceKm: Number(distance.toFixed(1)), etaMinutes: eta, reasons, eligible, gateFailures, scoringVersion: SCORING_VERSION };
  }
  rank(type: EmergencyType, patientLocation: Coordinates, hospitals: Hospital[]): RankedHospital[] { return hospitals.map((hospital) => ({ hospital, score: this.score(type, patientLocation, hospital) })).filter(({ score }) => score.eligible).sort((a, b) => b.score.overall - a.score.overall || a.score.etaMinutes - b.score.etaMinutes); }
  rankWithExcluded(type: EmergencyType, patientLocation: Coordinates, hospitals: Hospital[]): { eligible: RankedHospital[]; excluded: RankedHospital[] } { const scored = hospitals.map((hospital) => ({ hospital, score: this.score(type, patientLocation, hospital) })); return { eligible: scored.filter(({ score }) => score.eligible).sort((a, b) => b.score.overall - a.score.overall || a.score.etaMinutes - b.score.etaMinutes), excluded: scored.filter(({ score }) => !score.eligible).sort((a, b) => a.score.etaMinutes - b.score.etaMinutes) }; }
}
