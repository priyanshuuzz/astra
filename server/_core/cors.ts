/**
 * CORS Origin Validation Helper
 * Protects against origin reflection / credential theft vulnerabilities by validating
 * that requested origins are trusted (localhost, configured preview URLs, or same parent subdomains).
 */

export function isAllowedOrigin(origin: string, reqHost?: string): boolean {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;

    // 1. Allow localhost, 127.0.0.1, IPv6 loopback, and .localhost subdomains
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost")
    ) {
      return true;
    }

    // 2. Check explicitly configured environment URLs or allowed origins list
    const envOrigins = [
      process.env.EXPO_WEB_PREVIEW_URL,
      process.env.EXPO_PACKAGER_PROXY_URL,
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
    ].filter(Boolean) as string[];

    for (const envOrigin of envOrigins) {
      try {
        const envUrl = new URL(envOrigin.trim());
        if (parsed.origin === envUrl.origin) {
          return true;
        }
      } catch {
        if (origin === envOrigin.trim()) {
          return true;
        }
      }
    }

    // 3. Match against request hostname or subdomains sharing the same parent domain
    if (reqHost) {
      const cleanReqHost = reqHost.split(":")[0];
      if (hostname === cleanReqHost) {
        return true;
      }
      const hostParts = cleanReqHost.split(".");
      if (hostParts.length >= 3) {
        const parentDomain = hostParts.slice(-2).join(".");
        if (hostname.endsWith("." + parentDomain) || hostname === parentDomain) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}
