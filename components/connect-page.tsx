"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

export function ConnectPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    // Simulate connection process
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 dark:from-blue-500 dark:to-blue-700 from-blue-400 to-blue-600 p-4 text-white">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-12 animate-pulse">
          <div className="relative w-32 h-32 mb-4">
            <Image src="/images/logo.png" alt="Movin Logo" fill className="object-contain" priority />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4 text-center">Movin</h1>
        <p className="text-xl mb-12 text-center text-blue-100 dark:text-blue-100 text-blue-50">
          It all starts with one step
        </p>

        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full py-6 text-lg rounded-xl bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-lg"
        >
          {connecting ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Connecting...
            </div>
          ) : (
            <div className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Connect Wallet
            </div>
          )}
        </Button>

        <div className="mt-8 text-center text-blue-100 dark:text-blue-100 text-blue-50 text-sm">
          <p>Track your fitness. Earn rewards.</p>
          <p className="mt-1">Powered by MVN</p>
        </div>
      </div>
    </div>
  )
}
