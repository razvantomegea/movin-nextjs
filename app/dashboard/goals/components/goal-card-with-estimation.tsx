import { type Goal } from '@/lib/redux/slices/goalsSlice';
import { type ProgressEstimation } from '@/utils/goals/progressCalculations';
import { GoalProgressCard } from './goal-progress-card';

// Reusable component for rendering a GoalProgressCard with estimation data
export function GoalCardWithEstimation({
  goal,
  progressEstimations,
  formatEstimationText,
  getValidIcon,
  handleShareGoalAchievement,
  addressLower,
  handleEditGoal,
}: {
  goal: Goal;
  progressEstimations: Record<string, ProgressEstimation>;
  formatEstimationText: (
    estimation: ProgressEstimation,
    category: 'daily' | 'weekly' | 'monthly',
  ) => string;
  getValidIcon: (icon: string) => 'steps' | 'workout' | 'streak' | 'level';
  handleShareGoalAchievement: (
    goalType: string,
    goalValue: string,
    goalTitle: string,
    goalUnit: string,
  ) => void;
  addressLower: string;
  handleEditGoal: (goal: Goal) => void;
}) {
  const estimation = progressEstimations[goal.id];
  const estimationText = estimation ? formatEstimationText(estimation, goal.category) : undefined;

  return (
    <GoalProgressCard
      key={goal.id}
      title={goal.title}
      currentValue={goal.currentValue}
      targetValue={goal.targetValue}
      unit={goal.unit}
      icon={getValidIcon(goal.icon)}
      autoTrigger={goal.autoTrigger}
      category={goal.category}
      progressEstimation={estimation}
      estimationText={estimationText}
      onShare={() =>
        handleShareGoalAchievement(
          goal.goalType,
          goal.targetValue.toString(),
          goal.title,
          goal.unit,
        )
      }
      userAddress={addressLower}
      onEdit={() => handleEditGoal(goal)}
    />
  );
}
