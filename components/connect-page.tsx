'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import * as Sentry from '@sentry/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { CelebrationAnimation } from '@/components/celebration-animation';
import InstallPWA from '@/components/install-pwa';
import { Button } from '@/components/ui/button';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { updateProfile } from '@/lib/supabase/profile';
import { getProfile } from '@/lib/supabase/profile';

function ConnectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const [referrer, setReferrer] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(isConnected);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { useRegisterReferral, useReferralInfo } = useMovinEarn();
  const { registerReferral } = useRegisterReferral();

  // Get referral info to check if user already has a referrer
  const { formattedReferralInfo, isLoading: referralInfoLoading } = useReferralInfo();
  const referralInfo = useMemo(() => formattedReferralInfo(), [formattedReferralInfo]);

  // Validate Ethereum address
  const isValidAddress = useCallback((address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, []);

  // Check for referral in URL
  useEffect(() => {
    const referralParam = searchParams.get('referral');
    if (referralParam && isValidAddress(referralParam)) {
      setShowReferralModal(true);
      setReferrer(referralParam);
    }
  }, [searchParams, isValidAddress]);

  const handleConnect = useCallback(async () => {
    try {
      open();
      setAuthError(null);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setAuthError('Failed to open wallet connection. Please try again.');
    }
  }, [open]);

  const handleDismissReferral = useCallback(() => {
    setShowReferralModal(false);
  }, []);

  useEffect(() => {
    const authenticateWithSupabase = async () => {
      if (isConnected && addressLower && !connecting) {
        try {
          // Call the API to generate JWT and authenticate with Supabase
          setConnecting(true);
          const response = await fetch('/api/auth/wallet-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address: addressLower }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Authentication failed');
          }

          // Get the JWT token from the response
          const { token } = await response.json();

          // Store the token in localStorage for future API calls
          localStorage.setItem('auth_token', token);

          // Check if a profile exists for this address
          try {
            const profile = await getProfile({ address: addressLower });

            // If no profile exists, create one with address as username
            if (!profile) {
              await updateProfile({
                address: addressLower,
                profileData: {
                  username: addressLower,
                  email: '',
                  avatar_url: '',
                  level: 1,
                  streak_days: 0,
                  address: addressLower,
                },
              });
            }

            // Check if user already has a referrer before registering new referral
            if (referrer && isValidAddress(referrer) && referrer.toLowerCase() !== addressLower) {
              // Only register referral if user doesn't already have a referrer
              const hasExistingReferrer =
                referralInfo?.referrer &&
                referralInfo.referrer !== '0x0000000000000000000000000000000000000000';

              if (!hasExistingReferrer && !referralInfoLoading) {
                try {
                  await registerReferral(referrer);
                  setShowCelebration(true);
                } catch (referralError) {
                  console.error('Failed to register referral:', referralError);
                  Sentry.captureException(referralError);
                }
              } else if (hasExistingReferrer) {
                console.log('User already has a referrer, skipping referral registration');
              }
            }
          } catch (profileError) {
            console.error('Profile setup error:', profileError);
            Sentry.captureException(profileError);
          }

          // Navigate to dashboard on successful authentication
          const navigateTimeout = setTimeout(() => {
            router.push('/dashboard');
          }, 3000);

          return () => clearTimeout(navigateTimeout);
        } catch (error) {
          console.error('Authentication error:', error);
          setAuthError((error as Error).message);
          setConnecting(false);
        }
      }
    };

    authenticateWithSupabase();
  }, [
    isConnected,
    addressLower,
    router,
    registerReferral,
    isValidAddress,
    referrer,
    connecting,
    referralInfo,
    referralInfoLoading,
  ]);

  const handleConnectWithReferral = useCallback(() => {
    handleDismissReferral();
    handleConnect();
  }, [handleDismissReferral, handleConnect]);

  const handlePWAInstall = useCallback(() => {
    console.log('App installed successfully');
  }, []);

  const handlePWADismiss = useCallback(() => {
    console.log('Install banner dismissed');
  }, []);

  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 py-8 text-gray-900 dark:text-white transition-colors duration-300">
      <InstallPWA
        variant="banner"
        showBanner={true}
        showButton={false}
        onInstall={handlePWAInstall}
        onDismiss={handlePWADismiss}
      />
      {/* <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div> */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      {/* Celebration Animation */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        achievementType="steps"
        achievementValue="1 MVN"
        achievementTitle="Referral Bonus Claimed!"
        description="Welcome bonus added to your account"
        rewardAmount="1"
        rewardCurrency="MVN"
        showReward={true}
      />

      {/* Referral Modal */}
      <AnimatePresence>
        {showReferralModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismissReferral}
            />

            <motion.div
              className={`relative w-full max-w-md mx-auto ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } rounded-2xl shadow-2xl border ${
                isDark ? 'border-blue-500/30' : 'border-blue-500/20'
              } overflow-hidden`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-center relative">
                <button
                  onClick={handleDismissReferral}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-white mb-1">Referral Bonus!</h3>
                <p className="text-blue-100 text-sm">You&apos;re joining through a referral</p>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-1">
                      MVN
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                    Connect your wallet now to claim your <strong>1 MVN bonus</strong> from your
                    referral!
                  </p>
                </div>

                <Button
                  onClick={handleConnectWithReferral}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                >
                  Connect Wallet & Claim Bonus
                </Button>

                <button
                  onClick={handleDismissReferral}
                  className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Continue without connecting
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
        <div className="w-full max-w-md flex flex-col items-center space-y-8">
          {/* Logo Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="relative flex flex-col items-center"
          >
            <div className="absolute -inset-8 rounded-full bg-blue-500/10 blur-xl"></div>
            <div
              className={`relative w-40 h-40 ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } rounded-full p-6 shadow-lg border ${
                isDark ? 'border-blue-500/30' : 'border-blue-500/20'
              } flex items-center justify-center transition-colors duration-300`}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    'drop-shadow(0 0 0px rgba(59,130,246,0.7))',
                    'drop-shadow(0 0 15px rgba(59,130,246,0.7))',
                    'drop-shadow(0 0 0px rgba(59,130,246,0.7))',
                  ],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: 'easeInOut',
                }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Movin Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Title Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500"
            >
              Movin
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-gray-700 dark:text-blue-100"
            >
              Your effort counts
            </motion.p>
          </div>

          {/* Connect Button Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full flex flex-col items-center space-y-4"
          >
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border-0"
            >
              {connecting ? (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center justify-center"
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  Connect Wallet
                </motion.div>
              )}
            </Button>

            {authError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center text-sm"
              >
                {authError}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [0, Math.random() * -30 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: Math.random() * 3 + 2,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
            }}
          />
        ))}
      </div>

      {/* Version at bottom of page */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-4"
      >
        <p className="text-gray-400 dark:text-blue-200/50 text-xs text-center">v1.4.5</p>
      </motion.div>
    </div>
  );
}

export function ConnectPage() {
  return (
    <Suspense fallback={<ConnectPageFallback />}>
      <ConnectPageContent />
    </Suspense>
  );
}

function ConnectPageFallback() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 py-8 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
        <div className="w-full max-w-md flex flex-col items-center space-y-8">
          {/* Logo Section */}
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-8 rounded-full bg-blue-500/10 blur-xl"></div>
            <div
              className={`relative w-40 h-40 ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } rounded-full p-6 shadow-lg border ${
                isDark ? 'border-blue-500/30' : 'border-blue-500/20'
              } flex items-center justify-center transition-colors duration-300`}
            >
              <Image
                src="/images/logo.png"
                alt="Movin Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500">
              Movin
            </h1>

            <p className="text-lg text-gray-700 dark:text-blue-100">Your effort counts</p>
          </div>

          {/* Loading Button Section */}
          <div className="w-full">
            <div className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 border-0 flex items-center justify-center">
              <div className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Loading...
            </div>
          </div>
        </div>
      </div>

      {/* Version at bottom of page */}
      <div className="absolute bottom-4">
        <p className="text-gray-400 dark:text-blue-200/50 text-xs text-center">v1.4.5</p>
      </div>
    </div>
  );
}
