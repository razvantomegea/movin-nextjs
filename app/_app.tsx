"use client"

import type { AppProps } from "next/app"
import { ThemeProvider } from "@/components/theme-provider"
import "../globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
