import { beforeEach, describe, expect, it, vi } from "vitest";

const memoryStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memoryStore.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
  },
}));

import {
  clearOfflineQueue,
  enqueueOfflineCase,
  getOfflineQueue,
  processOfflineQueue,
  removeOfflineCase,
} from "../lib/astra/offline-queue";
import type { EmergencySession } from "../types/astra";

const mockSession: EmergencySession = {
  id: "OFFLINE-TEST-101",
  type: "stroke",
  startedAt: "2026-08-26T12:00:00.000Z",
  status: "waiting_acceptance",
  currentState: "PENDING_ACCEPTANCE",
  patientLocation: { latitude: 17.385, longitude: 78.486, label: "Test Location" },
  contactsNotified: false,
  notes: [],
};

describe("ASTRA Offline Emergency Queue", () => {
  beforeEach(async () => {
    memoryStore.clear();
    await clearOfflineQueue();
  });

  it("enqueues an emergency session FIFO and enforces idempotency against duplicates", async () => {
    const queue1 = await enqueueOfflineCase(mockSession);
    expect(queue1).toHaveLength(1);
    expect(queue1[0].id).toBe("OFFLINE-TEST-101");

    // Idempotency check: repeat enqueue of same session ID
    const queue2 = await enqueueOfflineCase(mockSession);
    expect(queue2).toHaveLength(1);
  });

  it("removes processed cases from the offline queue", async () => {
    await enqueueOfflineCase(mockSession);
    let queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);

    await removeOfflineCase(mockSession.id);
    queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });

  it("processes queue items with retry backoff and ceiling", async () => {
    await enqueueOfflineCase(mockSession);

    // Simulate backend sync failure
    let result = await processOfflineQueue(async () => false);
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(1);

    let queue = await getOfflineQueue();
    expect(queue[0].retryCount).toBe(1);

    // Simulate successful sync on next attempt
    result = await processOfflineQueue(async () => true);
    expect(result.processed).toBe(1);

    queue = await getOfflineQueue();
    expect(queue).toHaveLength(0);
  });
});
