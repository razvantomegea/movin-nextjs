import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Script from "next/script"

// Configure the Inter font with proper subsets and display settings
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Movin App",
  description: "Track your fitness and earn rewards",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Movin App",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Movin App",
    title: "Movin App",
    description: "Track your fitness and earn rewards",
  },
  twitter: {
    card: "summary",
    title: "Movin App",
    description: "Track your fitness and earn rewards",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <link rel="icon" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Movin App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Movin App" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">
            {children}
          </main>
        </ThemeProvider>
        {/* Conditionally load the service worker registration script */}
        <Script id="check-and-load-sw" strategy="beforeInteractive">
          {`
            // Check if we're in a preview environment
            const isPreviewEnvironment = window.location.hostname.includes('vusercontent.net') || 
                                        window.location.hostname.includes('vercel-preview');
            
            if (!isPreviewEnvironment) {
              // Only load the service worker registration script in production environments
              const script = document.createElement('script');
              script.src = '/register-sw.js';
              script.defer = true;
              document.body.appendChild(script);
            } else {
              console.log('Service worker registration skipped in preview environment');
            }
          `}
        </Script>
      </body>
    </html>
  )
}
