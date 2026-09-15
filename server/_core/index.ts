import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isPrivateOrLoopbackIp(host: string): boolean {
  if (host === "::1" || host === "0.0.0.0") return true;

  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4Match) {
    const [, p1, p2] = ipv4Match.map(Number);
    if (p1 === 127) return true; // 127.0.0.0/8 (loopback)
    if (p1 === 10) return true; // 10.0.0.0/8 (private)
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true; // 172.16.0.0/12 (private)
    if (p1 === 192 && p2 === 168) return true; // 192.168.0.0/16 (private)
  }

  return false;
}

export function isAllowedOrigin(origin: string, reqHost?: string): boolean {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const originHostname = originUrl.hostname.toLowerCase();
    const cleanReqHost = reqHost ? reqHost.split(":")[0].toLowerCase() : "";

    // Same host
    if (cleanReqHost && originHostname === cleanReqHost) return true;

    // Local/private hostnames and loopback IPs (development)
    if (
      LOCAL_HOSTS.has(originHostname) ||
      isPrivateOrLoopbackIp(originHostname) ||
      originHostname.endsWith(".localhost")
    ) {
      return true;
    }

    // Configured environment preview URLs
    const previewUrls = [process.env.EXPO_WEB_PREVIEW_URL, process.env.EXPO_PACKAGER_PROXY_URL]
      .filter(Boolean) as string[];
    for (const previewUrl of previewUrls) {
      try {
        if (new URL(previewUrl).hostname.toLowerCase() === originHostname) return true;
      } catch {
        // ignore invalid URL env vars
      }
    }

    // Domain / parent subdomain sharing (e.g. 8081-xxx.manuspre.computer and 3000-xxx.manuspre.computer)
    if (cleanReqHost) {
      const hostParts = cleanReqHost.split(".");
      if (hostParts.length >= 3) {
        const parentDomain = "." + hostParts.slice(-2).join(".");
        if (originHostname.endsWith(parentDomain)) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for trusted origins to prevent cross-origin credential theft
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const reqHost = (req.headers.host || req.hostname) as string | undefined;

    if (origin && isAllowedOrigin(origin, reqHost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
