import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useEffect } from "react";
// @ts-expect-error missing types
import { createRoot } from "react-dom/client";
import { act } from "react";

const mockSignUp = vi.fn();
const mockUpsert = vi.fn();

vi.mock("../lib/supabase", () => {
  return {
    supabase: {
      auth: {
        signUp: (...args: unknown[]) => mockSignUp(...args),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockReturnValue({
        upsert: (...args: unknown[]) => mockUpsert(...args),
      }),
    },
  };
});

import { AuthProvider, useAuth } from "../lib/auth-context";

class DummyNode {}
class DummyElement extends DummyNode {}
class DummyDocument extends DummyNode {}
class DummyHTMLIFrameElement extends DummyElement {}

if (typeof globalThis.document === "undefined") {
  // @ts-expect-error test mock
  globalThis.Node = DummyNode;
  // @ts-expect-error test mock
  globalThis.Element = DummyElement;
  // @ts-expect-error test mock
  globalThis.HTMLDocument = DummyDocument;
  // @ts-expect-error test mock
  globalThis.HTMLIFrameElement = DummyHTMLIFrameElement;

  const dummyDoc: Record<string, unknown> = {
    nodeType: 9,
    addEventListener: () => {},
    removeEventListener: () => {},
    defaultView: globalThis,
  };
  Object.setPrototypeOf(dummyDoc, DummyDocument.prototype);

  const createDummyNode = (name = "DIV") => {
    const node: Record<string, unknown> = {
      nodeType: 1,
      nodeName: name.toUpperCase(),
      tagName: name.toUpperCase(),
      style: {},
      childNodes: [],
      ownerDocument: dummyDoc,
      appendChild: () => {},
      removeChild: () => {},
      insertBefore: () => {},
      setAttribute: () => {},
      removeAttribute: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    Object.setPrototypeOf(node, DummyElement.prototype);
    return node;
  };

  dummyDoc.createElement = (tag: string) => createDummyNode(tag);

  // @ts-expect-error test mock
  globalThis.document = dummyDoc;
  // @ts-expect-error test mock
  globalThis.window = globalThis;
  // @ts-expect-error test flag
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}

describe("signUp role enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("always restricts user self-registration to 'patient' role even if 'admin' or 'staff' is passed", async () => {
    let capturedAuth: ReturnType<typeof useAuth> | undefined;

    function TestComponent() {
      const auth = useAuth();
      useEffect(() => {
        capturedAuth = auth;
      }, [auth]);
      return null;
    }

    const container = document.createElement("div");
    const root = createRoot(container as unknown as Element);

    await act(async () => {
      root.render(
        React.createElement(AuthProvider, null, React.createElement(TestComponent))
      );
    });

    expect(capturedAuth).toBeDefined();

    await act(async () => {
      await capturedAuth?.signUp("attacker@example.com", "password123", "Attacker", "admin" as any);
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "attacker@example.com",
      password: "password123",
      options: {
        data: {
          name: "Attacker",
          role: "patient",
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      id: "test-user-id",
      name: "Attacker",
      role: "patient",
    });

    await act(async () => {
      root.unmount();
    });
  });
});
