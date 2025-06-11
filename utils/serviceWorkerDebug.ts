/**
 * Service Worker Debug Utilities
 * Helps diagnose service worker registration and push notification issues
 */

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  active: boolean;
  registrations: ServiceWorkerRegistration[];
  pushSupported: boolean;
  notificationPermission: NotificationPermission;
}

/**
 * Get comprehensive service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const status: ServiceWorkerStatus = {
    supported: 'serviceWorker' in navigator,
    registered: false,
    active: false,
    registrations: [],
    pushSupported: false,
    notificationPermission: 'default',
  };

  if (!status.supported) {
    return status;
  }

  try {
    // Get all registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    status.registrations = registrations;
    status.registered = registrations.length > 0;
    status.active = registrations.some((reg) => reg.active);

    // Check push support
    status.pushSupported =
      'PushManager' in window &&
      'Notification' in window &&
      'showNotification' in ServiceWorkerRegistration.prototype;

    // Get notification permission
    status.notificationPermission = Notification.permission;
  } catch (error) {
    console.error('Error getting service worker status:', error);
  }

  return status;
}

/**
 * Debug service worker registrations
 */
export async function debugServiceWorker(): Promise<void> {
  const status = await getServiceWorkerStatus();

  console.group('🔧 Service Worker Debug Info');
  console.log('Supported:', status.supported);
  console.log('Registered:', status.registered);
  console.log('Active:', status.active);
  console.log('Push Supported:', status.pushSupported);
  console.log('Notification Permission:', status.notificationPermission);

  if (status.registrations.length > 0) {
    console.group('📋 Registrations');
    status.registrations.forEach((reg, index) => {
      console.log(`Registration ${index + 1}:`);
      console.log('  Scope:', reg.scope);
      console.log('  Installing:', !!reg.installing);
      console.log('  Waiting:', !!reg.waiting);
      console.log('  Active:', !!reg.active);
      if (reg.active) {
        console.log('  Script URL:', reg.active.scriptURL);
        console.log('  State:', reg.active.state);
      }
    });
    console.groupEnd();
  }

  // Check for multiple registrations (potential issue)
  if (status.registrations.length > 1) {
    console.warn('⚠️ Multiple service worker registrations detected! This may cause conflicts.');
  }

  console.groupEnd();
}

/**
 * Clean up duplicate service worker registrations
 */
export async function cleanupServiceWorkers(): Promise<number> {
  if (!('serviceWorker' in navigator)) {
    return 0;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    if (registrations.length <= 1) {
      return 0;
    }

    console.log(`Found ${registrations.length} service worker registrations, cleaning up...`);

    // Keep the most recent registration, unregister the rest
    const sortedRegistrations = registrations.sort((a, b) => {
      // Sort by scope length (more specific scopes first)
      return b.scope.length - a.scope.length;
    });

    const keepRegistration = sortedRegistrations[0];
    const toUnregister = sortedRegistrations.slice(1);

    let unregisteredCount = 0;
    for (const reg of toUnregister) {
      try {
        const success = await reg.unregister();
        if (success) {
          unregisteredCount++;
          console.log('Unregistered service worker:', reg.scope);
        }
      } catch (error) {
        console.warn('Failed to unregister service worker:', reg.scope, error);
      }
    }

    console.log(`Kept registration: ${keepRegistration.scope}`);
    console.log(`Cleaned up ${unregisteredCount} duplicate registrations`);

    return unregisteredCount;
  } catch (error) {
    console.error('Error cleaning up service workers:', error);
    return 0;
  }
}

/**
 * Check if push notifications are properly configured
 */
export async function checkPushConfiguration(): Promise<{
  configured: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check service worker support
  if (!('serviceWorker' in navigator)) {
    issues.push('Service Workers not supported');
  }

  // Check push manager support
  if (!('PushManager' in window)) {
    issues.push('Push Manager not supported');
  }

  // Check notification support
  if (!('Notification' in window)) {
    issues.push('Notifications not supported');
  }

  // Check VAPID key
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey?.trim()) {
    issues.push('VAPID public key not configured');
  }

  // Check permission
  if (Notification.permission === 'denied') {
    issues.push('Notification permission denied');
  }

  // Check service worker registration
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      issues.push('No service worker registered');
    } else if (registrations.length > 1) {
      issues.push('Multiple service workers registered (potential conflict)');
    }
  } catch (error) {
    issues.push('Cannot access service worker registrations');
  }

  return {
    configured: issues.length === 0,
    issues,
  };
}
