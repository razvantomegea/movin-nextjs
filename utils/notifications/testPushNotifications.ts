/**
 * Push Notification Testing Utilities
 * Helper functions to test push subscriptions and FCM integration
 */

export interface TestNotificationPayload {
  address: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  url?: string;
  tag?: string;
}

/**
 * Send a test notification via your API endpoint
 */
export async function sendTestNotification(payload: TestNotificationPayload): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test notification scenarios
 */
export const testScenarios = {
  /**
   * Basic notification test
   */
  basic: (address: string): TestNotificationPayload => ({
    address,
    title: '🧪 Test Notification',
    body: 'This is a basic test notification from Movin!',
    tag: 'test-basic',
  }),

  /**
   * Rich notification with actions and data
   */
  rich: (address: string): TestNotificationPayload => ({
    address,
    title: '🎯 Rich Test Notification',
    body: 'This notification has custom icon, badge, and data',
    icon: '/icons/icon-192.webp',
    badge: '/icons/icon-96.webp',
    url: '/dashboard/rewards',
    data: {
      type: 'test',
      timestamp: Date.now(),
      customData: 'rich-notification-test',
    },
    tag: 'test-rich',
  }),

  /**
   * Activity-related notification
   */
  activity: (address: string): TestNotificationPayload => ({
    address,
    title: '🏃‍♂️ Activity Reminder',
    body: 'Time to log your daily activity and earn rewards!',
    url: '/dashboard',
    data: {
      type: 'activity_reminder',
      action_url: '/dashboard',
    },
    tag: 'test-activity',
  }),

  /**
   * Reward notification
   */
  reward: (address: string): TestNotificationPayload => ({
    address,
    title: '🎁 Reward Earned!',
    body: 'Congratulations! You have earned 50 MVN tokens.',
    url: '/dashboard/rewards',
    data: {
      type: 'reward',
      amount: 50,
      token: 'MVN',
    },
    tag: 'test-reward',
  }),

  /**
   * System notification
   */
  system: (address: string): TestNotificationPayload => ({
    address,
    title: '⚙️ System Update',
    body: 'Your Movin app has been updated with new features!',
    url: '/dashboard/settings',
    data: {
      type: 'system_update',
      version: '1.0.0',
    },
    tag: 'test-system',
  }),
};

/**
 * Run all test scenarios for a given address
 */
export async function runAllTests(address: string): Promise<{
  results: Array<{
    scenario: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const results = [];

  for (const [scenarioName, scenarioFn] of Object.entries(testScenarios)) {
    console.log(`🧪 Testing scenario: ${scenarioName}`);

    const payload = scenarioFn(address);
    const result = await sendTestNotification(payload);

    results.push({
      scenario: scenarioName,
      ...result,
    });

    // Add delay between tests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  return {
    results,
    summary: {
      total: results.length,
      successful,
      failed,
    },
  };
}

/**
 * Test push subscription status
 */
export async function checkSubscriptionStatus(address: string): Promise<{
  hasSubscriptions: boolean;
  subscriptionCount: number;
  subscriptions?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`/api/push/subscriptions?address=${address}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        hasSubscriptions: false,
        subscriptionCount: 0,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      hasSubscriptions: data.subscriptions.length > 0,
      subscriptionCount: data.subscriptions.length,
      subscriptions: data.subscriptions,
    };
  } catch (error) {
    return {
      hasSubscriptions: false,
      subscriptionCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Browser console helpers for manual testing
 */
export const consoleHelpers = {
  /**
   * Test basic notification
   */
  testBasic: async (address: string) => {
    console.group('🧪 Testing Basic Notification');
    const result = await sendTestNotification(testScenarios.basic(address));
    console.log('Result:', result);
    console.groupEnd();
    return result;
  },

  /**
   * Test all scenarios
   */
  testAll: async (address: string) => {
    console.group('🧪 Testing All Notification Scenarios');
    const results = await runAllTests(address);
    console.log('Summary:', results.summary);
    console.table(results.results);
    console.groupEnd();
    return results;
  },

  /**
   * Check subscription status
   */
  checkStatus: async (address: string) => {
    console.group('📊 Checking Subscription Status');
    const status = await checkSubscriptionStatus(address);
    console.log('Status:', status);
    console.groupEnd();
    return status;
  },
};

// Make helpers available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).pushTestHelpers = consoleHelpers;
  console.log('🧪 Push test helpers available at window.pushTestHelpers');
}
