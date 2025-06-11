/**
 * Utility functions for sending push notifications
 */

export interface PushNotificationPayload {
  address: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
  tag?: string;
}

/**
 * Send a push notification to a user
 * @param payload - The notification payload
 * @returns Promise with the result
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send push notification:', error);
      return false;
    }

    const result = await response.json();
    console.log('Push notification sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send a steps goal achievement notification
 */
export function sendStepsGoalNotification(address: string, steps: number) {
  return sendPushNotification({
    address,
    title: '🎯 Daily Steps Goal Achieved!',
    body: `Congratulations! You've reached ${steps.toLocaleString()} steps today!`,
    icon: '/icons/icon-192.webp',
    url: '/dashboard',
    tag: 'steps-goal',
    data: { type: 'achievement', category: 'steps', value: steps },
  });
}

/**
 * Send a streak milestone notification
 */
export function sendStreakMilestoneNotification(address: string, streakDays: number) {
  return sendPushNotification({
    address,
    title: '🔥 Streak Milestone Reached!',
    body: `Amazing! You've maintained a ${streakDays}-day activity streak!`,
    icon: '/icons/icon-192.webp',
    url: '/dashboard/profile',
    tag: 'streak-milestone',
    data: { type: 'achievement', category: 'streak', value: streakDays },
  });
}

/**
 * Send a workout completion notification
 */
export function sendWorkoutCompletionNotification(
  address: string,
  workoutType: string,
  duration: number,
  distance?: number,
) {
  const distanceText = distance ? ` for ${distance.toFixed(2)} km` : '';
  const durationMinutes = Math.round(duration / 60);

  return sendPushNotification({
    address,
    title: '💪 Workout Completed!',
    body: `Great job on your ${workoutType} workout${distanceText} for ${durationMinutes} minutes!`,
    icon: '/icons/icon-192.webp',
    url: '/dashboard',
    tag: 'workout-completed',
    data: {
      type: 'workout',
      workoutType,
      duration,
      distance: distance || 0,
    },
  });
}

/**
 * Send a daily reminder notification
 */
export function sendDailyReminderNotification(address: string) {
  return sendPushNotification({
    address,
    title: '📱 Daily Activity Reminder',
    body: "Don't forget to log your activities today! Keep your streak going!",
    icon: '/icons/icon-192.webp',
    url: '/dashboard',
    tag: 'daily-reminder',
    data: { type: 'reminder', category: 'daily' },
  });
}

/**
 * Send reward available notification
 */
export function sendRewardAvailableNotification(address: string, rewardAmount: number) {
  return sendPushNotification({
    address,
    title: '💰 Rewards Available!',
    body: `You have ${rewardAmount.toFixed(2)} MOVIN tokens ready to claim!`,
    icon: '/icons/icon-192.webp',
    url: '/dashboard/rewards',
    tag: 'rewards-available',
    data: { type: 'reward', amount: rewardAmount },
  });
}
