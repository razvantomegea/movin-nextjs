"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      setIsPreviewEnvironment(hostname.includes("vusercontent.net") || hostname.includes("vercel-preview"))
    }

    // In preview environments, we'll simulate online status
    if (isPreviewEnvironment) {
      setIsOffline(false)
      return
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Check initial state
    setIsOffline(!navigator.onLine)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isPreviewEnvironment])

  // Don't render anything during SSR or in preview environments
  if (!mounted || isPreviewEnvironment || !isOffline) return null

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-2 text-center"
        >
          <div className="flex items-center justify-center">
            <WifiOff className="h-4 w-4 mr-2" />
            <span className="font-medium">You're offline. Some features may be limited.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Add default export for dynamic import
export default OfflineIndicator
