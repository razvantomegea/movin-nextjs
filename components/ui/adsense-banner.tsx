'use client';

import { useEffect, useRef, useState } from 'react';

interface AdSenseBannerProps {
  className?: string;
  slot?: string;
  format?: 'auto' | 'rectangle' | 'banner' | 'leaderboard' | 'mobile-banner';
  responsive?: boolean;
  style?: React.CSSProperties;
}

const formatStyles = {
  auto: { width: '100%', height: 'auto' },
  rectangle: { width: '300px', height: '250px' },
  banner: { width: '728px', height: '90px' },
  leaderboard: { width: '728px', height: '90px' },
  'mobile-banner': { width: '320px', height: '50px' },
};

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

export function AdSenseBanner({
  className = '',
  slot,
  format = 'auto',
  responsive = true,
  style,
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

  // Ad block detection
  useEffect(() => {
    const detectAdBlock = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);

      setTimeout(() => {
        if (testAd.offsetHeight === 0) {
          setAdBlockDetected(true);
        }
        document.body.removeChild(testAd);
      }, 100);
    };

    detectAdBlock();
  }, []);

  useEffect(() => {
    if (!clientId || !slotId || adBlockDetected) {
      if (!clientId || !slotId) {
        console.warn('AdSense client ID or slot ID not provided');
      }
      setHasError(true);
      return;
    }

    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      try {
        // Initialize adsbygoogle if not already present
        window.adsbygoogle = window.adsbygoogle || [];

        // Push the ad configuration
        window.adsbygoogle.push({});

        setIsLoaded(true);
      } catch (err) {
        console.error('AdSense error:', err);
        setHasError(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [clientId, slotId, adBlockDetected]);

  // Don't render if no credentials or ad block detected
  if (!clientId || !slotId || hasError || adBlockDetected) {
    // Show placeholder in development mode
    if (process.env.NODE_ENV === 'development' && !adBlockDetected) {
      return (
        <div
          className={`${className} p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600`}
        >
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {!clientId || !slotId ? 'AdSense configuration missing' : 'AdSense Banner'}
            <br />
            <span className="text-xs">
              {!clientId && 'NEXT_PUBLIC_ADSENSE_CLIENT_ID '}
              {!slotId && 'NEXT_PUBLIC_ADSENSE_SLOT_ID '}
              {hasError && 'Loading error'}
            </span>
          </div>
        </div>
      );
    }

    // In production, don't show anything if ads are blocked or missing config
    return null;
  }

  const adStyle = {
    ...formatStyles[format],
    ...style,
  };

  return (
    <div className={`adsense-banner ${className}`} ref={adRef}>
      {!isLoaded && (
        <div
          className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center"
          style={{ ...adStyle, minHeight: '90px' }}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading ad...</div>
        </div>
      )}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...adStyle }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Predefined banner components for common use cases
export function HeaderBanner(props: Omit<AdSenseBannerProps, 'format'>) {
  return (
    <AdSenseBanner
      {...props}
      format="banner"
      className={`w-full max-w-4xl mx-auto ${props.className || ''}`}
    />
  );
}

export function SidebarBanner(props: Omit<AdSenseBannerProps, 'format'>) {
  return (
    <AdSenseBanner
      {...props}
      format="rectangle"
      className={`w-full max-w-xs ${props.className || ''}`}
    />
  );
}

export function MobileBanner(props: Omit<AdSenseBannerProps, 'format'>) {
  return (
    <AdSenseBanner
      {...props}
      format="mobile-banner"
      className={`w-full max-w-xs mx-auto ${props.className || ''}`}
    />
  );
}
