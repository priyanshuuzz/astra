import type { CapabilityKey, ClinicalIntakePacket, EmergencyType } from "../../types/astra";
import { requiredCapabilities } from "./recommendation";

export interface IntakeOptions {
  transcript: string;
  language?: "en" | "hi" | "hinglish";
  selectedType?: EmergencyType;
}

const conditionMap: Record<EmergencyType, string> = {
  cardiac: "Possible cardiac event",
  stroke: "Possible stroke",
  trauma: "Possible trauma / severe injury",
  respiratory: "Possible respiratory distress",
  bleeding: "Possible severe haemorrhage",
  burns: "Possible severe burn injury",
  obstetric: "Possible obstetric emergency",
  pediatric: "Possible pediatric emergency",
  snakebite: "Possible envenomation / snakebite",
  general: "Possible general emergency",
  unknown: "Possible acute medical emergency",
};

/**
 * Extracts structured clinical intake details from voice/text transcripts in EN, HI, or Hinglish.
 * Never fabricates clinical facts; uses "UNKNOWN" when details are missing.
 */
export function parseClinicalIntake(options: IntakeOptions): ClinicalIntakePacket {
  const text = (options.transcript || "").trim();
  const lower = text.toLowerCase();
  const language = options.language ?? detectLanguage(text);

  let detectedType: EmergencyType = options.selectedType ?? "unknown";

  if (options.selectedType === undefined || options.selectedType === "unknown") {
    if (lower.includes("chest pain") || lower.includes("heart") || lower.includes("dil ka daura") || lower.includes("syncope") || lower.includes("ecg")) {
      detectedType = "cardiac";
    } else if (lower.includes("stroke") || lower.includes("paralysis") || lower.includes("face drooping") || lower.includes("lakwa") || lower.includes("speech")) {
      detectedType = "stroke";
    } else if (lower.includes("snake") || lower.includes("saamp") || lower.includes("bite") || lower.includes("dasa") || lower.includes("poison")) {
      detectedType = "snakebite";
    } else if (lower.includes("accident") || lower.includes("bleeding") || lower.includes("fracture") || lower.includes("trauma") || lower.includes("khoon")) {
      detectedType = lower.includes("bleeding") || lower.includes("khoon") ? "bleeding" : "trauma";
    } else if (lower.includes("breath") || lower.includes("saans") || lower.includes("asthma") || lower.includes("suffocating")) {
      detectedType = "respiratory";
    } else if (lower.includes("burn") || lower.includes("jal") || lower.includes("fire")) {
      detectedType = "burns";
    } else if (lower.includes("pregnant") || lower.includes("delivery") || lower.includes("garbhavati") || lower.includes("labour")) {
      detectedType = "obstetric";
    } else if (lower.includes("child") || lower.includes("baby") || lower.includes("baccha") || lower.includes("kid")) {
      detectedType = "pediatric";
    }
  }

  const extractedSymptoms: string[] = [];
  if (lower.includes("chest pain") || lower.includes("dil me dard")) extractedSymptoms.push("Chest pain");
  if (lower.includes("breath") || lower.includes("saans")) extractedSymptoms.push("Shortness of breath");
  if (lower.includes("paralysis") || lower.includes("lakwa") || lower.includes("weakness")) extractedSymptoms.push("Focal weakness / motor deficit");
  if (lower.includes("speech") || lower.includes("bolne me dikkat")) extractedSymptoms.push("Slurred / dysphasic speech");
  if (lower.includes("snake") || lower.includes("saamp")) extractedSymptoms.push("Suspected snakebite mark");
  if (lower.includes("bleed") || lower.includes("khoon")) extractedSymptoms.push("Active bleeding");
  if (lower.includes("unconscious") || lower.includes("behosh")) extractedSymptoms.push("Altered consciousness");

  if (extractedSymptoms.length === 0) {
    if (text.length > 0) {
      extractedSymptoms.push(`Reported: "${text.length > 50 ? text.slice(0, 47) + "..." : text}"`);
    } else {
      extractedSymptoms.push("No specific symptoms reported");
    }
  }

  // Extract onset/time if stated
  let onsetMinutes: number | "UNKNOWN" = "UNKNOWN";
  const timeMatch = lower.match(/(\d+)\s*(min|minute|hour|hr|gante|ghante)/i);
  if (timeMatch) {
    const val = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2];
    if (unit.startsWith("hour") || unit.startsWith("hr") || unit.startsWith("gant") || unit.startsWith("ghant")) {
      onsetMinutes = val * 60;
    } else {
      onsetMinutes = val;
    }
  } else if (lower.includes("just now") || lower.includes("abhi")) {
    onsetMinutes = 10;
  }

  // Determine acuity conservatively
  let acuity: ClinicalIntakePacket["acuity"] = "UNKNOWN";
  if (detectedType === "cardiac" || detectedType === "stroke" || detectedType === "snakebite" || lower.includes("unconscious") || lower.includes("behosh")) {
    acuity = "critical";
  } else if (detectedType === "trauma" || detectedType === "respiratory" || detectedType === "bleeding") {
    acuity = "high";
  } else if (text.length > 0) {
    acuity = "moderate";
  }

  const required = requiredCapabilities(detectedType);

  const clarificationQuestions: string[] = [];
  if (onsetMinutes === "UNKNOWN") {
    clarificationQuestions.push("What is the exact time or duration since symptom onset?");
  }
  if (detectedType === "stroke" && !lower.includes("anticoagulant") && !lower.includes("blood thinner")) {
    clarificationQuestions.push("Is the patient currently taking blood thinners / anticoagulants?");
  }
  if (detectedType === "snakebite") {
    clarificationQuestions.push("Is there any neurotoxic symptom (ptosis, difficulty swallowing, breathlessness)?");
  }

  const confidence = text.length > 0 ? (extractedSymptoms.length > 1 && onsetMinutes !== "UNKNOWN" ? 90 : 75) : 50;

  return {
    originalTranscript: text,
    language,
    suspectedCondition: conditionMap[detectedType],
    extractedSymptoms,
    onsetMinutes,
    acuity,
    requiredCapabilities: required,
    confidence,
    clarificationQuestions: clarificationQuestions.length > 0 ? clarificationQuestions : undefined,
  };
}

function detectLanguage(text: string): "en" | "hi" | "hinglish" {
  const lower = text.toLowerCase();
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/\b(dil|saans|dard|saamp|khoon|garbhavati|baccha|lakwa|behosh|abhi|ghante)\b/.test(lower)) return "hinglish";
  return "en";
}
