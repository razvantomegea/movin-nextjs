"use client"

import type { AppProps } from "next/app"
import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { CapacitorApp } from "@/components/capacitor-app"
import { isCapacitorNative } from "@/utils/capacitor"
import "../globals.css"

export default function App({ Component, pageProps }: AppProps) {
  // Handle Capacitor initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if we're in a Capacitor environment
      const isNative = isCapacitorNative()

      if (isNative) {
        // Initialize Capacitor plugins
        import("@capacitor/core").then(({ Capacitor }) => {
          console.log("Capacitor initialized", Capacitor.getPlatform())
        })
      }
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
      <CapacitorApp>
        <Component {...pageProps} />
      </CapacitorApp>
    </ThemeProvider>
  )
}
