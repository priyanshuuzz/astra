import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../server/_core/cors";

describe("CORS Origin Validation Security", () => {
  it("allows localhost and 127.0.0.1 origins", () => {
    expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:8081")).toBe(true);
  });

  it("allows subdomains of manuspre.computer", () => {
    expect(isAllowedOrigin("https://3000-abcdef.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://8081-abcdef.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://manuspre.computer")).toBe(true);
  });

  it("allows origins matching the request host header", () => {
    expect(isAllowedOrigin("https://my-app-domain.com", "my-app-domain.com:443")).toBe(true);
  });

  it("rejects untrusted malicious origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
    expect(isAllowedOrigin("https://attacker.org")).toBe(false);
    expect(isAllowedOrigin("https://manuspre.computer.attacker.com")).toBe(false);
    expect(isAllowedOrigin("https://fake-manuspre.computer")).toBe(false);
  });

  it("handles undefined, invalid, or malformed origin strings safely", () => {
    expect(isAllowedOrigin(undefined)).toBe(false);
    expect(isAllowedOrigin("invalid-url")).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
  });
});
