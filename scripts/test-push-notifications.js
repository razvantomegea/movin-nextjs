#!/usr/bin/env node

/**
 * Push Notification Testing Script
 *
 * Usage:
 *   node scripts/test-push-notifications.js <user-address> [scenario]
 *
 * Examples:
 *   node scripts/test-push-notifications.js 0x1234...5678
 *   node scripts/test-push-notifications.js 0x1234...5678 basic
 *   node scripts/test-push-notifications.js 0x1234...5678 all
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test scenarios
const scenarios = {
  basic: (address) => ({
    address,
    title: '🧪 Test Notification',
    body: 'This is a basic test notification from Movin!',
    tag: 'test-basic',
  }),

  rich: (address) => ({
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

  activity: (address) => ({
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

  reward: (address) => ({
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

  system: (address) => ({
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
 * Make HTTP request
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;

    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: result });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Send test notification
 */
async function sendTestNotification(payload) {
  const url = `${BASE_URL}/api/push/send`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    console.log(`📤 Sending notification: ${payload.title}`);
    const response = await makeRequest(url, options, payload);

    if (response.statusCode === 200) {
      console.log('✅ Success:', response.data.message || 'Notification sent');
      return { success: true, data: response.data };
    } else {
      console.log('❌ Error:', response.data.error || `HTTP ${response.statusCode}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check subscription status
 */
async function checkSubscriptionStatus(address) {
  const url = `${BASE_URL}/api/push/subscriptions?address=${address}`;
  const options = { method: 'GET' };

  try {
    console.log('📊 Checking subscription status...');
    const response = await makeRequest(url, options);

    if (response.statusCode === 200) {
      const count = response.data.data.activeCount || 0;
      console.log(`✅ Found ${count} active subscription(s)`);
      return { success: true, count, subscriptions: response.data.data.subscriptions };
    } else {
      console.log('❌ Error:', response.data.error || `HTTP ${response.statusCode}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all test scenarios
 */
async function runAllTests(address) {
  console.log('\n🧪 Running all test scenarios...\n');

  const results = [];

  for (const [scenarioName, scenarioFn] of Object.entries(scenarios)) {
    console.log(`\n--- Testing: ${scenarioName} ---`);

    const payload = scenarioFn(address);
    const result = await sendTestNotification(payload);

    results.push({
      scenario: scenarioName,
      ...result,
    });

    // Add delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  console.log('\n📊 Test Summary:');
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  return results;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/test-push-notifications.js <user-address> [scenario]');
    console.log('');
    console.log('Available scenarios:');
    Object.keys(scenarios).forEach((scenario) => {
      console.log(`  - ${scenario}`);
    });
    console.log('  - all (run all scenarios)');
    console.log('  - status (check subscription status only)');
    process.exit(1);
  }

  const address = args[0];
  const scenario = args[1] || 'basic';

  console.log(`🚀 Testing push notifications for: ${address}`);
  console.log(`📍 Using endpoint: ${BASE_URL}`);
  console.log('');

  // First check if user has subscriptions
  const statusCheck = await checkSubscriptionStatus(address);

  if (!statusCheck.success) {
    console.log('❌ Cannot check subscription status. Test aborted.');
    process.exit(1);
  }

  if (statusCheck.count === 0) {
    console.log('⚠️  No active push subscriptions found for this address.');
    console.log('   Make sure the user has subscribed to push notifications first.');
    process.exit(1);
  }

  if (scenario === 'status') {
    console.log('✅ Subscription check complete.');
    process.exit(0);
  }

  if (scenario === 'all') {
    await runAllTests(address);
  } else if (scenarios[scenario]) {
    console.log(`\n🧪 Testing scenario: ${scenario}\n`);
    const payload = scenarios[scenario](address);
    await sendTestNotification(payload);
  } else {
    console.log(`❌ Unknown scenario: ${scenario}`);
    console.log('Available scenarios:', Object.keys(scenarios).join(', '), 'all, status');
    process.exit(1);
  }

  console.log('\n✅ Test complete!');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  sendTestNotification,
  checkSubscriptionStatus,
  runAllTests,
  scenarios,
};
