import { describe, expect, it } from "vitest";
import { sdk } from "../server/_core/sdk";

describe("OAuth state decoding safety", () => {
  it("decodes valid Base64 state strings safely", async () => {
    const validUrl = "https://example.com/oauth/callback";
    const encodedState = Buffer.from(validUrl, "utf-8").toString("base64");

    // We test decodeState behavior indirectly or directly if exposed
    const decoded = (sdk as any).oauthService.decodeState(encodedState);
    expect(decoded).toBe(validUrl);
  });

  it("handles malformed Base64 state without crashing", async () => {
    const malformedState = "!!!not-valid-base64!!!***";
    const decoded = (sdk as any).oauthService.decodeState(malformedState);
    expect(typeof decoded).toBe("string");
  });
});
