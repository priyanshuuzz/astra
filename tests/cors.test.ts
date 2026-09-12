import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../server/_core/cors";

describe("isAllowedOrigin", () => {
  it("allows localhost, 127.0.0.1, and ::1", () => {
    expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:8081")).toBe(true);
    expect(isAllowedOrigin("http://[::1]:8081")).toBe(true);
  });

  it("allows subdomains sharing the same parent domain", () => {
    const reqHost = "3000-abc12345.manuspre.computer:443";
    const origin = "https://8081-abc12345.manuspre.computer";
    expect(isAllowedOrigin(origin, reqHost)).toBe(true);
  });

  it("allows exact host match", () => {
    const reqHost = "app.example.com";
    const origin = "https://app.example.com";
    expect(isAllowedOrigin(origin, reqHost)).toBe(true);
  });

  it("allows origins defined in ALLOWED_ORIGINS env variable", () => {
    const origEnv = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = "https://trusted-dashboard.com,https://client.app.org";

    expect(isAllowedOrigin("https://trusted-dashboard.com")).toBe(true);
    expect(isAllowedOrigin("https://client.app.org")).toBe(true);

    if (origEnv !== undefined) {
      process.env.ALLOWED_ORIGINS = origEnv;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  it("rejects untrusted external origins", () => {
    const reqHost = "3000-abc12345.manuspre.computer";
    expect(isAllowedOrigin("https://evil.com", reqHost)).toBe(false);
    expect(isAllowedOrigin("https://attacker.org", reqHost)).toBe(false);
    expect(isAllowedOrigin("https://manuspre.computer.evil.com", reqHost)).toBe(false);
  });

  it("handles empty or malformed origins gracefully", () => {
    expect(isAllowedOrigin("")).toBe(false);
    expect(isAllowedOrigin("not-a-valid-url")).toBe(false);
  });
});
