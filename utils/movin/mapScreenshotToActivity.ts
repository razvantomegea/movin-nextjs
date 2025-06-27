import { IActivity } from '@/lib/supabase/activities';
import { processStepsActivity } from './processStepsActivity';

export interface ExtractedActivityData {
  name: string;
  duration: number; // in seconds
  distance?: number; // in meters
  calories: number;
  steps?: number;
  heartRate?: {
    average?: number;
    maximum?: number;
    minimum?: number;
  };
  deviceTime: string;
  activityTime: string;
  activityDate: string; // ISO date string (YYYY-MM-DD)
  isValidScreenshot: boolean;
  isValidTiming: boolean;
}

/**
 * Maps extracted screenshot data to a partial IActivity object.
 * @param extractedData The data extracted from the screenshot using AI.
 * @param userAddress The wallet address of the user.
 * @returns A partial IActivity object ready for insertion.
 */
export function mapScreenshotToActivity(
  extractedData: ExtractedActivityData,
  userAddress: string,
): Partial<IActivity> {
  // Use the extracted activity date if available, otherwise use today's date
  const activityDate = extractedData.activityDate
    ? new Date(extractedData.activityDate)
    : new Date();

  // Calculate end time as the activity date with current time
  const endTime = new Date(activityDate);
  // If it's today, use current time, otherwise use end of day
  if (new Date().toDateString() === activityDate.toDateString()) {
    endTime.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
  } else {
    endTime.setHours(23, 59, 59);
  }

  // Calculate start time based on duration
  const startTime = new Date(endTime.getTime() - extractedData.duration * 1000);

  // If steps are missing but distance is present, estimate steps
  let steps = extractedData.steps;
  let distance = extractedData.distance;
  // Use 1300 steps per km as a common estimate (from mapRouteToActivity)
  const STEPS_PER_KM = 1300;
  const METERS_PER_STEP = 1000 / STEPS_PER_KM; // ~0.77 meters per step

  if ((steps == null || steps === 0) && distance && distance > 0) {
    steps = Math.round((distance / 1000) * STEPS_PER_KM);
  } else if ((distance == null || distance === 0) && steps && steps > 0) {
    distance = Math.round(steps * METERS_PER_STEP);
  }

  const baseActivity: Partial<IActivity> = {
    address: userAddress,
    name: extractedData.name || 'Imported Activity',
    source: 'Screenshot Import', // Indicates this activity was imported from a screenshot
    start_date: startTime.toISOString(),
    end_date: endTime.toISOString(),
    duration: extractedData.duration, // seconds@multiversx/sdk-dapp-utils@2.0.2-alpha.1
    total_distance: distance || 0, // meters
    total_energy_burned: extractedData.calories || 0, // kcal
    total_steps: steps || 0,
    // Heart rate data from the screenshot
    maximum_heart_rate: extractedData.heartRate?.maximum || 0,
    average_heart_rate: extractedData.heartRate?.average || 0,
    minimum_heart_rate: extractedData.heartRate?.minimum || 0,
    // created_at and updated_at will be set by Supabase
  };

  // Process the activity for Steps normalization and calorie estimation
  return processStepsActivity(baseActivity);
}
