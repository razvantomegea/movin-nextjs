import { IActivity } from '@/lib/supabase/activities';

/**
 * Estimates calories burned from steps using a standard formula
 * Formula: steps * 0.04 calories per step (average for a 150lb person)
 * @param steps Number of steps
 * @returns Estimated calories burned
 */
export function estimateCaloriesFromSteps(steps: number): number {
  // Average calories per step for a 150lb (68kg) person
  const caloriesPerStep = 0.04;
  return Math.round(steps * caloriesPerStep);
}

/**
 * Checks if an activity should be processed as a Steps activity
 * @param activityData The activity data to check
 * @returns true if it should be processed as Steps
 */
export function shouldProcessAsSteps(activityData: Partial<IActivity>): boolean {
  const name = activityData.name?.toLowerCase() || '';
  const hasSteps = (activityData.total_steps || 0) > 0;
  const hasNoDurationOrCalories =
    (!activityData.duration || activityData.duration === 0) &&
    (!activityData.total_energy_burned || activityData.total_energy_burned === 0);

  return (
    (name.includes('walking') || name.includes('steps')) && hasSteps && hasNoDurationOrCalories
  );
}

/**
 * Processes a Steps activity by normalizing the name and estimating calories
 * @param activityData The activity data to process
 * @returns Processed activity data
 */
export function processStepsActivity(activityData: Partial<IActivity>): Partial<IActivity> {
  if (!shouldProcessAsSteps(activityData)) {
    return activityData;
  }

  const steps = activityData.total_steps || 0;
  const estimatedCalories = estimateCaloriesFromSteps(steps);

  return {
    ...activityData,
    name: 'Steps',
    total_energy_burned: estimatedCalories,
    // Keep duration as 0 or minimal since it's cumulative daily steps
    duration: activityData.duration || 0,
  };
}

/**
 * Merges new Steps activity with existing Steps activity for the same day
 * @param existingActivity The existing Steps activity
 * @param newActivity The new Steps activity to merge
 * @returns Merged activity data
 */
export function mergeStepsActivities(
  existingActivity: IActivity,
  newActivity: Partial<IActivity>,
): Partial<IActivity> {
  const existingSteps = existingActivity.total_steps || 0;
  const newSteps = newActivity.total_steps || 0;

  // Only merge if new activity has more steps (assumes it's more recent/complete data)
  if (newSteps <= existingSteps) {
    return existingActivity;
  }

  const totalSteps = newSteps; // Use new steps value (it should be the total for the day)
  const estimatedCalories = estimateCaloriesFromSteps(totalSteps);

  return {
    ...existingActivity,
    total_steps: totalSteps,
    total_energy_burned: estimatedCalories,
    // Update the end time to reflect the more recent import
    end_date: newActivity.end_date || existingActivity.end_date,
    source: existingActivity.source
      ? `${existingActivity.source}, Screenshot Import`
      : 'Screenshot Import',
  };
}

/**
 * Finds existing Steps activity for the same day
 * @param activities Array of all activities
 * @param targetDate The date to check for existing Steps activity
 * @returns Existing Steps activity or null
 */
export function findExistingStepsActivity(
  activities: IActivity[],
  targetDate: Date,
): IActivity | null {
  return (
    activities.find((activity) => {
      if (activity.name !== 'Steps') return false;

      const activityDate = new Date(activity.start_date);
      return (
        activityDate.getFullYear() === targetDate.getFullYear() &&
        activityDate.getMonth() === targetDate.getMonth() &&
        activityDate.getDate() === targetDate.getDate()
      );
    }) || null
  );
}
