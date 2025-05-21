import { RouteData } from '@/app/dashboard/components/route-tracking-modal'; // Assuming RouteData is exported from here
import { IActivity } from '@/lib/supabase/activities';

/**z
 * Maps manually tracked route data to a partial IActivity object.
 * @param routeData The route data collected from tracking.
 * @param userAddress The wallet address of the user.
 * @returns A partial IActivity object ready for insertion.
 */
export function mapRouteToActivity(routeData: RouteData, userAddress: string): Partial<IActivity> {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + routeData.duration * 1000);

  // Calorie calculation based on the existing logic in movin-dashboard.tsx
  // (distance in km) / 15. Note: This formula results in very low calorie values.
  const caloriesBurned = Math.round(routeData.distance / 1000 / 15);

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
