"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
  isLoading?: boolean
  className?: string
}

export function RefreshButton({ onRefresh, isLoading = false, className = "" }: RefreshButtonProps) {
  const handleRefresh = async () => {
    if (!isLoading) {
      await onRefresh()
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      disabled={isLoading}
      className={`rounded-full ${className}`}
      aria-label="Refresh data"
    >
      <motion.div
        animate={{ rotate: isLoading ? 360 : 0 }}
        transition={{ duration: 1, repeat: isLoading ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
      >
        <RefreshCw className="h-4 w-4" />
      </motion.div>
    </Button>
  )
}
