/**
 * Service Worker Management Utilities
 * Handles registration, updates, and status checking
 */

// Global state to prevent multiple registrations
let globalServiceWorkerReady = false;
let globalRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export interface ServiceWorkerConfig {
  scope?: string;
  updateViaCache?: ServiceWorkerUpdateViaCache;
}

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  active: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Register service worker with environment-based selection
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {},
): Promise<ServiceWorkerRegistration> {
  // Return existing promise if registration is in progress
  if (globalRegistrationPromise) {
    console.log('[SW Utils] Registration already in progress, returning existing promise');
    return globalRegistrationPromise;
  }

  // Return ready registration if already complete
  if (globalServiceWorkerReady) {
    console.log('[SW Utils] Service worker already registered, returning ready registration');
    return navigator.serviceWorker.ready;
  }

  // Check browser support
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers not supported in this browser');
  }

  console.log('[SW Utils] Starting service worker registration...');

  globalRegistrationPromise = (async () => {
    try {
      // Use different service workers for development and production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const swPath = isDevelopment ? '/sw-dev.js' : '/sw.js';

      console.log(
        `[SW Utils] Registering ${isDevelopment ? 'development' : 'production'} service worker:`,
        swPath,
      );

      const registration = await navigator.serviceWorker.register(swPath, {
        scope: config.scope || '/',
        updateViaCache: config.updateViaCache || 'none',
      });

      console.log('[SW Utils] Service worker registered successfully:', registration);

      // Wait for the registration to be ready
      await navigator.serviceWorker.ready;
      console.log('[SW Utils] Service worker is ready');

      globalServiceWorkerReady = true;
      return registration;
    } catch (error) {
      console.error('[SW Utils] Service worker registration failed:', error);
      globalRegistrationPromise = null; // Reset on error so it can be retried
      throw error;
    }
  })();

  return globalRegistrationPromise;
}

/**
 * Get current service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const status: ServiceWorkerStatus = {
    supported: 'serviceWorker' in navigator,
    registered: false,
    active: false,
    registration: null,
  };

  if (!status.supported) {
    return status;
  }

  try {
    if (globalServiceWorkerReady) {
      const registration = await navigator.serviceWorker.ready;
      status.registration = registration;
      status.registered = true;
      status.active = !!registration.active;
    } else {
      // Check if there's any registration
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        status.registration = registrations[0];
        status.registered = true;
        status.active = !!registrations[0].active;
      }
    }
  } catch (error) {
    console.error('[SW Utils] Error getting service worker status:', error);
  }

  return status;
}

/**
 * Unregister all service workers
 */
export async function unregisterAllServiceWorkers(): Promise<number> {
  if (!('serviceWorker' in navigator)) {
    return 0;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    let unregisteredCount = 0;

    for (const registration of registrations) {
      try {
        const success = await registration.unregister();
        if (success) {
          unregisteredCount++;
          console.log('[SW Utils] Unregistered service worker:', registration.scope);
        }
      } catch (error) {
        console.warn('[SW Utils] Failed to unregister service worker:', registration.scope, error);
      }
    }

    // Reset global state
    globalServiceWorkerReady = false;
    globalRegistrationPromise = null;

    console.log(`[SW Utils] Unregistered ${unregisteredCount} service workers`);
    return unregisteredCount;
  } catch (error) {
    console.error('[SW Utils] Error unregistering service workers:', error);
    return 0;
  }
}

/**
 * Update service worker if a new version is available
 */
export async function updateServiceWorker(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;

    if (registration.waiting) {
      // There's a waiting service worker, activate it
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }

    // Check for updates
    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error('[SW Utils] Error updating service worker:', error);
    return false;
  }
}

/**
 * Listen for service worker updates
 */
export function onServiceWorkerUpdate(
  callback: (registration: ServiceWorkerRegistration) => void,
): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleUpdate = (event: Event) => {
    if (navigator.serviceWorker.controller && event.target) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration && registration.waiting) {
          callback(registration);
        }
      });
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleUpdate);

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate);
  };
}

/**
 * Check if PWA is installed (running in standalone mode)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Method 1: Check display mode (most reliable for modern browsers)
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Method 2: iOS Safari specific check
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Method 3: Check if launched from home screen (Android Chrome)
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

  return isDisplayModeStandalone || isIOSStandalone || isMinimalUI;
}

/**
 * Reset service worker state (useful for debugging)
 */
export function resetServiceWorkerState(): void {
  globalServiceWorkerReady = false;
  globalRegistrationPromise = null;
  console.log('[SW Utils] Service worker state reset');
}
