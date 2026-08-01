// Queue persistence — saves and restores active queue session via localStorage
// This allows customers to recover their queue position after a page refresh or app restart.

export interface PersistedQueue {
  storeId: string;
  storeName: string;
  tokenNumber: number;
  joinedAt: number;
  queueCode?: string;
}

const KEY = "kynisto_active_queue";

export function saveQueueSession(data: PersistedQueue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // Ignore storage errors (private mode, storage full, etc.)
  }
}

export function loadQueueSession(): PersistedQueue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedQueue & { savedAt: number };
    // Expire after 12 hours
    if (Date.now() - (data.savedAt ?? 0) > 12 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearQueueSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore
  }
}
