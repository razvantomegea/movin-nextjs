"use client"

import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

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

export function GoalsPageSkeleton() {
  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <motion.div className="mb-6" variants={item}>
        <div className="flex items-center">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full ml-2" />
        </div>
        <Skeleton className="h-5 w-64 mt-1 rounded-md" />
      </motion.div>

      <div className="space-y-6">
        <motion.div variants={item}>
          <Skeleton className="h-6 w-32 mb-3 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoalCardSkeleton />
            <GoalCardSkeleton />
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Skeleton className="h-6 w-32 mb-3 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoalCardSkeleton />
            <GoalCardSkeleton />
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Skeleton className="h-6 w-32 mb-3 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoalCardSkeleton />
            <GoalCardSkeleton />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function GoalCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32 ml-3 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full rounded-md mb-2" />
      <Skeleton className="h-8 w-full rounded-md mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
    </div>
  )
}
