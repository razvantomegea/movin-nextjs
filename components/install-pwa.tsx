'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InstallInstructionsDialog from './install-instructions-dialog';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAProps {
  variant?: 'button' | 'banner' | 'card';
  showBanner?: boolean;
  showButton?: boolean;
  showInstalledState?: boolean;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function InstallPWA({
  variant = 'button',
  showBanner = false,
  showButton = true,
  showInstalledState = false,
  onInstall,
  onDismiss,
}: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBannerState, setShowBanner] = useState(showBanner);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    // Enhanced PWA detection for better reliability
    const checkIfPWA = () => {
      // Method 1: Check display mode (most reliable for modern browsers)
      const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

      // Method 2: iOS Safari specific check
      const isIOSStandalone = (window.navigator as any).standalone === true;

      // Method 3: Check if launched from home screen (Android Chrome)
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;

      // Method 4: Check window.navigator.userAgent for 'wv' (WebView)
      const isWebView = /wv/i.test(navigator.userAgent);

      // Method 5: Check for referrer (PWAs often have empty or same-origin referrer)
      const isFromHomeScreen =
        !document.referrer || document.referrer.includes(window.location.origin);

      // Method 6: Check window size ratios (PWAs often have different ratios)
      const hasFullscreenRatio = window.outerHeight === window.innerHeight;

      // Combine all checks for better accuracy
      return (
        isDisplayModeStandalone ||
        isIOSStandalone ||
        isMinimalUI ||
        (isWebView && isFromHomeScreen) ||
        (hasFullscreenRatio && isFromHomeScreen && !window.opener)
      );
    };

    const isPWA = checkIfPWA();
    setIsStandalone(isPWA);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Add debug logging to help troubleshoot
    console.log('PWA Detection Results:', {
      displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
      iOSStandalone: (window.navigator as any).standalone === true,
      minimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
      isWebView: /wv/i.test(navigator.userAgent),
      referrer: document.referrer,
      windowRatio: window.outerHeight === window.innerHeight,
      finalResult: isPWA,
    });

    // Handle beforeinstallprompt event
    const handler = async (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show banner when install prompt is available (don't auto-trigger)
      if (!isIOS && !isPWA && variant === 'banner') {
        setShowBanner(true);
        console.log('Install prompt available, showing banner');
      } else if (isIOS && variant === 'banner') {
        // For iOS, show the banner with manual instructions
        setShowBanner(true);
        console.log('iOS detected, showing manual install banner');
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for display mode changes to reactively update PWA status
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const minimalUIQuery = window.matchMedia('(display-mode: minimal-ui)');

    const handleDisplayModeChange = () => {
      const newPWAStatus = checkIfPWA();
      setIsStandalone(newPWAStatus);
      console.log('Display mode changed, new PWA status:', newPWAStatus);
    };

    displayModeQuery.addEventListener('change', handleDisplayModeChange);
    minimalUIQuery.addEventListener('change', handleDisplayModeChange);

    // Hide banner if already installed
    if (isPWA) {
      setShowBanner(false);
    } else if (isIOS && variant === 'banner' && showBanner) {
      // Show banner immediately for iOS Safari since it doesn't fire beforeinstallprompt
      setShowBanner(true);
      console.log('iOS detected, showing install banner');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      minimalUIQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [variant, onInstall, isIOS, showBanner]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for iOS or unsupported browsers
      setShowInstructions(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
  };

  // Don't show if already installed or if we're on the server
  if ((isStandalone && !showInstalledState) || typeof window === 'undefined') {
    return null;
  }

  const InstallButton = () => (
    <Button
      onClick={handleInstall}
      className="flex items-center gap-2"
      variant={variant === 'banner' ? 'default' : 'outline'}
      disabled={isStandalone && showInstalledState}
    >
      <Download className="h-4 w-4" />
      {isStandalone && showInstalledState ? 'Installed' : 'Install App'}
    </Button>
  );

  if (variant === 'banner' && showBannerState) {
    return (
      <>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Install Movin App
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Get the best experience with our native app. Install now for faster access and
                    offline support.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Install
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="outline"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Later
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />
      </>
    );
  }

  if (variant === 'banner') {
    return <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />;
  }

  if (variant === 'card') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Install App
            </CardTitle>
            <CardDescription>Install Movin on your device for the best experience</CardDescription>
          </CardHeader>
          <CardContent>
            <InstallButton />
          </CardContent>
        </Card>
        <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />
      </>
    );
  }

  // Only show button if explicitly requested
  if (showButton) {
    return (
      <>
        <InstallButton />
        <InstallInstructionsDialog open={showInstructions} onOpenChange={setShowInstructions} />
      </>
    );
  }

  return null;
}
