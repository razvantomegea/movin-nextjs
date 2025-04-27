"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Clock, Flame, TrendingUp, RefreshCw, Dumbbell } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { CircularProgress } from "@/components/circular-progress"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchActivityData, resetActivityError } from "@/lib/redux/slices/activityDataSlice"
import { ActivityDashboardSkeleton } from "@/components/skeletons/activity-dashboard-skeleton"
import { ErrorAlert } from "@/components/ui/error-alert"
import ErrorBoundary from "@/components/error-boundary"
import { ActivityColumnChart } from "@/components/activity-column-chart"
import { showSuccessToast, showInfoToast } from "@/lib/redux/slices/toastSlice"

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
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [refreshing, setRefreshing] = useState(false)

  const dispatch = useAppDispatch()

  // Get activity data from Redux store
  const { dailyActivity, weeklyData, monthlyData, yearlyData, todaysWorkouts, isLoading, error } = useAppSelector(
    (state) => state.activityData,
  )

  // Fetch data when component mounts
  useEffect(() => {
    dispatch(fetchActivityData())
  }, [dispatch])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await dispatch(fetchActivityData()).unwrap()
      dispatch(
        showSuccessToast({
          title: "Data Refreshed",
          description: "Your activity data has been updated",
        }),
      )
    } catch (error) {
      dispatch(
        showInfoToast({
          title: "Refresh Failed",
          description: "Please try again later",
        }),
      )
    } finally {
      setRefreshing(false)
    }
  }

  const handleRetryLoadActivity = () => {
    dispatch(resetActivityError())
    dispatch(fetchActivityData())
  }

  // Render the dashboard content
  const renderDashboardContent = () => {
    if (isLoading && !refreshing) {
      return <ActivityDashboardSkeleton />
    }

    if (error) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={error} />
          <Button onClick={handleRetryLoadActivity} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Daily Activity Card */}
        <motion.div variants={item}>
          <Card
            className={`${isDark ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" : "bg-gradient-to-br from-white to-gray-100 border-gray-200"}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Today</span>
                </div>
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{dailyActivity.date}</span>
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
                      {dailyActivity.steps.toLocaleString()}
                    </motion.span>
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} ml-2`}>/ 10,000 steps</span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Progress value={(dailyActivity.steps / 10000) * 100} className="h-2 mt-3" />
                  </motion.div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Flame className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyActivity.calories}</span>
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>kcal</span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyActivity.distance}</span>
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>km</span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.floor(dailyActivity.activeMinutes / 60)}h {dailyActivity.activeMinutes % 60}m
                      </span>
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>active</span>
                    </motion.div>
                  </div>
                </div>

                <div className="ml-6">
                  <CircularProgress value={(dailyActivity.steps / 10000) * 100} size={100} strokeWidth={8} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Chart */}
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-lg font-medium">Activity Overview</h2>
          <ActivityColumnChart weeklyData={weeklyData} monthlyData={monthlyData} yearlyData={yearlyData} />
        </motion.div>

        {/* Today's Workouts */}
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-lg font-medium">Today's Workouts</h2>
          <Card className={isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}>
            <CardContent className="p-6">
              {todaysWorkouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No workouts recorded today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysWorkouts.map((workout, i) => (
                    <motion.div
                      key={workout.id}
                      className={`flex items-center p-3 ${isDark ? "bg-gray-800/50" : "bg-gray-200/70"} rounded-lg`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                        <Activity className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{workout.type}</span>
                          <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {workout.time}
                          </span>
                        </div>
                        <div className={`flex text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}>
                          <span className="mr-3">{workout.duration}</span>
                          {workout.distance && <span className="mr-3">{workout.distance}</span>}
                          <span>{workout.calories} kcal</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <DashboardLayout onRefresh={handleRefresh} isLoading={isLoading || refreshing}>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="flex items-center justify-between mb-6" variants={item}>
          <h1 className="text-2xl font-bold">Activity</h1>
        </motion.div>

        <ErrorBoundary>{renderDashboardContent()}</ErrorBoundary>
      </motion.div>
    </DashboardLayout>
  )
}
