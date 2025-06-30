'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw, Unlock, TrendingUp, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { IUserStake } from '@/lib/hooks/useMovinEarn';

interface UnstakeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  stake: IUserStake;
  tokenSymbol: string;
  onUnstake: () => Promise<void>;
  onRestake: (lockMonths: number) => Promise<void>;
  isProcessing: boolean;
}

const lockPeriodOptions = [
  { months: 1, apr: 1, label: '1 month' },
  { months: 3, apr: 3, label: '3 months' },
  { months: 6, apr: 6, label: '6 months' },
  { months: 12, apr: 12, label: '12 months' },
  { months: 24, apr: 24, label: '24 months' },
];

export function UnstakeWarningModal({
  isOpen,
  onClose,
  stake,
  tokenSymbol,
  onUnstake,
  onRestake,
  isProcessing,
}: UnstakeWarningModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(3); // Default to 3 months
  const [isRestakeMode, setIsRestakeMode] = useState(false);

  const stakeAmount = useMemo(() => Number(stake.amount).toFixed(2), [stake.amount]);
  const unstakeFeeAmount = useMemo(() => (Number(stake.amount) * 0.01).toFixed(2), [stake.amount]);
  const netUnstakeAmount = useMemo(() => (Number(stake.amount) * 0.99).toFixed(2), [stake.amount]);

  const selectedOption = useMemo(
    () => lockPeriodOptions.find((option) => option.months === selectedLockPeriod),
    [selectedLockPeriod],
  );

  const getLockPeriodButtonClass = (optionMonths: number) => {
    if (selectedLockPeriod === optionMonths) {
      return isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50';
    }
    return isDark
      ? 'border-gray-700 hover:border-gray-600'
      : 'border-gray-200 hover:border-gray-300';
  };

  const handleUnstake = useCallback(async () => {
    await onUnstake();
    onClose();
  }, [onUnstake, onClose]);

  const handleRestake = useCallback(async () => {
    await onRestake(selectedLockPeriod);
    onClose();
  }, [onRestake, selectedLockPeriod, onClose]);

  const handleModeSwitch = useCallback((mode: boolean) => {
    setIsRestakeMode(mode);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-auto rounded-xl ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } shadow-xl border`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-xl font-bold">
                  {isRestakeMode ? 'Restake Tokens' : 'Unstake Warning'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body (Scrollable) */}
            <div className="overflow-auto max-h-[calc(90vh-128px)] p-6 space-y-6">
              {/* Stake Info */}
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Stake Amount</span>
                  <span className="font-semibold">
                    {stakeAmount} {tokenSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Pending Rewards</span>
                  <span className="text-blue-500 font-medium">
                    +{Number(stake.reward).toFixed(2)} {tokenSymbol}
                  </span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-lg p-1 bg-gray-200 dark:bg-gray-800 mb-6">
                <Button
                  variant={!isRestakeMode ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleModeSwitch(false)}
                >
                  <Unlock className="h-4 w-4 mr-1" />
                  Unstake
                </Button>
                <Button
                  variant={isRestakeMode ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleModeSwitch(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Restake
                </Button>
              </div>

              {!isRestakeMode ? (
                /* Unstake Mode */
                <div className="space-y-4">
                  {/* Warning */}
                  <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Unstaking Fee Applied
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        A 1% fee will be deducted from your unstaked amount. Consider restaking to
                        avoid this fee.
                      </p>
                    </div>
                  </div>

                  {/* Unstake Breakdown */}
                  <div
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stake Amount:</span>
                        <span>
                          {stakeAmount} {tokenSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unstaking Fee (1%):</span>
                        <span className="text-red-500">
                          -{unstakeFeeAmount} {tokenSymbol}
                        </span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                        <div className="flex justify-between font-medium">
                          <span>You&apos;ll Receive:</span>
                          <span>
                            {netUnstakeAmount} {tokenSymbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Restake Mode */
                <div className="space-y-4">
                  {/* Info */}
                  <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        No Fees, Better Rewards
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Restaking avoids the 1% unstaking fee and extends your earning period with
                        potentially higher APR.
                      </p>
                    </div>
                  </div>

                  {/* Lock Period Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select New Lock Period</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {lockPeriodOptions.map((option) => (
                        <button
                          key={option.months}
                          onClick={() => setSelectedLockPeriod(option.months)}
                          className={`p-3 rounded-lg border text-left transition-all ${getLockPeriodButtonClass(
                            option.months,
                          )}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.apr}% APR</div>
                            </div>
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-500 font-medium">
                                {option.apr}%
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Restake Summary */}
                  {selectedOption && (
                    <div
                      className={`p-4 rounded-lg border ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Restake Amount:</span>
                          <span>
                            {stakeAmount} {tokenSymbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">New Lock Period:</span>
                          <span>{selectedOption.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">New APR:</span>
                          <span className="text-green-500 font-medium">{selectedOption.apr}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unstaking Fee:</span>
                          <span className="text-green-500 font-medium">$0.00 (Waived)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer (Sticky) */}
            <div
              className={`sticky bottom-0 z-10 p-4 border-t ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              {!isRestakeMode ? (
                <LoadingButton
                  className="w-full py-6 text-lg bg-red-500 hover:bg-red-600"
                  loading={isProcessing}
                  loadingText="Processing..."
                  onClick={handleUnstake}
                  disabled={isProcessing}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Confirm Unstake
                </LoadingButton>
              ) : (
                <LoadingButton
                  className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
                  loading={isProcessing}
                  loadingText="Processing..."
                  onClick={handleRestake}
                  disabled={isProcessing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Confirm Restake
                </LoadingButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
