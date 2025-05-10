import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ReduxProvider } from "@/lib/redux/provider"
import { GoogleMapsProvider } from "@/lib/google-maps-provider"
import { ReduxToaster } from "@/components/ui/redux-toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Movin App",
  description: "Move to earn app",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GoogleMapsProvider>
              {children}
              <ReduxToaster />
            </GoogleMapsProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
