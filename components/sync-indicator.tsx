"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

// Simple mock of the sync service for client-side only
const mockSyncService = {
  getPendingCount: () => 0,
}

export function SyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      setIsPreviewEnvironment(hostname.includes("vusercontent.net") || hostname.includes("vercel-preview"))
    }

    // In preview environments, we'll use mock data
    if (isPreviewEnvironment) {
      return
    }

    // Dynamically import the sync service only on the client
    const loadSyncService = async () => {
      try {
        const { syncService } = await import("@/utils/sync-service")

        // Update pending count initially
        setPendingCount(syncService.getPendingCount())

        // Set up an interval to check for pending items
        const interval = setInterval(() => {
          setPendingCount(syncService.getPendingCount())
        }, 1000)

        return () => clearInterval(interval)
      } catch (error) {
        console.error("Error loading sync service:", error)
      }
    }

    loadSyncService()
  }, [isPreviewEnvironment])

  // Don't render during SSR, in preview environments, or if not needed
  if (!mounted || isPreviewEnvironment || pendingCount === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-20 right-4 z-40 bg-blue-500 text-white p-2 rounded-full shadow-lg"
    >
      <div className="flex items-center">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm font-medium">{pendingCount}</span>
      </div>
    </motion.div>
  )
}

// Add default export for dynamic import
export default SyncIndicator
