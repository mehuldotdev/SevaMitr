import { offlineDb, CognitiveSessionRecord } from '../db/offlineDb';

export interface SyncStatus {
  isOnline: boolean;
  unsyncedCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  message: string;
}

type SyncListener = (status: SyncStatus) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private lastSyncedAt: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      
      // Periodic check every 30 seconds
      setInterval(() => {
        if (navigator.onLine && offlineDb.getUnsyncedCount() > 0 && !this.isSyncing) {
          this.triggerSync();
        }
      }, 30000);
    }
  }

  private handleNetworkChange(online: boolean) {
    if (online) {
      this.triggerSync();
    } else {
      this.notifyListeners();
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const unsyncedCount = offlineDb.getUnsyncedCount();

    let message = 'All records synced with server';
    if (!isOnline) {
      message = 'Offline mode: Playing locally. Data safely stored on device.';
    } else if (unsyncedCount > 0) {
      message = `${unsyncedCount} sessions queued for sync.`;
    }

    return {
      isOnline,
      unsyncedCount,
      lastSyncedAt: this.lastSyncedAt,
      isSyncing: this.isSyncing,
      message,
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(cb => cb(status));
  }

  async triggerSync(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isSyncing || typeof window === 'undefined') {
      return { success: false, syncedCount: 0 };
    }

    const unsynced = offlineDb.getSessions().filter(s => !s.synced);
    if (unsynced.length === 0) {
      this.notifyListeners();
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: offlineDb.getPatient().id,
          sessions: unsynced,
          timestamp: Date.now(),
        }),
      });

      if (response.ok) {
        offlineDb.markAllSynced();
        this.lastSyncedAt = Date.now();
        this.isSyncing = false;
        this.notifyListeners();
        return { success: true, syncedCount: unsynced.length };
      } else {
        throw new Error('Sync server error: ' + response.statusText);
      }
    } catch (e) {
      console.warn('Sync failed (will retry when connection stabilizes):', e);
      this.isSyncing = false;
      this.notifyListeners();
      return { success: false, syncedCount: 0 };
    }
  }
}

export const syncManager = new SyncManager();
