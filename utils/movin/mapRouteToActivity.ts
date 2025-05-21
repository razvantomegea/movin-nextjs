import { RouteData } from '@/app/dashboard/components/route-tracking-modal'; // Assuming RouteData is exported from here
import { IActivity } from '@/lib/supabase/activities';

/**
 * Maps manually tracked route data to a partial IActivity object.
 * @param routeData The route data collected from tracking.
 * @param userAddress The wallet address of the user.
 * @returns A partial IActivity object ready for insertion.
 */
export function mapRouteToActivity(routeData: RouteData, userAddress: string): Partial<IActivity> {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + routeData.duration * 1000);

  // Improved calorie calculation using MET values
  // Running MET is typically 7-12.5 depending on intensity, using 8 for moderate running
  // Formula: calories = MET * 3.5 * weight(kg) * duration(hours) / 200
  // Using an average weight of 70kg for estimation
  const MET = 8; // Moderate running
  const avgWeightKg = 70;
  const durationHours = routeData.duration / 3600;
  const caloriesBurned = Math.round((MET * 3.5 * avgWeightKg * durationHours) / 200);

  // Estimate steps: (distance in km) * (average steps per km)
  // Using a common estimate of 1300 steps per km.
  const stepsTaken = Math.round((routeData.distance / 1000) * 1300);

  const activityName = routeData.isJoint ? 'Joint Run' : 'Manual Run';

  return {
    address: userAddress,
    name: activityName,
    source: 'Route Tracking', // Indicates this activity was manually tracked in the app
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration: routeData.duration, // seconds
    total_distance: routeData.distance, // meters
    total_energy_burned: caloriesBurned, // kcal
    total_steps: stepsTaken,
    // Heart rate data is not available from this type of tracking
    maximum_heart_rate: 0,
    average_heart_rate: 0,
    minimum_heart_rate: 0,
    // created_at and updated_at will be set by Supabase
  };
}
