'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  checkPWASupport,
  setupInstallPromptListener,
  installPWA,
  onPWAInstalled,
  type PWAInstallationSupport,
} from '@/utils/pwa/pwa';
import { registerServiceWorker } from '@/utils/pwa/serviceWorker';
import InstallInstructionsDialog from './install-instructions-dialog';

interface InstallPWAProps {
  variant?: 'button' | 'banner' | 'card';
  showBanner?: boolean;
  showButton?: boolean;
  showInstalledState?: boolean;
  onInstall?: () => void;
  onDismiss?: () => void;
  forceShow?: boolean;
}

export default function InstallPWA({
  variant = 'button',
  showBanner = false,
  showButton = true,
  showInstalledState = false,
  onInstall,
  onDismiss,
  forceShow = false,
}: InstallPWAProps) {
  const [pwaSupport, setPwaSupport] = useState<PWAInstallationSupport>({
    canInstall: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    hasInstallPrompt: false,
    browserSupported: false,
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [showBannerState, setShowBanner] = useState(showBanner);

  useEffect(() => {
    // Initialize service worker
    const initServiceWorker = async () => {
      try {
        await registerServiceWorker();
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    };

    initServiceWorker();

    // Set up PWA install prompt listener
    const cleanupPromptListener = setupInstallPromptListener();

    // Set up PWA installation listener
    const cleanupInstallListener = onPWAInstalled(() => {
      console.log('PWA was installed, updating state');
      setPwaSupport(checkPWASupport());
      setShowBanner(false);
      onInstall?.();
    });

    // Check PWA support initially
    setPwaSupport(checkPWASupport());

    // Set up periodic checks for PWA support changes
    const interval = setInterval(() => {
      setPwaSupport(checkPWASupport());
    }, 1000);

    // Show banner logic
    if (variant === 'banner') {
      const support = checkPWASupport();
      if (!support.isInstalled || forceShow) {
        if (support.isIOS) {
          // Show banner immediately for iOS
          setShowBanner(true);
        } else {
          // For other browsers, wait a bit for the beforeinstallprompt event
          setTimeout(() => {
            const currentSupport = checkPWASupport();
            if (!currentSupport.isInstalled || forceShow) {
              setShowBanner(true);
            }
          }, 2000);
        }
      }
    }

    return () => {
      cleanupPromptListener();
      cleanupInstallListener();
      clearInterval(interval);
    };
  }, [variant, onInstall, showBanner, forceShow]);

  const handleInstall = async () => {
    try {
      const result = await installPWA();

      if (result.success) {
        setShowBanner(false);
        onInstall?.();
      } else {
        // Show manual instructions if automatic installation fails
        setShowInstructions(true);
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

  // Don't show if already installed (unless forced or showing installed state)
  if (
    (pwaSupport.isInstalled && !showInstalledState && !forceShow) ||
    typeof window === 'undefined'
  ) {
    return null;
  }

  const InstallButton = () => (
    <Button
      onClick={handleInstall}
      className="flex items-center gap-2"
      variant={variant === 'banner' ? 'default' : 'outline'}
      disabled={pwaSupport.isInstalled && showInstalledState}
    >
      <Download className="h-4 w-4" />
      {pwaSupport.isInstalled && showInstalledState ? 'Installed' : 'Install App'}
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
            className="fixed z-50 max-w-md mx-auto safe-top safe-left safe-right"
            style={{
              top: 'max(env(safe-area-inset-top), 1rem)',
              left: 'max(env(safe-area-inset-left), 1rem)',
              right: 'max(env(safe-area-inset-right), 1rem)',
            }}
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
