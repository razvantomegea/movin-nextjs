"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { motion, useAnimation, type PanInfo } from "framer-motion"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  isLoading?: boolean
}

export function PullToRefresh({ onRefresh, children, isLoading = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const controls = useAnimation()

  const THRESHOLD = 80 // Distance in pixels to trigger refresh
  const MAX_PULL_DISTANCE = 120

  // Reset when loading state changes
  useEffect(() => {
    if (!isLoading && isRefreshing) {
      setTimeout(() => {
        controls.start({ y: 0 })
        setIsRefreshing(false)
        setPullDistance(0)
      }, 500)
    }
  }, [isLoading, isRefreshing, controls])

  const handleDragStart = (_: any, info: PanInfo) => {
    // Only allow pull down when at the top of the page
    if (window.scrollY <= 0) {
      setIsPulling(true)
      startYRef.current = info.point.y
    }
  }

  const handleDrag = (_: any, info: PanInfo) => {
    if (!isPulling) return

    const distance = Math.max(0, info.point.y - startYRef.current)
    // Apply resistance to make it harder to pull down
    const resistedDistance = Math.min(distance * 0.4, MAX_PULL_DISTANCE)

    setPullDistance(resistedDistance)
    controls.set({ y: resistedDistance })
  }

  const handleDragEnd = () => {
    if (!isPulling) return

    setIsPulling(false)

    if (pullDistance >= THRESHOLD) {
      // Trigger refresh
      setIsRefreshing(true)
      controls.start({ y: THRESHOLD / 2 })
      onRefresh().catch(console.error)
    } else {
      // Reset
      controls.start({ y: 0 })
      setPullDistance(0)
    }
  }

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
        animate={controls}
      >
        <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : pullDistance >= THRESHOLD ? 180 : (pullDistance / THRESHOLD) * 180,
            }}
            transition={{
              duration: isRefreshing ? 1 : 0.2,
              repeat: isRefreshing ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            <RefreshCw className="h-5 w-5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        {children}
      </motion.div>
    </div>
  )
}
