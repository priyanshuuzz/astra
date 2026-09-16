export function isAllowedOrigin(origin: string | undefined, reqHost?: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Allow local development origins
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }

    // Allow subdomains of manuspre.computer
    if (hostname.endsWith(".manuspre.computer") || hostname === "manuspre.computer") {
      return true;
    }

    // Allow request host if provided
    if (reqHost) {
      const hostWithoutPort = reqHost.split(":")[0];
      if (hostname === hostWithoutPort) {
        return true;
      }
    }

    // Check environment configured preview URLs
    const envUrls = [
      process.env.EXPO_WEB_PREVIEW_URL,
      process.env.EXPO_PACKAGER_PROXY_URL,
      process.env.FRONTEND_URL,
    ].filter((u): u is string => typeof u === "string" && u.length > 0);

    for (const envUrl of envUrls) {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === hostname) {
          return true;
        }
      } catch {
        // ignore invalid env URL
      }
    }

    return false;
  } catch {
    return false;
  }
}
