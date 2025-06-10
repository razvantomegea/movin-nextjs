'use client';

import { useState, useEffect, useCallback } from 'react';

export default function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    'default',
  );
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVapidConfigured, setIsVapidConfigured] = useState<boolean>(false);

  // Check if push notifications are supported and VAPID keys are configured
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported =
        'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);

      if (supported) {
        setPermissionState(Notification.permission);

        // Check if VAPID keys are configured
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        setIsVapidConfigured(Boolean(vapidPublicKey));

        if (!vapidPublicKey) {
          console.warn('Push notifications cannot be fully enabled: Missing VAPID public key');
        }
      } else {
        setPermissionState('unsupported');
      }
    }
  }, []);

  // Get the current subscription
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Error getting push subscription:', error);
      setError('Failed to get push subscription');
      return null;
    }
  }, [isSupported]);

  // Check existing subscription on mount
  useEffect(() => {
    if (isSupported) {
      getSubscription();
    }
  }, [isSupported, getSubscription]);

  // Request permission for notifications
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setError('Failed to request notification permission');
      return 'denied';
    }
  }, [isSupported]);

  // Convert base64 string to Uint8Array for applicationServerKey
  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(
    async (userId?: string): Promise<boolean> => {
      if (!isSupported) {
        setError('Push notifications are not supported');
        return false;
      }

      if (!isVapidConfigured) {
        setError('Push notifications are not configured (missing VAPID keys)');
        return false;
      }

      setIsSubscribing(true);
      setError(null);

      try {
        // Request permission if not granted
        if (permissionState !== 'granted') {
          const permission = await requestPermission();
          if (permission !== 'granted') {
            setError('Notification permission denied');
            setIsSubscribing(false);
            return false;
          }
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let currentSubscription = await registration.pushManager.getSubscription();

        if (currentSubscription) {
          setSubscription(currentSubscription);
          setIsSubscribing(false);
          return true;
        }

        // Get VAPID public key
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!publicKey) {
          setError('VAPID public key is missing');
          setIsSubscribing(false);
          return false;
        }

        // Subscribe to push notifications
        currentSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        setSubscription(currentSubscription);

        // Send subscription to server
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: currentSubscription,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save subscription on server');
        }

        setIsSubscribing(false);
        return true;
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        setError('Failed to subscribe to push notifications');
        setIsSubscribing(false);
        return false;
      }
    },
    [isSupported, isVapidConfigured, permissionState, requestPermission, urlBase64ToUint8Array],
  );

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !subscription) {
      return false;
    }

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Send unsubscribe request to server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setError('Failed to unsubscribe from push notifications');
      return false;
    }
  }, [isSupported, subscription]);

  // Send a test notification (for testing purposes)
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !subscription) {
      return false;
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification from Movin',
          tag: 'test',
          url: '/dashboard',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Failed to send test notification');
      return false;
    }
  }, [isSupported, subscription]);

  return {
    isSupported,
    permissionState,
    subscription,
    isSubscribing,
    error,
    isVapidConfigured,
    subscribe,
    unsubscribe,
    getSubscription,
    requestPermission,
    sendTestNotification,
  };
}
