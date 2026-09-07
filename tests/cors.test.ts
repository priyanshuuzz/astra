import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../server/_core/index";

describe("CORS Origin Validation", () => {
  it("allows localhost and 127.0.0.1 origins", () => {
    expect(isAllowedOrigin("http://localhost:8081")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isAllowedOrigin("https://localhost:8081")).toBe(true);
  });

  it("allows manuspre.computer subdomains", () => {
    expect(isAllowedOrigin("https://3000-abc123.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://8081-abc123.manuspre.computer")).toBe(true);
    expect(isAllowedOrigin("https://manuspre.computer")).toBe(true);
  });

  it("rejects malicious or unauthorized origins", () => {
    expect(isAllowedOrigin("https://evil.com")).toBe(false);
    expect(isAllowedOrigin("https://manuspre.computer.evil.com")).toBe(false);
    expect(isAllowedOrigin("https://fake-manuspre.computer")).toBe(false);
    expect(isAllowedOrigin("invalid-url")).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
  });
});
