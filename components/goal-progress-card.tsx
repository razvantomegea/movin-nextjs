"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Award, Flame, Star } from "lucide-react"
import { CelebrationAnimation } from "@/components/celebration-animation"

interface GoalProgressCardProps {
  title: string
  currentValue: number
  targetValue: number
  unit: string
  icon: "steps" | "workout" | "streak" | "level"
  autoTrigger?: boolean
}

export function GoalProgressCard({
  title,
  currentValue,
  targetValue,
  unit,
  icon,
  autoTrigger = false,
}: GoalProgressCardProps) {
  const [progress, setProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  // Calculate progress percentage
  const progressPercentage = Math.min(Math.round((currentValue / targetValue) * 100), 100)

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(progressPercentage)
    }, 500)
    return () => clearTimeout(timer)
  }, [progressPercentage])

  // Auto trigger celebration if goal is reached and autoTrigger is true
  useEffect(() => {
    if (autoTrigger && progressPercentage >= 100 && !hasTriggered) {
      const timer = setTimeout(() => {
        setShowCelebration(true)
        setHasTriggered(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [progressPercentage, autoTrigger, hasTriggered])

  const getIcon = () => {
    switch (icon) {
      case "steps":
        return <Trophy className="h-5 w-5 text-blue-400" />
      case "workout":
        return <Award className="h-5 w-5 text-purple-400" />
      case "streak":
        return <Flame className="h-5 w-5 text-orange-400" />
      case "level":
        return <Star className="h-5 w-5 text-green-400" />
    }
  }

  const getAchievementTitle = () => {
    switch (icon) {
      case "steps":
        return "Daily Step Goal"
      case "workout":
        return "Workout Goal"
      case "streak":
        return "Activity Streak"
      case "level":
        return "Level Up"
    }
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        onClick={() => progressPercentage >= 100 && setShowCelebration(true)}
      >
        <Card
          className={`bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 ${progressPercentage >= 100 ? "cursor-pointer" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-1.5 rounded-full mr-2">{getIcon()}</div>
                <span className="text-sm font-medium">{title}</span>
              </div>
              <AnimatePresence>
                {progressPercentage >= 100 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="bg-green-500/20 p-1 rounded-full"
                  >
                    <Trophy className="h-4 w-4 text-green-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold">
                {currentValue.toLocaleString()} <span className="text-sm text-gray-400">{unit}</span>
              </span>
              <span className="text-sm text-gray-400">
                Goal: {targetValue.toLocaleString()} {unit}
              </span>
            </div>

            <div className="relative">
              <Progress value={progress} className="h-2" />
              {progressPercentage >= 100 && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                />
              )}
            </div>

            <div className="flex justify-end mt-1">
              <span className="text-xs font-medium text-blue-500">{progressPercentage}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievementType={icon}
        achievementValue={`${targetValue.toLocaleString()} ${unit}`}
        achievementTitle={getAchievementTitle()}
        description={`Congratulations! You've reached your ${title.toLowerCase()} goal.`}
      />
    </>
  )
}
