import express from "express";
import http from "http";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { registerStorageProxy } from "../server/_core/storageProxy";

describe("Storage Proxy Path Traversal Protection", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const app = express();
    registerStorageProxy(app);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function makeRawRequest(rawPath: string): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: "localhost",
          port,
          path: rawPath,
          method: "GET",
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ statusCode: res.statusCode || 0, body: data }));
        },
      );
      req.on("error", reject);
      req.end();
    });
  }

  it("rejects path traversal attempts with 400 status", async () => {
    const maliciousPaths = [
      "/manus-storage/dir%2f..%2fsecret.txt",
      "/manus-storage/file%5c..%5csecret.txt",
      "/manus-storage/..%2f..%2fetc%2fpasswd",
    ];

    for (const path of maliciousPaths) {
      const res = await makeRawRequest(path);
      expect(res.statusCode).toBe(400);
      expect(res.body).toContain("Invalid storage key path");
    }
  });
});
