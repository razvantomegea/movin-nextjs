"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { motion } from "framer-motion"
import { GoalProgressCard } from "@/components/goal-progress-card"

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

export function GoalsPage() {
  return (
    <DashboardLayout>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <h1 className="text-2xl font-bold">Your Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your progress and earn rewards</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <h2 className="text-lg font-medium mb-3">Daily Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GoalProgressCard
                title="Step Goal"
                currentValue={7842}
                targetValue={10000}
                unit="steps"
                icon="steps"
                autoTrigger={false}
              />
              <GoalProgressCard
                title="Active Minutes"
                currentValue={45}
                targetValue={30}
                unit="min"
                icon="workout"
                autoTrigger={true}
              />
            </div>
          </motion.div>

          <motion.div variants={item}>
            <h2 className="text-lg font-medium mb-3">Weekly Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GoalProgressCard
                title="Workout Goal"
                currentValue={5}
                targetValue={5}
                unit="workouts"
                icon="workout"
                autoTrigger={true}
              />
              <GoalProgressCard
                title="Distance Goal"
                currentValue={18.5}
                targetValue={20}
                unit="km"
                icon="steps"
                autoTrigger={false}
              />
            </div>
          </motion.div>

          <motion.div variants={item}>
            <h2 className="text-lg font-medium mb-3">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GoalProgressCard
                title="Activity Streak"
                currentValue={7}
                targetValue={7}
                unit="days"
                icon="streak"
                autoTrigger={true}
              />
              <GoalProgressCard
                title="Level Progress"
                currentValue={850}
                targetValue={1000}
                unit="points"
                icon="level"
                autoTrigger={false}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
