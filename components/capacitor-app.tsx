"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { isCapacitorNative } from "@/utils/capacitor"

export function CapacitorApp({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    // Check if we're in a Capacitor environment
    const checkCapacitor = async () => {
      try {
        const isNative = isCapacitorNative()
        setIsNative(isNative)

        if (isNative) {
          // Dynamically import Capacitor modules only when in native environment
          const { App } = await import("@capacitor/app")
          const { StatusBar } = await import("@capacitor/status-bar")
          const { SplashScreen } = await import("@capacitor/splash-screen")
          const { Keyboard } = await import("@capacitor/keyboard")

          // Hide the splash screen
          await SplashScreen.hide()

          // Set status bar style based on theme
          try {
            await StatusBar.setStyle({
              style: isDark ? "DARK" : "LIGHT",
            })

            if (isDark) {
              await StatusBar.setBackgroundColor({ color: "#1e293b" })
            } else {
              await StatusBar.setBackgroundColor({ color: "#ffffff" })
            }
          } catch (e) {
            console.error("Error setting status bar", e)
          }

          // Handle keyboard events
          Keyboard.addListener("keyboardWillShow", () => {
            // Adjust UI when keyboard shows
            document.body.classList.add("keyboard-open")
          })

          Keyboard.addListener("keyboardWillHide", () => {
            // Reset UI when keyboard hides
            document.body.classList.remove("keyboard-open")
          })

          // Handle app state changes
          App.addListener("appStateChange", ({ isActive }) => {
            console.log("App state changed. Is active?", isActive)
            // You can pause/resume activities here
          })

          // Handle back button (Android)
          App.addListener("backButton", ({ canGoBack }) => {
            if (!canGoBack) {
              App.exitApp()
            } else {
              window.history.back()
            }
          })

          // Cleanup function
          return () => {
            Keyboard.removeAllListeners()
            App.removeAllListeners()
          }
        }
      } catch (error) {
        console.error("Error initializing Capacitor:", error)
      }
    }

    checkCapacitor()
  }, [isDark])

  // Update status bar when theme changes
  useEffect(() => {
    const updateStatusBar = async () => {
      if (isNative) {
        try {
          const { StatusBar } = await import("@capacitor/status-bar")

          await StatusBar.setStyle({
            style: isDark ? "DARK" : "LIGHT",
          })

          await StatusBar.setBackgroundColor({
            color: isDark ? "#1e293b" : "#ffffff",
          })
        } catch (error) {
          console.error("Error updating status bar:", error)
        }
      }
    }

    updateStatusBar()
  }, [isDark, isNative])

  return <>{children}</>
}
