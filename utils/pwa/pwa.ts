/**
 * PWA Installation Utilities
 * Handles PWA installation detection and prompting
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallationSupport {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  hasInstallPrompt: boolean;
  browserSupported: boolean;
}

export interface PWAInstallationResult {
  success: boolean;
  outcome?: 'accepted' | 'dismissed';
  error?: string;
}

// Global state for install prompt
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Check PWA installation status and capabilities
 */
export function checkPWASupport(): PWAInstallationSupport {
  if (typeof window === 'undefined') {
    return {
      canInstall: false,
      isInstalled: false,
      isIOS: false,
      isStandalone: false,
      hasInstallPrompt: false,
      browserSupported: false,
    };
  }

  // Method 1: Check display mode (most reliable for modern browsers)
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Method 2: iOS Safari specific check
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Method 3: Check if launched from home screen (Android Chrome)
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

  const isStandalone = isDisplayModeStandalone || isIOSStandalone || isMinimalUI;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Check browser support
  const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
  const isEdge = navigator.userAgent.includes('Edg');
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const browserSupported = isChrome || isEdge || isSafari;

  return {
    canInstall: !isStandalone && browserSupported,
    isInstalled: isStandalone,
    isIOS,
    isStandalone,
    hasInstallPrompt: !!deferredInstallPrompt,
    browserSupported,
  };
}

/**
 * Set up PWA install prompt listener
 */
export function setupInstallPromptListener(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    console.log('[PWA Utils] beforeinstallprompt event fired');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Store the event so it can be triggered later
    deferredInstallPrompt = e as BeforeInstallPromptEvent;

    // Log available platforms
    if (deferredInstallPrompt.platforms) {
      console.log('[PWA Utils] Available platforms:', deferredInstallPrompt.platforms);
    }
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}

/**
 * Trigger PWA installation
 */
export async function installPWA(): Promise<PWAInstallationResult> {
  const support = checkPWASupport();

  if (support.isInstalled) {
    return {
      success: false,
      error: 'PWA is already installed',
    };
  }

  if (!support.browserSupported) {
    return {
      success: false,
      error: 'PWA installation not supported in this browser',
    };
  }

  if (support.isIOS) {
    // iOS doesn't support programmatic installation
    return {
      success: false,
      error: 'iOS requires manual installation via Safari share menu',
    };
  }

  if (!deferredInstallPrompt) {
    return {
      success: false,
      error: 'No install prompt available. Try refreshing the page.',
    };
  }

  try {
    // Show the install prompt
    await deferredInstallPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredInstallPrompt.userChoice;

    // Reset the deferred prompt variable
    deferredInstallPrompt = null;

    console.log('[PWA Utils] User choice:', choiceResult.outcome);

    return {
      success: choiceResult.outcome === 'accepted',
      outcome: choiceResult.outcome,
    };
  } catch (error) {
    console.error('[PWA Utils] Installation failed:', error);

    // Reset the deferred prompt on error
    deferredInstallPrompt = null;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Installation failed',
    };
  }
}

/**
 * Check if PWA installation prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return !!deferredInstallPrompt;
}

/**
 * Get installation instructions for different platforms
 */
export function getInstallationInstructions(): { platform: string; steps: string[] } {
  const support = checkPWASupport();

  if (support.isIOS) {
    return {
      platform: 'iOS Safari',
      steps: [
        'Tap the Share button at the bottom of the screen',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top-right corner',
        'The app will be added to your home screen',
      ],
    };
  }

  const isChrome = navigator.userAgent.includes('Chrome');
  const isEdge = navigator.userAgent.includes('Edg');

  if (isChrome) {
    return {
      platform: 'Chrome',
      steps: [
        'Click the menu button (three dots) in the top-right corner',
        'Select "Install Movin..." or "Add to Home screen"',
        'Click "Install" in the popup dialog',
        'The app will be installed and added to your device',
      ],
    };
  }

  if (isEdge) {
    return {
      platform: 'Microsoft Edge',
      steps: [
        'Click the menu button (three dots) in the top-right corner',
        'Select "Apps" > "Install this site as an app"',
        'Click "Install" in the popup dialog',
        'The app will be installed and added to your device',
      ],
    };
  }

  return {
    platform: 'Your Browser',
    steps: [
      "Look for an install button in your browser's address bar",
      "Or check your browser's menu for an install option",
      'Follow the prompts to install the app',
    ],
  };
}

/**
 * Listen for PWA installation events
 */
export function onPWAInstalled(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleAppInstalled = () => {
    console.log('[PWA Utils] PWA was installed');
    callback();
  };

  window.addEventListener('appinstalled', handleAppInstalled);

  return () => {
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

/**
 * Reset PWA install prompt state (useful for testing)
 */
export function resetInstallPrompt(): void {
  deferredInstallPrompt = null;
  console.log('[PWA Utils] Install prompt state reset');
}
