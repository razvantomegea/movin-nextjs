/**
 * Push Notification Management Utilities
 * Handles subscription, permissions, and notifications
 */

import { registerServiceWorker } from './serviceWorker';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationSupport {
  supported: boolean;
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  notificationSupported: boolean;
  vapidConfigured: boolean;
}

export interface PushSubscriptionResult {
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}

/**
 * Check if push notifications are supported and properly configured
 */
export function checkPushNotificationSupport(): PushNotificationSupport {
  const serviceWorkerSupported = 'serviceWorker' in navigator;
  const pushManagerSupported = 'PushManager' in window;
  const notificationSupported = 'Notification' in window;
  const vapidConfigured = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

  return {
    supported:
      serviceWorkerSupported && pushManagerSupported && notificationSupported && vapidConfigured,
    serviceWorkerSupported,
    pushManagerSupported,
    notificationSupported,
    vapidConfigured,
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  return Notification.requestPermission();
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String?.trim()) {
    throw new Error('Invalid VAPID public key');
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionResult> {
  try {
    // Check support
    const support = checkPushNotificationSupport();
    if (!support.supported) {
      const issues = [];
      if (!support.serviceWorkerSupported) issues.push('Service Workers not supported');
      if (!support.pushManagerSupported) issues.push('Push Manager not supported');
      if (!support.notificationSupported) issues.push('Notifications not supported');
      if (!support.vapidConfigured) issues.push('VAPID keys not configured');

      return {
        success: false,
        error: `Push notifications not supported: ${issues.join(', ')}`,
      };
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Notification permission denied. Please enable notifications in browser settings.'
            : 'Notification permission required',
      };
    }

    // Get service worker registration
    const registration = await registerServiceWorker();

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return {
        success: true,
        subscription: existingSubscription,
      };
    }

    // Create new subscription
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    console.error('[Push Utils] Subscription failed:', error);

    let errorMessage = 'Failed to subscribe to notifications';
    if (error instanceof Error) {
      if (error.message.includes('VAPID') || error.message.includes('Invalid')) {
        errorMessage = 'Push notifications are not properly configured';
      } else if (error.message.includes('not supported')) {
        errorMessage = 'Push notifications are not supported on this device';
      } else if (error.message.includes('aborted') || error.message.includes('Service Worker')) {
        errorMessage = 'Service worker not ready. Please try again in a moment';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('[Push Utils] Unsubscribed from push notifications:', success);
      return success;
    }

    return true; // No subscription to unsubscribe from
  } catch (error) {
    console.error('[Push Utils] Unsubscription failed:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!checkPushNotificationSupport().supported) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push Utils] Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Save push subscription to server
 */
export async function savePushSubscription(
  subscription: PushSubscription,
  address: string,
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        address: address.toLowerCase(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Push Utils] Failed to save subscription:', error);
      return false;
    }

    console.log('[Push Utils] Subscription saved successfully');
    return true;
  } catch (error) {
    console.error('[Push Utils] Error saving subscription:', error);
    return false;
  }
}

/**
 * Remove push subscription from server
 */
export async function removePushSubscription(endpoint: string, address?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        address: address?.toLowerCase(),
      }),
    });

    if (!response.ok) {
      console.warn('[Push Utils] Failed to remove subscription from server');
      return false;
    }

    console.log('[Push Utils] Subscription removed from server');
    return true;
  } catch (error) {
    console.error('[Push Utils] Error removing subscription:', error);
    return false;
  }
}

/**
 * Complete push notification setup (subscribe + save to server)
 */
export async function setupPushNotifications(address: string): Promise<PushSubscriptionResult> {
  const result = await subscribeToPushNotifications();

  if (result.success && result.subscription) {
    const saved = await savePushSubscription(result.subscription, address);
    if (!saved) {
      // Subscription created but not saved to server
      console.warn('[Push Utils] Subscription created but not saved to server');
    }
  }

  return result;
}

/**
 * Complete push notification teardown (unsubscribe + remove from server)
 */
export async function teardownPushNotifications(address?: string): Promise<boolean> {
  try {
    // Get current subscription before unsubscribing
    const subscription = await getCurrentPushSubscription();
    const endpoint = subscription?.endpoint;

    // Unsubscribe locally
    const unsubscribed = await unsubscribeFromPushNotifications();

    // Remove from server if we have the endpoint
    if (endpoint) {
      await removePushSubscription(endpoint, address);
    }

    return unsubscribed;
  } catch (error) {
    console.error('[Push Utils] Error in teardown:', error);
    return false;
  }
}
