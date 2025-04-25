"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const setupWorkbox = async () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
          // Check if we're in a preview environment
          const isPreviewEnvironment =
            window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("vercel-preview")

          if (isPreviewEnvironment) {
            console.log("Workbox setup skipped in preview environment")
            return
          }

          const { Workbox } = await import("workbox-window")
          const wb = new Workbox("/sw.js")

          wb.addEventListener("waiting", (event) => {
            if (event.sw) {
              setWaitingWorker(event.sw)
              setShowUpdatePrompt(true)
            }
          })

          wb.register().catch((err) => {
            console.error("Error registering workbox:", err)
          })
        } catch (error) {
          console.error("Error setting up Workbox:", error)
        }
      }
    }

    setupWorkbox()
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
      setShowUpdatePrompt(false)
      window.location.reload()
    }
  }

  // Don't render during SSR or if not needed
  if (!mounted || !showUpdatePrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Update Available</h3>
          <p className="text-sm mb-3">A new version of Movin is available. Update now for the latest features!</p>
          <Button
            onClick={handleUpdate}
            className="w-full bg-white text-blue-500 hover:bg-gray-100 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Now
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Add default export for dynamic import
export default PWAUpdatePrompt
