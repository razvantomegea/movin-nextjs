'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertCircle, HelpCircle, Wallet, Clock } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFail: () => void;
  rewardAmount?: number;
}

export function TransactionConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  onFail,
  rewardAmount = 0,
}: TransactionConfirmationModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();

  // Timer state
  const [timeLeft, setTimeLeft] = useState(3 * 60); // 3 minutes in seconds
  const endTimeRef = useRef<number | null>(null);

  // Handle success button click
  const handleSuccess = () => {
    dispatch(
      showSuccessToast({
        title: 'Transaction Confirmed',
        description: `You have successfully claimed ${rewardAmount.toFixed(2)} MVN in rewards.`,
      }),
    );
    onSuccess();
    onClose();
  };

  // Handle fail button click
  const handleFail = useCallback(() => {
    dispatch(
      showErrorToast({
        title: 'Transaction Failed',
        description: 'Failed to claim rewards. Please try again later.',
      }),
    );
    onFail();
    onClose();
  }, [dispatch, onFail, onClose]);

  // Set up the timer when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Set the end time (current time + 3 minutes)
      endTimeRef.current = Date.now() + timeLeft * 1000;

      // Update the timer every second
      const interval = setInterval(() => {
        const secondsLeft = Math.max(0, Math.floor((endTimeRef.current! - Date.now()) / 1000));
        setTimeLeft(secondsLeft);

        // If timer reaches 0, auto-fail
        if (secondsLeft === 0) {
          clearInterval(interval);
          handleFail();
        }
      }, 1000);

      // Clean up the interval when the modal closes
      return () => clearInterval(interval);
    }
  }, [isOpen, handleFail, timeLeft]);

  // Format the time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the timer
  const timerProgress = (timeLeft / (3 * 60)) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`relative w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-auto ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <h2 className="text-xl font-bold">Confirm Transaction</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Wallet Icon */}
              <div className="flex justify-center">
                <motion.div
                  className={`p-6 rounded-full ${isDark ? 'bg-blue-900/20' : 'bg-blue-100'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  <Wallet className="h-16 w-16 text-blue-500" />
                </motion.div>
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Waiting for Confirmation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Please confirm the transaction in your wallet to claim {rewardAmount.toFixed(2)}{' '}
                  MVN
                </p>

                <div className="flex items-center justify-center mt-2">
                  <Clock className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-orange-500 font-medium">
                    Transaction expires in {formatTimeLeft()}
                  </span>
                </div>
              </div>

              {/* Timer Progress */}
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-blue-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${timerProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Help Section */}
              <div
                className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                } flex items-start`}
              >
                <AlertCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">Don&apos;t see the transaction?</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Troubleshooting Tips</h4>
                          <ul className="text-sm space-y-1 list-disc pl-4">
                            <li>Try refreshing your wallet app</li>
                            <li>Check your internet connection</li>
                            <li>Ensure your wallet is unlocked</li>
                            <li>
                              MetaMask sometimes has issues - try a different wallet if possible
                            </li>
                            <li>Make sure you have enough gas for the transaction</li>
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    If you don&apos;t see a transaction request in your wallet, try refreshing or
                    restarting your wallet app.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={handleFail}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  No Transaction Received
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={handleSuccess}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />I Confirmed It
                </Button>
              </div>
            </div>

            {/* Mobile-only bottom padding for safe area */}
            <div className="h-8 sm:hidden"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
