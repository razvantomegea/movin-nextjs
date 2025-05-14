'use client';

import { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/lib/supabase/profile';
import { getProfile } from '@/lib/supabase/profile';
import { ThemeToggle } from './theme-toggle';

export function ConnectPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { open } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { open: isOpen } = useAppKitState();
  const [connecting, setConnecting] = useState(isConnected);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleConnect = async () => {
    open();
    setConnecting(true);
    setAuthError(null);
  };

  useEffect(() => {
    const authenticateWithSupabase = async () => {
      if (isConnected && address) {
        try {
          // Call the API to generate JWT and authenticate with Supabase
          const response = await fetch('/api/auth/wallet-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address }),
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
            const profile = await getProfile({ address });

            // If no profile exists, create one with address as username
            if (!profile) {
              await updateProfile({
                address,
                profileData: {
                  username: address,
                  email: '',
                  avatar_url: '',
                  level: 1,
                  streak_days: 0,
                  address,
                },
              });
            }
          } catch (profileError) {
            console.error('Profile setup error:', profileError);
            // Don't fail the authentication if profile creation fails
            // Just log the error and continue
          }

          // Navigate to dashboard on successful authentication
          router.push('/dashboard');
        } catch (error) {
          console.error('Authentication error:', error);
          setAuthError((error as Error).message);
          setConnecting(false);
        }
      }
    };

    authenticateWithSupabase();
  }, [isConnected, address, router]);

  useEffect(() => {
    if (isOpen) {
      setConnecting(false);
    }
  }, [isOpen]);

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-4 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="mb-12 relative"
        >
          <div className="absolute -inset-8 rounded-full bg-blue-500/10 blur-xl"></div>
          <div
            className={`relative w-40 h-40 mb-4 ${
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

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500"
        >
          Movin
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl mb-12 text-center text-gray-700 dark:text-blue-100"
        >
          It all starts with one step
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full"
        >
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border-0"
          >
            {connecting ? (
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Connecting...
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </motion.div>
            )}
          </Button>

          {authError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-500 text-center"
            >
              {authError}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 text-center text-gray-600 dark:text-blue-200/70 text-sm"
        >
          <p>Earn while you burn</p>
        </motion.div>
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
    </div>
  );
}
