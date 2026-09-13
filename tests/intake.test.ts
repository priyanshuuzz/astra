import { describe, expect, it } from "vitest";
import { parseClinicalIntake } from "../lib/astra/intake";

describe("ASTRA Clinical Intake Engine", () => {
  it("extracts symptoms and onset from English voice transcript", () => {
    const intake = parseClinicalIntake({
      transcript: "Patient developed chest pain and shortness of breath 20 minutes ago.",
      language: "en",
    });

    expect(intake.suspectedCondition).toBe("Possible cardiac event");
    expect(intake.extractedSymptoms).toContain("Chest pain");
    expect(intake.extractedSymptoms).toContain("Shortness of breath");
    expect(intake.onsetMinutes).toBe(20);
    expect(intake.requiredCapabilities).toContain("ECG");
    expect(intake.requiredCapabilities).toContain("CathLab");
  });

  it("extracts symptoms from Hinglish intake for suspected stroke", () => {
    const intake = parseClinicalIntake({
      transcript: "Marez ko adha ghanta pehle lakwa aur bolne me dikkat shuru hui.",
      language: "hinglish",
    });

    expect(intake.language).toBe("hinglish");
    expect(intake.suspectedCondition).toBe("Possible stroke");
    expect(intake.extractedSymptoms).toContain("Focal weakness / motor deficit");
    expect(intake.extractedSymptoms).toContain("Slurred / dysphasic speech");
    expect(intake.requiredCapabilities).toContain("CT");
    expect(intake.requiredCapabilities).toContain("Neurology");
  });

  it("extracts symptoms from Hindi intake for snakebite emergency", () => {
    const intake = parseClinicalIntake({
      transcript: "रोगी को खेत में सांप ने काटा है।",
      language: "hi",
      selectedType: "snakebite",
    });

    expect(intake.suspectedCondition).toBe("Possible envenomation / snakebite");
    expect(intake.requiredCapabilities).toContain("Antivenom");
    expect(intake.requiredCapabilities).toContain("VentilatorSupport");
    expect(intake.requiredCapabilities).toContain("AnaphylaxisManagement");
    expect(intake.requiredCapabilities).toContain("RenalSupport");
  });

  it("uses UNKNOWN for missing onset time and never fabricates clinical details", () => {
    const intake = parseClinicalIntake({
      transcript: "Unclear symptoms reported by caller.",
      language: "en",
    });

    expect(intake.onsetMinutes).toBe("UNKNOWN");
    expect(intake.clarificationQuestions).toBeDefined();
    expect(intake.clarificationQuestions?.[0]).toContain("exact time or duration");
  });
});
