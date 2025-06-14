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

  const baseActivity: Partial<IActivity> = {
    address: userAddress,
    name: extractedData.name,
    source: 'Screenshot Import', // Indicates this activity was imported from a screenshot
    start_date: startTime.toISOString(),
    end_date: endTime.toISOString(),
    duration: extractedData.duration, // seconds
    total_distance: extractedData.distance || 0, // meters
    total_energy_burned: extractedData.calories, // kcal
    total_steps: extractedData.steps || 0,
    // Heart rate data from the screenshot
    maximum_heart_rate: extractedData.heartRate?.maximum || 0,
    average_heart_rate: extractedData.heartRate?.average || 0,
    minimum_heart_rate: extractedData.heartRate?.minimum || 0,
    // created_at and updated_at will be set by Supabase
  };

  // Process the activity for Steps normalization and calorie estimation
  return processStepsActivity(baseActivity);
}
