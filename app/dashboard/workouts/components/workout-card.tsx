import React from 'react';
import { Play, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDuration, formatDate } from '@/utils';

export interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    created_at: string;
    total_volume: number;
    total_duration: number;
    notes?: string;
  };
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, onView, onDelete }) => (
  <Card
    className="hover:shadow-lg transition-shadow cursor-pointer"
    onClick={() => onView(workout.id)}
  >
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg">{workout.name}</CardTitle>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(workout.created_at)}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-gray-600 dark:text-gray-400">Volume</div>
          <div className="text-lg font-semibold">{workout.total_volume.toLocaleString()}</div>
        </div>
        <div>
          <div className="font-medium text-gray-600 dark:text-gray-400">Duration</div>
          <div className="text-lg font-semibold">{formatDuration(workout.total_duration)}</div>
        </div>
      </div>

      {workout.notes && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {workout.notes}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(workout.id)}
          className="flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          View
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(workout.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </CardContent>
  </Card>
);
