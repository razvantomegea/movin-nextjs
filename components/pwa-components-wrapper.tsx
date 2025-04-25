"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import components with no SSR
const OfflineIndicator = dynamic(() => import("./offline-indicator"), { ssr: false })
const SyncIndicator = dynamic(() => import("./sync-indicator"), { ssr: false })

// Only import PWA components in the browser
const PWAInstallPrompt = dynamic(() => import("./pwa-install-prompt"), { ssr: false })
const PWAUpdatePrompt = dynamic(() => import("./pwa-update-prompt"), { ssr: false })

export function PWAComponentsWrapper() {
  const [mounted, setMounted] = useState(false)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if we're in a preview environment
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname
      setIsPreviewEnvironment(hostname.includes("vusercontent.net") || hostname.includes("vercel-preview"))
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      <OfflineIndicator />
      <SyncIndicator />
      {!isPreviewEnvironment && (
        <>
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
        </>
      )}
    </>
  )
}
