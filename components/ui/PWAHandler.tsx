'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Workbox, messageSW } from 'workbox-window';

// Extend Window interface to include workbox
declare global {
  interface Window {
    workbox: any;
  }
}

// Extend ServiceWorkerRegistration to include sync property
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register: (tag: string) => Promise<void>;
    };
  }
}

let wb: Workbox | null = null;
let registration: ServiceWorkerRegistration | null = null;

export default function PWAHandler() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register the service worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.workbox !== undefined || process.env.NODE_ENV === 'production')
    ) {
      // Initialize workbox
      wb = new Workbox('/sw.js');

      // Add event listeners
      wb.addEventListener('installed', (event) => {
        console.log('Service Worker installed:', event);
      });

      wb.addEventListener('waiting', () => {
        // New service worker is waiting to activate
        setIsUpdateAvailable(true);
        toast.info('A new version is available!', {
          action: {
            label: 'Update',
            onClick: () => updateServiceWorker(),
          },
          duration: 10000,
        });
      });

      // Register the service worker after event listeners have been added
      wb.register()
        .then((r) => {
          registration = r || null;
          console.log('Service Worker registered successfully');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Background sync setup
      setupBackgroundSync();

      // Only setup push notifications if VAPID public key is available
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidPublicKey) {
        setupPushNotifications();
      } else {
        console.warn('Push notifications disabled: Missing VAPID public key');
      }
    }

    // Add beforeinstallprompt event listener for "Add to Home Screen" prompt
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // Handle installation prompt
  const handleInstallPrompt = (e: Event) => {
    // Prevent the default behavior
    e.preventDefault();
    // Store the event for later use
    setInstallPrompt(e);
    // Show a toast notification for installation
    toast.info('Install Movin for a better experience!', {
      action: {
        label: 'Install',
        onClick: showInstallPrompt,
      },
      duration: 10000,
    });
  };

  // Show the installation prompt
  const showInstallPrompt = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the saved prompt
    setInstallPrompt(null);
  };

  // Update the service worker
  const updateServiceWorker = () => {
    if (!wb) return;

    wb.addEventListener('controlling', () => {
      // The service worker is now controlling the page
      window.location.reload();
    });

    // Send a message to the service worker to skip waiting
    if (registration && registration.waiting) {
      messageSW(registration.waiting, { type: 'SKIP_WAITING' });
    }
  };

  // Setup background sync
  const setupBackgroundSync = async () => {
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is available before trying to register
        if (registration && 'sync' in registration) {
          await registration.sync.register('sync-data');
          console.log('Background sync registered');
        }
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  };

  // Setup push notifications
  const setupPushNotifications = async () => {
    try {
      // Check if push notifications are supported
      if ('Notification' in window && 'PushManager' in window) {
        // Don't automatically request permission here - let the user control it
        console.log('Push notifications are supported and ready to be configured');
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  // Convert base64 string to Uint8Array for applicationServerKey
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  // This component doesn't render anything visible
  return null;
}
