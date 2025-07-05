import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { WorkoutExercise } from '@/types/workouts';

export interface ExerciseCardProps {
  exercise: WorkoutExercise;
  workoutId: string;
  onEdit: (exercise: WorkoutExercise) => void;
  onDelete: (exerciseId: string) => void;
  onUpdateProgress: (exerciseId: string, completedSets: number) => void;
}

export function ExerciseCard({ exercise, workoutId, onEdit, onDelete, onUpdateProgress }: ExerciseCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSets, setCompletedSets] = useState(exercise.completed_sets);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const volume = exercise.sets * exercise.reps * exercise.weight;

  const handleSetCompletion = (setNumber: number) => {
    const newCompletedSets = setNumber > completedSets ? setNumber : setNumber - 1;
    setCompletedSets(newCompletedSets);
    onUpdateProgress(exercise.id, newCompletedSets);
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/workouts/${workoutId}/exercises/${exercise.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{exercise.exercise_name}</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight}lbs
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={completedSets === exercise.sets ? 'default' : 'secondary'}>
                  {completedSets}/{exercise.sets} sets
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Volume</div>
                <div className="text-lg font-semibold">{volume.toLocaleString()}</div>
              </div>
              {exercise.time_under_tension > 0 && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">TUT</div>
                  <div className="text-lg font-semibold">
                    {formatTime(exercise.time_under_tension)}
                  </div>
                </div>
              )}
              {exercise.exercise_duration > 0 && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Duration
                  </div>
                  <div className="text-lg font-semibold">
                    {formatTime(exercise.exercise_duration)}
                  </div>
                </div>
              )}
              {exercise.rest_time > 0 && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Rest</div>
                  <div className="text-lg font-semibold">{formatTime(exercise.rest_time)}</div>
                </div>
              )}
            </div>

            {/* Set Tracking */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Track Sets:</div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: exercise.sets }, (_, i) => (
                  <Button
                    key={i}
                    variant={i < completedSets ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSetCompletion(i + 1)}
                    className="w-10 h-10 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>

            {exercise.notes && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-1">Notes:</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{exercise.notes}</div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                <BarChart3 className="h-3 w-3 mr-1" />
                View Details
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(exercise)}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(exercise.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
