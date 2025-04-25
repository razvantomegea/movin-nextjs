"use client"

import { useState } from "react"
import { ShareIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Share } from "@capacitor/share"
import { isCapacitorNative } from "@/utils/capacitor"

interface NativeShareProps {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
  buttonText?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function NativeShare({
  title = "Movin App",
  text = "Check out the Movin app for fitness tracking and rewards!",
  url = "https://movin-app.com",
  dialogTitle = "Share Movin App",
  buttonText = "Share",
  className = "",
  variant = "outline",
  size = "default",
}: NativeShareProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)

    try {
      if (isCapacitorNative()) {
        // Use Capacitor Share API for native platforms
        await Share.share({
          title,
          text,
          url,
          dialogTitle,
        })
      } else if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title,
          text,
          url,
        })
      } else {
        // Fallback for browsers without Web Share API
        console.log("Web Share API not supported")
        // Could implement a custom share dialog here
        alert("Sharing is not supported in this browser. Copy this link: " + url)
      }
    } catch (error) {
      console.error("Error sharing:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleShare} disabled={isSharing}>
      <ShareIcon className="h-4 w-4 mr-2" />
      {isSharing ? "Sharing..." : buttonText}
    </Button>
  )
}
