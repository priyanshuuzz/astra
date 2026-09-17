import { describe, expect, it, beforeEach, vi } from "vitest";

describe("transcribeAudio SSRF and URL validation", () => {
  let transcribeAudio: typeof import("../server/_core/voiceTranscription").transcribeAudio;

  beforeEach(async () => {
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.example.com";
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
    vi.resetModules();
    const mod = await import("../server/_core/voiceTranscription");
    transcribeAudio = mod.transcribeAudio;
  });

  it("rejects invalid URLs", async () => {
    const result = await transcribeAudio({ audioUrl: "not-a-valid-url" });
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("Invalid audio URL");
      expect(result.code).toBe("INVALID_FORMAT");
    }
  });

  it("rejects non-http/https protocols", async () => {
    const result = await transcribeAudio({ audioUrl: "file:///etc/passwd" });
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("Invalid audio URL scheme");
      expect(result.code).toBe("INVALID_FORMAT");
    }
  });

  it("rejects loopback and private IP addresses (SSRF protection)", async () => {
    const dangerousUrls = [
      "http://localhost/secret",
      "http://127.0.0.1/admin",
      "http://169.254.169.254/latest/meta-data/",
      "http://10.0.0.1/internal",
      "http://192.168.1.1/router",
      "http://172.16.0.1/private",
      "http://[::1]/ipv6-loopback",
    ];

    for (const audioUrl of dangerousUrls) {
      const result = await transcribeAudio({ audioUrl });
      expect(result).toHaveProperty("error");
      if ("error" in result) {
        expect(result.error).toContain("Forbidden audio URL host");
        expect(result.code).toBe("INVALID_FORMAT");
      }
    }
  });
});
