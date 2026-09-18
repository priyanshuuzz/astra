import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../server/_core/index";
import { getSessionCookieOptions } from "../server/_core/cookies";
import type { Request } from "express";

describe("CORS Security & Origin Validation", () => {
  it("allows requests from localhost and loopback IP origins", () => {
    expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:8081")).toBe(true);
    expect(isAllowedOrigin("http://[::1]:3000")).toBe(true);
  });

  it("allows requests from trusted manuspre.computer subdomains", () => {
    expect(isAllowedOrigin("https://3000-abcd.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://8081-abcd.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://manuspre.computer")).toBe(true);
  });

  it("rejects unauthorized and malicious origins", () => {
    expect(isAllowedOrigin("https://evil-attacker.com")).toBe(false);
    expect(isAllowedOrigin("https://attacker-manuspre.computer.fake.com")).toBe(false);
    expect(isAllowedOrigin("not-a-url")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
  });
});

describe("Session Cookie Security Options", () => {
  it("uses sameSite=lax for non-HTTPS connections", () => {
    const req = {
      hostname: "localhost",
      protocol: "http",
      headers: {},
    } as unknown as Request;

    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe("lax");
    expect(options.httpOnly).toBe(true);
  });

  it("uses sameSite=none for HTTPS connections", () => {
    const req = {
      hostname: "3000-abcd.manuspre.computer",
      protocol: "https",
      headers: {},
    } as unknown as Request;

    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe("none");
    expect(options.httpOnly).toBe(true);
  });
});
