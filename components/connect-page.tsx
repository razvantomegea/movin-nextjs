'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const [connecting, setConnecting] = useState(isConnected);
  const [authError, setAuthError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);
  const { useRegisterReferral } = useMovinEarn();
  const { registerReferral } = useRegisterReferral();

  // Check for referral in URL
  useEffect(() => {
    const referralParam = searchParams.get('referral');
    if (referralParam && isValidAddress(referralParam)) {
      setReferrer(referralParam);
      localStorage.setItem('referrer', referralParam);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      open();
      setAuthError(null);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setAuthError('Failed to open wallet connection. Please try again.');
    }
  };

  useEffect(() => {
    const authenticateWithSupabase = async () => {
      if (isConnected && addressLower) {
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

            // Register referral if one was provided
            const storedReferrer = localStorage.getItem('referrer');

            if (
              storedReferrer &&
              isValidAddress(storedReferrer) &&
              storedReferrer.toLowerCase() !== addressLower
            ) {
              try {
                await registerReferral(storedReferrer);
                console.log('Referral registered successfully');
              } catch (referralError) {
                console.error('Failed to register referral:', referralError);
                // Don't fail authentication if referral registration fails
              }
            }
          } catch (profileError) {
            console.error('Profile setup error:', profileError);
            // Don't fail the authentication if profile creation fails
            // Just log the error and continue
          }

          // Navigate to dashboard on successful authentication
          const navigateTimeout = setTimeout(() => {
            localStorage.removeItem('referrer');
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
  }, [isConnected, addressLower, router, registerReferral]);

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 py-8 text-gray-900 dark:text-white transition-colors duration-300">
      {/* <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div> */}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      {referrer && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-10"
        >
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              You&apos;re joining through a referral! Connect your wallet to earn 1 MVN bonus.
            </p>
          </div>
        </motion.div>
      )}

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
              It all starts with one step
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
              y: [null, Math.random() * -30 - 10, undefined],
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
        <p className="text-gray-400 dark:text-blue-200/50 text-xs text-center">v1.3.1</p>
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

            <p className="text-lg text-gray-700 dark:text-blue-100">It all starts with one step</p>
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
        <p className="text-gray-400 dark:text-blue-200/50 text-xs text-center">v1.3.1</p>
      </div>
    </div>
  );
}
