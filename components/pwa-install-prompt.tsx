"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      setIsPreviewEnvironment(hostname.includes("vusercontent.net") || hostname.includes("vercel-preview"))
    }

    // Check if we're running in a Capacitor native app
    try {
      setIsNative(
        typeof window !== "undefined" && typeof window.Capacitor !== "undefined" && window.Capacitor.isNative === true,
      )
    } catch (error) {
      console.error("Error checking Capacitor:", error)
      setIsNative(false)
    }

    // Only show install prompt on web, not in native apps or preview environments
    if (typeof window !== "undefined" && !isNative && !isPreviewEnvironment) {
      const handler = (e: Event) => {
        e.preventDefault()
        setInstallPrompt(e as BeforeInstallPromptEvent)
        setShowPrompt(true)
      }

      window.addEventListener("beforeinstallprompt", handler)

      return () => {
        window.removeEventListener("beforeinstallprompt", handler)
      }
    }
  }, [isNative, isPreviewEnvironment])

  const handleInstall = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === "accepted") {
        setInstallPrompt(null)
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Error during installation:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Don't render during SSR or if conditions aren't met
  if (!mounted || isNative || isPreviewEnvironment || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50"
      >
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Install Movin App</h3>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="text-white hover:bg-blue-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm mb-3">Install Movin on your device for the best experience!</p>
          <Button
            onClick={handleInstall}
            className="w-full bg-white text-blue-500 hover:bg-gray-100 flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Add default export for dynamic import
export default PWAInstallPrompt
