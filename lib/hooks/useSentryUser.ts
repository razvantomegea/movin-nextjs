'use client';

import { useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAppSelector } from '@/lib/redux/hooks';
import { setSentryUser, clearSentryUser, addUserActionBreadcrumb } from '@/lib/sentry';

/**
 * Hook to automatically manage Sentry user context based on wallet connection
 * and user profile data
 */
export function useSentryUser() {
  const { address, isConnected } = useAppKitAccount();
  const profile = useAppSelector((state) => state.profile.profile);

  useEffect(() => {
    if (isConnected && address) {
      // Set user context when wallet is connected
      setSentryUser({
        id: address.toLowerCase(),
        address: address.toLowerCase(),
        username: profile?.username,
        email: profile?.email,
        isPremium: profile?.is_premium,
      });

      addUserActionBreadcrumb('Wallet connected', 'navigation', {
        address: address.toLowerCase(),
        hasProfile: !!profile,
      });
    } else {
      // Clear user context when wallet is disconnected
      clearSentryUser();

      if (!isConnected) {
        addUserActionBreadcrumb('Wallet disconnected', 'navigation');
      }
    }

    return () => {
      // Cleanup on unmount
      clearSentryUser();
    };
  }, [isConnected, address, profile]);

  // Return current user state for debugging purposes
  return {
    isTracked: isConnected && !!address,
    address: address?.toLowerCase(),
    hasProfile: !!profile,
  };
}
