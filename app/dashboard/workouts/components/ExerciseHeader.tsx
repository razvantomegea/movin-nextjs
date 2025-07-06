import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ExerciseHeaderProps {
  exerciseName: string;
  workoutName?: string;
  createdAt: string;
  completedSets: number;
  sets: number;
  onBack: () => void;
  variants: Variants;
}

export const ExerciseHeader: React.FC<ExerciseHeaderProps> = ({
  exerciseName,
  workoutName,
  createdAt,
  completedSets,
  sets,
  onBack,
  variants,
}) => (
  <motion.div
    className="flex items-center justify-between"
    variants={variants}
    initial="hidden"
    animate="show"
  >
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{exerciseName}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {workoutName} • {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
    <Badge variant="secondary" className="px-3 py-1">
      {completedSets}/{sets} sets completed
    </Badge>
  </motion.div>
);
