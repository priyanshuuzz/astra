import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../server/_core/index";

describe("CORS isAllowedOrigin security validation", () => {
  it("allows localhost and loopback/private IP development origins", () => {
    expect(isAllowedOrigin("http://localhost:8081", "localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:8081", "127.0.0.1:3000")).toBe(true);
    expect(isAllowedOrigin("http://192.168.1.100:8081", "192.168.1.100:3000")).toBe(true);
    expect(isAllowedOrigin("http://10.0.0.5:8081", "10.0.0.5:3000")).toBe(true);
  });

  it("allows origins matching the same host", () => {
    expect(isAllowedOrigin("https://example.com", "example.com")).toBe(true);
    expect(isAllowedOrigin("https://example.com:8081", "example.com:3000")).toBe(true);
  });

  it("allows subdomains on the same parent domain", () => {
    const reqHost = "3000-abcd.manuspre.computer:443";
    const origin = "https://8081-abcd.manuspre.computer";
    expect(isAllowedOrigin(origin, reqHost)).toBe(true);
  });

  it("rejects public/external IP address origins when accessing domain servers", () => {
    const reqHost = "3000-abcd.manuspre.computer";
    expect(isAllowedOrigin("http://1.2.3.4", reqHost)).toBe(false);
    expect(isAllowedOrigin("http://198.51.100.1:8080", reqHost)).toBe(false);
  });

  it("rejects malicious cross-origin domains", () => {
    const reqHost = "3000-abcd.manuspre.computer";
    expect(isAllowedOrigin("https://evil.com", reqHost)).toBe(false);
    expect(isAllowedOrigin("https://attacker.manuspre.computer.evil.com", reqHost)).toBe(false);
    expect(isAllowedOrigin("https://evilmanuspre.computer", reqHost)).toBe(false);
  });

  it("rejects invalid or empty origins", () => {
    expect(isAllowedOrigin("", "localhost")).toBe(false);
    expect(isAllowedOrigin("invalid-url", "localhost")).toBe(false);
  });
});
