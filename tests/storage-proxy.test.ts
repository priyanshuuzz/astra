import { describe, expect, it } from "vitest";
import { isValidStorageKey } from "../server/_core/storageProxy";

describe("isValidStorageKey", () => {
  it("allows valid storage keys", () => {
    expect(isValidStorageKey("images/profile.png")).toBe(true);
    expect(isValidStorageKey("docs/2025/report.pdf")).toBe(true);
    expect(isValidStorageKey("file.txt")).toBe(true);
    expect(isValidStorageKey("subfolder/file-name_123.jpg")).toBe(true);
  });

  it("rejects path traversal attempts with '..'", () => {
    expect(isValidStorageKey("../etc/passwd")).toBe(false);
    expect(isValidStorageKey("images/../../secret.json")).toBe(false);
    expect(isValidStorageKey("folder/..")).toBe(false);
    expect(isValidStorageKey("..")).toBe(false);
  });

  it("rejects URL-encoded path traversal sequences", () => {
    expect(isValidStorageKey("%2e%2e/etc/passwd")).toBe(false);
    expect(isValidStorageKey("images/%2e%2e%2fsecret.json")).toBe(false);
    expect(isValidStorageKey("%2E%2E%2Fconfig")).toBe(false);
  });

  it("rejects backslash path traversal attempts", () => {
    expect(isValidStorageKey("..\\windows\\system32")).toBe(false);
    expect(isValidStorageKey("images\\..\\secret.json")).toBe(false);
  });

  it("rejects leading slashes and absolute paths", () => {
    expect(isValidStorageKey("/etc/passwd")).toBe(false);
    expect(isValidStorageKey("/images/photo.jpg")).toBe(false);
  });

  it("rejects empty or malformed inputs", () => {
    expect(isValidStorageKey("")).toBe(false);
    expect(isValidStorageKey("%E0%A4%A")).toBe(false); // malformed URI component
  });
});
