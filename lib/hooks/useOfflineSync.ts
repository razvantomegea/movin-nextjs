'use client';

import { useState, useEffect, useCallback } from 'react';

// Interface for items to be stored offline
interface OfflineItem {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

// Interface for sync result
interface SyncResult {
  status: 'fulfilled' | 'rejected';
  value?: {
    success: boolean;
    id: string;
    type: string;
    error?: string;
  };
  reason?: string;
}

// Interface for sync response
interface SyncResponse {
  results: SyncResult[];
}

// IndexedDB configuration
const DB_NAME = 'movin_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_data';

export default function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Get all offline items
  const getOfflineItems = useCallback(async (): Promise<OfflineItem[]> => {
    if (!db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve offline data'));
      };
    });
  }, [db]);

  // Remove items from offline storage
  const removeOfflineItems = useCallback(
    async (ids: string[]): Promise<void> => {
      if (!db || ids.length === 0) {
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          reject(new Error('Failed to remove offline data'));
        };

        ids.forEach((id) => {
          store.delete(id);
        });
      });
    },
    [db],
  );

  const syncData = useCallback(async (): Promise<boolean> => {
    if (!isOnline || isSyncing || !db) {
      return false;
    }

    setIsSyncing(true);

    try {
      const items = await getOfflineItems();

      if (items.length === 0) {
        setIsSyncing(false);
        return true;
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: items }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = (await response.json()) as SyncResponse;

      // Get IDs of successfully synced items
      const syncedIds = result.results
        .filter((r) => r.status === 'fulfilled' && r.value && r.value.success)
        .map((r) => r.value!.id);

      // Remove synced items from IndexedDB
      await removeOfflineItems(syncedIds);

      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      setIsSyncing(false);
      return false;
    }
  }, [db, isOnline, isSyncing, getOfflineItems, removeOfflineItems]);

  // Initialize IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      const upgradedDb = (event.target as IDBOpenDBRequest).result;
      setDb(upgradedDb);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for offline data
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    // Setup online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Close the database connection when component unmounts
      if (db) {
        db.close();
      }
    };
  }, [db, syncData]);

  // Add item to offline storage
  const addOfflineItem = useCallback(
    async (type: string, data: unknown): Promise<string> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      const id = crypto.randomUUID();
      const item: OfflineItem = {
        id,
        type,
        data,
        timestamp: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(item);

        request.onsuccess = () => {
          resolve(id);

          // If online, try to sync immediately
          if (isOnline && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.sync.register('sync-data').catch((error) => {
                console.error('Background sync registration failed:', error);
              });
            });
          }
        };

        request.onerror = () => {
          reject(new Error('Failed to store offline data'));
        };
      });
    },
    [db, isOnline],
  );

  return {
    isOnline,
    isSyncing,
    addOfflineItem,
    getOfflineItems,
    syncData,
  };
}
