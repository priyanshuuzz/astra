import express from "express";
import { describe, expect, it } from "vitest";
import { registerStorageProxy } from "../server/_core/storageProxy";

describe("Storage Proxy Path Traversal Prevention", () => {
  const app = express();
  registerStorageProxy(app);

  const mockReqRes = (pathParam: string) => {
    const req = {
      params: { 0: pathParam },
    } as unknown as express.Request;

    let statusCode = 200;
    let sentBody = "";

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      send: (body: string) => {
        sentBody = body;
        return res;
      },
      set: () => res,
      redirect: () => res,
    } as unknown as express.Response;

    return { req, res, getStatus: () => statusCode, getBody: () => sentBody };
  };

  it("rejects path traversal attempts with double dots", async () => {
    // Find matching route handler registered on app
    const route = app._router.stack.find((layer: any) => layer.route?.path === "/manus-storage/*");
    const handler = route.route.stack[0].handle;

    const { req, res, getStatus, getBody } = mockReqRes("../etc/passwd");
    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody()).toBe("Invalid storage key");
  });

  it("rejects keys with backslashes", async () => {
    const route = app._router.stack.find((layer: any) => layer.route?.path === "/manus-storage/*");
    const handler = route.route.stack[0].handle;

    const { req, res, getStatus, getBody } = mockReqRes("uploads\\secret.png");
    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody()).toBe("Invalid storage key");
  });

  it("rejects keys with null bytes", async () => {
    const route = app._router.stack.find((layer: any) => layer.route?.path === "/manus-storage/*");
    const handler = route.route.stack[0].handle;

    const { req, res, getStatus, getBody } = mockReqRes("uploads/image.png\0.exe");
    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody()).toBe("Invalid storage key");
  });
});
