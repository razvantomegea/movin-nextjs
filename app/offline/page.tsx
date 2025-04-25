"use client"

import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24 mb-4 bg-gray-800 rounded-full p-4 flex items-center justify-center">
            <Image src="/images/logo.png" alt="Movin Logo" width={60} height={60} className="object-contain" />
            <div className="absolute -top-2 -right-2 bg-red-500 p-2 rounded-full">
              <WifiOff className="h-4 w-4" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-300 mb-8">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>

        <Button onClick={handleRefresh} className="bg-blue-500 hover:bg-blue-600">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>

        <p className="mt-8 text-sm text-gray-400">
          Don't worry, your activity data is still being tracked and will sync when you're back online.
        </p>
      </motion.div>
    </div>
  )
}
