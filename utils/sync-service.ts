// Make sure this is only imported on the client side
const isBrowser = typeof window !== "undefined"

type SyncItem = {
  id: string
  data: any
  timestamp: number
  synced: boolean
}

export class SyncService {
  private storageKey: string
  private syncQueue: SyncItem[]
  private isSyncing: boolean

  constructor(storageKey = "movin_sync_queue") {
    this.storageKey = storageKey
    this.syncQueue = []
    this.isSyncing = false

    if (isBrowser) {
      this.loadQueue()

      // Set up event listeners for online/offline events
      window.addEventListener("online", () => {
        this.attemptSync()
      })
    }
  }

  private loadQueue(): void {
    if (!isBrowser) return

    const storedQueue = localStorage.getItem(this.storageKey)
    if (storedQueue) {
      try {
        this.syncQueue = JSON.parse(storedQueue)
      } catch (error) {
        console.error("Error loading sync queue:", error)
        this.syncQueue = []
      }
    }
  }

  private saveQueue(): void {
    if (!isBrowser) return
    localStorage.setItem(this.storageKey, JSON.stringify(this.syncQueue))
  }

  public addToQueue(id: string, data: any): void {
    if (!isBrowser) return

    this.syncQueue.push({
      id,
      data,
      timestamp: Date.now(),
      synced: false,
    })
    this.saveQueue()
    this.attemptSync()
  }

  public async attemptSync(): Promise<void> {
    if (!isBrowser || this.isSyncing || !navigator.onLine || this.syncQueue.length === 0) return

    this.isSyncing = true

    try {
      const unsynced = this.syncQueue.filter((item) => !item.synced)

      for (const item of unsynced) {
        try {
          // Here you would make your API call to sync the data
          // For example:
          // await fetch('/api/sync', { method: 'POST', body: JSON.stringify(item.data) })

          // For demo purposes, we'll just mark it as synced after a delay
          await new Promise((resolve) => setTimeout(resolve, 500))

          item.synced = true
          this.saveQueue()
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error)
        }
      }

      // Clean up synced items older than 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      this.syncQueue = this.syncQueue.filter((item) => !item.synced || item.timestamp > oneDayAgo)
      this.saveQueue()
    } finally {
      this.isSyncing = false
    }
  }

  public getPendingCount(): number {
    if (!isBrowser) return 0
    return this.syncQueue.filter((item) => !item.synced).length
  }
}

// Create a singleton instance - but only on the client side
export const syncService = isBrowser ? new SyncService() : (null as any)
