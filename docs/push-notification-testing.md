# Push Notification Testing Guide

This guide explains how to test push subscriptions and FCM integration in your Movin app.

## Prerequisites

### 1. Environment Setup

Ensure these environment variables are configured:

```bash
# Required VAPID keys for web push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com

# App URL for testing
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. User Requirements

Before testing, ensure:

- User has a valid wallet address
- User has subscribed to push notifications in the app
- Service worker is registered and active

## Testing Methods

### Method 1: Command Line Script

Use the provided script for quick testing from terminal:

```bash
# Basic test
node scripts/test-push-notifications.js 0x1234567890123456789012345678901234567890

# Test specific scenario
node scripts/test-push-notifications.js 0x1234567890123456789012345678901234567890 reward

# Test all scenarios
node scripts/test-push-notifications.js 0x1234567890123456789012345678901234567890 all

# Check subscription status only
node scripts/test-push-notifications.js 0x1234567890123456789012345678901234567890 status
```

#### Available Test Scenarios

- **basic**: Simple notification test
- **rich**: Notification with custom icon, badge, and data
- **activity**: Activity reminder notification
- **reward**: Reward earned notification
- **system**: System update notification
- **all**: Run all scenarios sequentially
- **status**: Check subscription status only

### Method 2: Browser Console Testing

In development, test utilities are available in the browser console:

```javascript
// Check if user has subscriptions
await window.pushTestHelpers.checkStatus('0x1234567890123456789012345678901234567890');

// Send basic test notification
await window.pushTestHelpers.testBasic('0x1234567890123456789012345678901234567890');

// Run all test scenarios
await window.pushTestHelpers.testAll('0x1234567890123456789012345678901234567890');
```

### Method 3: Direct API Testing

#### Check Subscriptions

```bash
curl -X GET "http://localhost:3000/api/push/subscriptions?address=0x1234567890123456789012345678901234567890"
```

#### Send Test Notification

```bash
curl -X POST "http://localhost:3000/api/push/send" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "title": "Test Notification",
    "body": "This is a test from curl!",
    "tag": "test-curl"
  }'
```

### Method 4: Import and Use Utilities

In your TypeScript/JavaScript code:

```typescript
import { sendTestNotification, checkSubscriptionStatus, testScenarios } from '@/utils';

// Check subscription status
const status = await checkSubscriptionStatus('0x123...');
console.log(`User has ${status.subscriptionCount} active subscriptions`);

// Send a test notification
const result = await sendTestNotification({
  address: '0x123...',
  title: 'Custom Test',
  body: 'Testing from code',
});

// Use predefined scenarios
const payload = testScenarios.reward('0x123...');
const result = await sendTestNotification(payload);
```

## API Response Examples

### Successful Response

```json
{
  "success": true,
  "message": "Notification sent to 2/2 subscriptions",
  "results": [
    {
      "success": true,
      "endpoint": "https://fcm.googleapis.com/fcm/send/..."
    },
    {
      "success": true,
      "endpoint": "https://fcm.googleapis.com/fcm/send/..."
    }
  ]
}
```

### Error Response

```json
{
  "error": "No active push subscriptions found for this user"
}
```

## Troubleshooting

### Common Issues

#### 1. No Subscriptions Found

**Error**: `No active push subscriptions found for this user`

**Solutions**:

- Verify the user has subscribed to notifications in the app
- Check if subscription was properly saved to database
- Ensure address is correctly formatted (lowercase)

#### 2. VAPID Keys Not Configured

**Error**: `VAPID keys not configured`

**Solutions**:

- Verify environment variables are set correctly
- Restart your development server after adding env vars
- Check `.env.local` file exists and is properly formatted

#### 3. Service Worker Issues

**Error**: Push notifications not received despite successful API response

**Solutions**:

- Check if service worker is registered: `navigator.serviceWorker.ready`
- Verify notification permissions: `Notification.permission`
- Check browser console for service worker errors
- Test in different browsers (some browsers block notifications in dev mode)

#### 4. Network/Endpoint Issues

**Error**: Failed to send notification or network timeouts

**Solutions**:

- Check FCM service status
- Verify internet connectivity
- Test with curl to isolate the issue
- Check server logs for detailed error messages

### Debug Tools

#### Check Service Worker Status

```javascript
// In browser console
await navigator.serviceWorker.ready;
console.log('Service Worker State:', (await navigator.serviceWorker.ready).active?.state);

// Check notification permission
console.log('Notification Permission:', Notification.permission);

// Get current registration
const registrations = await navigator.serviceWorker.getRegistrations();
console.log('SW Registrations:', registrations.length);
```

#### Verify Push Subscription

```javascript
// Get current push subscription
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.getSubscription();
console.log('Current subscription:', subscription);
```

## Production Testing

### Testing in Production

1. **Use production environment variables**
2. **Test with real user addresses**
3. **Verify FCM quotas and limits**
4. **Monitor error rates and delivery success**

### Monitoring

- Check server logs for push notification errors
- Monitor FCM console for delivery metrics
- Track user subscription rates
- Set up alerts for high error rates

## Best Practices

### Development

1. **Always check subscription status before sending**
2. **Handle expired subscriptions gracefully**
3. **Use appropriate delay between test notifications**
4. **Test across different browsers and devices**
5. **Verify notification permissions before subscribing**

### Production

1. **Implement retry logic for failed sends**
2. **Clean up expired subscriptions regularly**
3. **Respect user notification preferences**
4. **Follow rate limiting guidelines**
5. **Monitor and log all push notification activities**

## Rate Limiting

Be mindful of rate limits when testing:

- **FCM**: 1 million messages per minute per project
- **Browser**: Varies by browser and user interaction
- **Your API**: Implement your own rate limiting as needed

Add delays between test notifications to avoid being rate limited:

```javascript
// Add 1 second delay between notifications
await new Promise((resolve) => setTimeout(resolve, 1000));
```

## Security Considerations

1. **Never expose VAPID private keys**
2. **Validate user addresses server-side**
3. **Sanitize notification content**
4. **Implement proper authentication for send endpoints**
5. **Monitor for abuse and implement rate limiting**
