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

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;

    // Allow localhost and loopback IP addresses (including IPv6 bracketed notation)
    const cleanHostname = hostname.replace(/^\[|\]$/g, "");
    if (cleanHostname === "localhost" || cleanHostname === "127.0.0.1" || cleanHostname === "::1") {
      return true;
    }

    // Allow trusted platform domain and subdomains
    if (hostname === "manuspre.computer" || hostname.endsWith(".manuspre.computer")) {
      return true;
    }

    // Check against explicitly configured preview or proxy URLs
    if (process.env.EXPO_WEB_PREVIEW_URL && origin === process.env.EXPO_WEB_PREVIEW_URL) {
      return true;
    }
    if (process.env.EXPO_PACKAGER_PROXY_URL && origin === process.env.EXPO_PACKAGER_PROXY_URL) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Validate CORS requests to prevent arbitrary origin reflection with credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
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
