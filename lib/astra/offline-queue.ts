import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EmergencySession } from "@/types/astra";

const OFFLINE_QUEUE_KEY = "astra.offline.queue.v1";
export const MAX_RETRY_CEILING = 5;

export interface QueuedOfflineCase {
  id: string; // emergency session ID
  session: EmergencySession;
  queuedAt: string;
  retryCount: number;
  lastAttemptAt?: string;
  errorReason?: string;
}

export async function getOfflineQueue(): Promise<QueuedOfflineCase[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedOfflineCase[];
  } catch {
    return [];
  }
}

export async function enqueueOfflineCase(session: EmergencySession): Promise<QueuedOfflineCase[]> {
  const queue = await getOfflineQueue();
  // Idempotency: prevent duplicates
  if (queue.some((item) => item.id === session.id)) {
    return queue;
  }
  // Strip raw audio or unnecessary bulky data if present
  const sanitizedSession: EmergencySession = {
    ...session,
    notes: [...session.notes, "Queued offline for background synchronization."],
  };
  const newItem: QueuedOfflineCase = {
    id: session.id,
    session: sanitizedSession,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  const updated = [...queue, newItem];
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeOfflineCase(id: string): Promise<QueuedOfflineCase[]> {
  const queue = await getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateQueuedCase(id: string, update: Partial<QueuedOfflineCase>): Promise<QueuedOfflineCase[]> {
  const queue = await getOfflineQueue();
  const updated = queue.map((item) => (item.id === id ? { ...item, ...update } : item));
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export async function processOfflineQueue(
  syncHandler: (session: EmergencySession) => Promise<boolean>
): Promise<{ processed: number; failed: number; remaining: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0, remaining: 0 };

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.retryCount >= MAX_RETRY_CEILING) {
      failed++;
      continue;
    }

    try {
      const success = await syncHandler(item.session);
      if (success) {
        await removeOfflineCase(item.id);
        processed++;
      } else {
        const retries = item.retryCount + 1;
        await updateQueuedCase(item.id, {
          retryCount: retries,
          lastAttemptAt: new Date().toISOString(),
          errorReason: retries >= MAX_RETRY_CEILING ? "Max retry ceiling reached" : "Backend rejected sync attempt",
        });
        failed++;
      }
    } catch (err: any) {
      const retries = item.retryCount + 1;
      await updateQueuedCase(item.id, {
        retryCount: retries,
        lastAttemptAt: new Date().toISOString(),
        errorReason: err?.message ?? "Network error during sync",
      });
      failed++;
    }
  }

  const remainingQueue = await getOfflineQueue();
  return { processed, failed, remaining: remainingQueue.length };
}
