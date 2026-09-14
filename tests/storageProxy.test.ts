import { describe, expect, it } from "vitest";
import { isValidStorageKey } from "../server/_core/storageProxy";

describe("Storage Proxy Security Validation", () => {
  it("rejects invalid keys and path traversal attempts", () => {
    expect(isValidStorageKey("")).toBe(false);
    expect(isValidStorageKey("../secret.txt")).toBe(false);
    expect(isValidStorageKey("folder/../../secret.txt")).toBe(false);
    expect(isValidStorageKey("folder%2F..%2Fsecret.txt")).toBe(false);
    expect(isValidStorageKey("win\\path")).toBe(false);
    expect(isValidStorageKey("%E0%A4%A")).toBe(false); // Invalid URI encoding
  });

  it("accepts valid storage keys", () => {
    expect(isValidStorageKey("user-uploads/image.png")).toBe(true);
    expect(isValidStorageKey("doc123.pdf")).toBe(true);
  });
});
