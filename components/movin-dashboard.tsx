"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Calendar, Clock, Flame, Heart, TrendingUp, Trophy, Watch, Dumbbell } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { CircularProgress } from "@/components/circular-progress"
import { motion } from "framer-motion"
import { CelebrationAnimation } from "@/components/celebration-animation"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function MovinDashboard() {
  const [activeTab, setActiveTab] = useState("steps")
  const [showCelebration, setShowCelebration] = useState(false)
  const [achievementType, setAchievementType] = useState<"steps" | "workout" | "streak" | "level">("steps")
  const [achievementValue, setAchievementValue] = useState("")
  const [achievementTitle, setAchievementTitle] = useState("")
  const [achievementDescription, setAchievementDescription] = useState("")

  // Demo function to trigger different celebrations
  const triggerCelebration = (type: "steps" | "workout" | "streak" | "level") => {
    setAchievementType(type)

    switch (type) {
      case "steps":
        setAchievementValue("10,000 Steps")
        setAchievementTitle("Daily Step Goal")
        setAchievementDescription("You've reached your daily step goal! Keep up the great work and stay active.")
        break
      case "workout":
        setAchievementValue("5 Workouts")
        setAchievementTitle("Weekly Workout Goal")
        setAchievementDescription("You've completed 5 workouts this week! Your consistency is paying off.")
        break
      case "streak":
        setAchievementValue("7 Day Streak")
        setAchievementTitle("Activity Streak")
        setAchievementDescription("You've been active for 7 consecutive days! Your dedication is impressive.")
        break
      case "level":
        setAchievementValue("Level 5")
        setAchievementTitle("Level Up")
        setAchievementDescription("You've reached Level 5! New rewards and challenges are now available.")
        break
    }

    setShowCelebration(true)
  }

  return (
    <DashboardLayout>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <Tabs defaultValue="steps" onValueChange={setActiveTab} className="w-full">
          <motion.div className="flex items-center justify-between mb-6" variants={item}>
            <h1 className="text-2xl font-bold">Activity</h1>
            <TabsList className="grid grid-cols-2 h-10 p-0.5">
              <TabsTrigger value="steps" className="px-4">
                Steps
              </TabsTrigger>
              <TabsTrigger value="workouts" className="px-4">
                Workouts
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="steps" className="mt-0">
            <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
              <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Today</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">April 25, 2025</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline">
                          <motion.span
                            className="text-4xl font-bold"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          >
                            7,842
                          </motion.span>
                          <span className="text-sm text-gray-400 ml-2">/ 10,000 steps</span>
                        </div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <Progress value={78} className="h-2 mt-3" />
                        </motion.div>

                        <div className="grid grid-cols-3 gap-4 mt-6">
                          <motion.div
                            className="flex flex-col items-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                              <Flame className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">428</span>
                            <span className="text-xs text-gray-400">kcal</span>
                          </motion.div>

                          <motion.div
                            className="flex flex-col items-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                              <TrendingUp className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">5.2</span>
                            <span className="text-xs text-gray-400">km</span>
                          </motion.div>

                          <motion.div
                            className="flex flex-col items-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">1h 12m</span>
                            <span className="text-xs text-gray-400">active</span>
                          </motion.div>
                        </div>
                      </div>

                      <div className="ml-6">
                        <CircularProgress value={78} size={100} strokeWidth={8} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Weekly Overview */}
              <motion.div className="space-y-4" variants={item}>
                <h2 className="text-lg font-medium">Weekly Overview</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Calendar className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">This Week</span>
                      </div>
                      <div className="flex items-center text-sm text-blue-400">
                        <Trophy className="h-4 w-4 mr-1" />
                        <span>78% of goal</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 h-32">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                        <motion.div
                          key={i}
                          className="flex flex-col items-center"
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          transition={{ duration: 0.5, delay: 0.1 * i }}
                        >
                          <div className="flex-1 w-full flex items-end">
                            <motion.div
                              className={`w-full rounded-t-sm ${i === 3 ? "bg-blue-500" : "bg-blue-500/40"}`}
                              style={{ height: `${[65, 40, 85, 100, 55, 30, 60][i]}%` }}
                              initial={{ height: 0 }}
                              animate={{ height: `${[65, 40, 85, 100, 55, 30, 60][i]}%` }}
                              transition={{ duration: 0.5, delay: 0.2 + 0.1 * i }}
                            ></motion.div>
                          </div>
                          <span className={`text-xs mt-2 ${i === 3 ? "text-blue-400 font-medium" : "text-gray-400"}`}>
                            {day}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Health Metrics */}
              <motion.div className="space-y-4" variants={item}>
                <h2 className="text-lg font-medium">Health Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                    <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-500/20 p-1.5 rounded-full mr-2">
                            <Heart className="h-4 w-4 text-blue-400" />
                          </div>
                          <span className="text-sm font-medium">Heart Rate</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">72</span>
                          <span className="text-xs text-gray-400 ml-1">bpm</span>
                        </div>
                        <span className="text-xs text-gray-400">Resting</span>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                    <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-500/20 p-1.5 rounded-full mr-2">
                            <Watch className="h-4 w-4 text-blue-400" />
                          </div>
                          <span className="text-sm font-medium">Sleep</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">7h 20m</span>
                        </div>
                        <span className="text-xs text-gray-400">Last night</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>

              {/* Demo Celebration Triggers */}
              <motion.div className="space-y-4 mt-8" variants={item}>
                <h2 className="text-lg font-medium">Demo Achievement Celebrations</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => triggerCelebration("steps")} className="bg-blue-500 hover:bg-blue-600">
                    <Trophy className="h-4 w-4 mr-2" /> Step Goal
                  </Button>
                  <Button onClick={() => triggerCelebration("workout")} className="bg-purple-500 hover:bg-purple-600">
                    <Activity className="h-4 w-4 mr-2" /> Workout Goal
                  </Button>
                  <Button onClick={() => triggerCelebration("streak")} className="bg-orange-500 hover:bg-orange-600">
                    <Flame className="h-4 w-4 mr-2" /> Streak Goal
                  </Button>
                  <Button onClick={() => triggerCelebration("level")} className="bg-green-500 hover:bg-green-600">
                    <Star className="h-4 w-4 mr-2" /> Level Up
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Workouts tab content would be similarly updated with animations */}
          <TabsContent value="workouts" className="mt-0">
            <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
              <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Dumbbell className="h-5 w-5 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Recent Workouts</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { type: "Running", duration: "32 min", distance: "4.2 km", calories: 320, date: "Today" },
                        { type: "Cycling", duration: "45 min", distance: "12 km", calories: 380, date: "Yesterday" },
                        { type: "HIIT", duration: "25 min", distance: "", calories: 280, date: "2 days ago" },
                      ].map((workout, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center p-3 bg-gray-800/50 rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                        >
                          <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                            <Activity className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{workout.type}</span>
                              <span className="text-sm text-gray-400">{workout.date}</span>
                            </div>
                            <div className="flex text-sm text-gray-400 mt-1">
                              <span className="mr-3">{workout.duration}</span>
                              {workout.distance && <span className="mr-3">{workout.distance}</span>}
                              <span>{workout.calories} kcal</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div className="space-y-4" variants={item}>
                <h2 className="text-lg font-medium">Weekly Activity</h2>
                <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                          <Flame className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Activity Summary</span>
                      </div>
                      <div className="flex items-center text-sm text-blue-400">
                        <span>This Week</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Workouts</span>
                        <span className="font-medium">5 sessions</span>
                      </div>
                      <Progress value={70} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Minutes</span>
                        <span className="font-medium">187 min</span>
                      </div>
                      <Progress value={85} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Calories Burned</span>
                        <span className="font-medium">1,842 kcal</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Celebration Animation */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievementType={achievementType}
        achievementValue={achievementValue}
        achievementTitle={achievementTitle}
        description={achievementDescription}
      />
    </DashboardLayout>
  )
}
