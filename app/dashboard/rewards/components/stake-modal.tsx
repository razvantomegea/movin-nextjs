'use client';

import { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { TransactionConfirmationModal } from '@/components/transaction-confirmation-modal';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
// import { Slider } from '@/components/ui/slider';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useMovinEarnUtils } from '@/lib/hooks/useMovinEarnUtils';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';

interface StakeModalProps {
  isOpen: boolean;
  onClose: (isStaked?: boolean) => void;
}

interface LockPeriodOption {
  months: number;
  apr: number;
}

export function StakeModal({ isOpen, onClose }: StakeModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [amount, setAmount] = useState<string>('');
  const [period, setPeriod] = useState<number>(1); // Default to 1 month
  const [baseAPR] = useState<number>(0); // Base APR percentage
  const [formError, setFormError] = useState<string>('');
  const [isApprovalNeeded, setIsApprovalNeeded] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  // Get token symbol and balance
  const { useTokenSymbol, useTokenBalance, useApproveTokens } = useMovinToken();
  const { data: tokenSymbol } = useTokenSymbol();
  const { formattedBalance: availableBalance, formattedBalanceWithSuffix } = useTokenBalance();
  const { approveTokens } = useApproveTokens();

  // Get staking functions from the hook
  const { getContractAddress, useStakeTokens } = useMovinEarn();

  // Get MovinEarnUtils for token approval check
  const { useCheckIfTokenApprovalIsNeeded } = useMovinEarnUtils();
  const checkApproval = useCheckIfTokenApprovalIsNeeded();

  // For staking tokens
  const {
    stakeTokens,
    isPending: isStaking,
    isLoading: isStakeLoading,
    isSuccess: isStakeSuccess,
    error: stakeError,
  } = useStakeTokens();

  // Define lock period options
  const lockPeriodOptions = useMemo<LockPeriodOption[]>(
    () => [
      { months: 1, apr: 1 },
      { months: 3, apr: 3 },
      { months: 6, apr: 6 },
      { months: 12, apr: 12 },
      { months: 24, apr: 24 },
    ],
    [],
  );

  // Calculate total APR based on period
  const totalAPR = useMemo(() => {
    return baseAPR + period;
  }, [period, baseAPR]);

  // Get period label
  const getPeriodLabel = useCallback((months: number) => {
    return months === 1 ? '1 month' : `${months} months`;
  }, []);

  // Calculate estimated rewards based on amount, APR, and period
  const estimatedRewards = useMemo(() => {
    if (!amount || isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      return '0';
    }

    const amountValue = Number.parseFloat(amount);
    const reward = (amountValue * totalAPR * period) / (12 * 100);
    return reward.toFixed(2);
  }, [amount, totalAPR, period]);

  // Calculate dollar value of amount
  const dollarValue = useMemo(() => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      return '';
    }
    return `≈ $${(Number.parseFloat(amount) * 0.01).toFixed(2)}`;
  }, [amount]);

  // Calculate unlock date
  const unlockDate = useMemo(() => {
    return new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
  }, [period]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      amount &&
      Number.parseFloat(amount) > 0 &&
      Number.parseFloat(amount) <= Number.parseFloat(availableBalance) &&
      !isStaking &&
      !isStakeLoading &&
      !isProcessing
    );
  }, [amount, availableBalance, isStaking, isStakeLoading, isProcessing]);

  // Handlers
  const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setFormError('');
    }
  }, []);

  const handleMaxClick = useCallback(() => {
    setAmount(availableBalance);
    setFormError('');
  }, [availableBalance]);

  // const handlePeriodChange = useCallback((value: number[]) => {
  //   setPeriod(value[0]);
  // }, []);

  const validateForm = useCallback((): boolean => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setFormError('Please enter a valid amount');
      return false;
    }

    if (Number.parseFloat(amount) > Number.parseFloat(availableBalance)) {
      setFormError('Amount exceeds available balance');
      return false;
    }

    return true;
  }, [amount, availableBalance]);

  // Check if approval is needed
  const checkApprovalNeeded = useCallback(async () => {
    if (!amount || Number.parseFloat(amount) <= 0) return false;

    try {
      const needsApproval = checkApproval(amount);
      setIsApprovalNeeded(needsApproval);
      return needsApproval;
    } catch (err) {
      console.error('Error checking approval:', err);
      dispatch(
        showErrorToast({
          title: 'Approval Check Failed',
          description: 'Unable to verify token approval status. Please try again.',
        }),
      );
    }
  }, [amount, checkApproval, dispatch]);

  // Handle approval process
  const handleApproval = useCallback(async () => {
    try {
      setIsProcessing(true);
      const earnAddress = getContractAddress();
      const result = await approveTokens(earnAddress, amount);

      if (result) {
        dispatch(
          showSuccessToast({
            title: 'Approval Successful',
            description: `You have successfully approved ${tokenSymbol} for staking.`,
          }),
        );
        setIsApprovalNeeded(false);
        // Proceed to staking after successful approval
        setIsApprovalModalOpen(false);
        setIsStakeModalOpen(true);
      } else {
        throw new Error('Approval failed');
      }
    } catch (err) {
      dispatch(
        showErrorToast({
          title: 'Approval Failed',
          description: err instanceof Error ? err.message : 'An unknown error occurred',
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  }, [amount, dispatch, tokenSymbol, approveTokens, getContractAddress]);

  // Handle stake process
  const handleStakeConfirmed = useCallback(async () => {
    try {
      setIsProcessing(true);
      const result = await stakeTokens(amount, period);
      if (!result) {
        throw new Error('Staking failed');
      }
    } catch (err) {
      dispatch(
        showErrorToast({
          title: 'Staking Failed',
          description: err instanceof Error ? err.message : 'An unknown error occurred',
        }),
      );
    } finally {
      setIsProcessing(false);
      setIsStakeModalOpen(false);
    }
  }, [amount, period, stakeTokens, dispatch]);

  const handleStake = useCallback(async () => {
    // Clear previous errors
    setFormError('');

    // Validate form
    if (!validateForm()) return;

    try {
      const needsApproval = await checkApprovalNeeded();

      if (needsApproval) {
        // Show approval modal first
        setIsApprovalModalOpen(true);
      } else {
        // Proceed directly to staking
        setIsStakeModalOpen(true);
      }
    } catch (err) {
      dispatch(
        showErrorToast({
          title: 'Staking Process Error',
          description: err instanceof Error ? err.message : 'An unknown error occurred',
        }),
      );
    }
  }, [validateForm, checkApprovalNeeded, dispatch]);

  // Handle successful stake
  useEffect(() => {
    if (isStakeSuccess) {
      dispatch(
        showSuccessToast({
          title: 'Staking Successful',
          description: `You have successfully staked ${amount} ${tokenSymbol} for ${period} ${
            period === 1 ? 'month' : 'months'
          }.`,
        }),
      );
      // Reset form and close modal
      setAmount('');
      setPeriod(1);
      onClose(true);
    }
  }, [isStakeSuccess, amount, period, dispatch, onClose, tokenSymbol]);

  // Handle staking error
  useEffect(() => {
    if (stakeError) {
      setFormError('Failed to stake tokens. Please try again.');
    }
  }, [stakeError]);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPeriod(1);
      setFormError('');
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onClose()}
            />

            <motion.div
              className={`relative w-full sm:max-w-lg max-h-[90vh] overflow-auto rounded-xl ${
                isDark ? 'bg-gray-900' : 'bg-white'
              } shadow-xl`}
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
                <h2 className="text-xl font-bold">Stake {tokenSymbol}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onClose()}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Network Error Alert */}
                {formError && <ErrorAlert message={formError} />}

                {/* Available Balance */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available {tokenSymbol}</span>
                    <span className="font-bold">{formattedBalanceWithSuffix}</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="stake-amount" className="flex items-center justify-between">
                    <span>Amount to Stake</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="stake-amount"
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      className={`pr-16 ${
                        formError ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      placeholder="0.00"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 text-blue-500"
                      onClick={handleMaxClick}
                    >
                      MAX
                    </Button>
                  </div>

                  {/* Form Error */}
                  {formError && (
                    <div className="flex items-center text-xs text-red-500 mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {formError}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{dollarValue}</span>
                  </div>
                </div>

                {/* Staking Period */}
                <div className="space-y-4">
                  <Label className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Staking Period
                  </Label>

                  <div className="space-y-6">
                    <div className="flex justify-between flex-wrap">
                      {lockPeriodOptions.map((option) => (
                        <Button
                          key={option.months}
                          variant={period === option.months ? 'default' : 'outline'}
                          size="sm"
                          className={
                            period === option.months ? 'bg-blue-500 hover:bg-blue-600' : ''
                          }
                          onClick={() => setPeriod(option.months)}
                        >
                          {getPeriodLabel(option.months)}
                        </Button>
                      ))}
                    </div>

                    {/* <Slider
                      value={[period]}
                      min={1}
                      max={24}
                      step={1}
                      onValueChange={handlePeriodChange}
                      className="mt-2"
                    />

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 month</span>
                      <span>24 months</span>
                    </div> */}
                  </div>
                </div>

                {/* APR Information */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                    <span className="font-medium">Estimated APR</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Base APR</span>
                    <span className="font-medium">{baseAPR}%</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Period Bonus</span>
                    <span className="font-medium text-green-500">+{period}%</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <span className="font-medium">Total APR</span>
                    <span className="font-bold text-green-500">{totalAPR}%</span>
                  </div>
                </div>

                {/* Staking Summary */}
                {amount && Number.parseFloat(amount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${
                      isDark ? 'border-blue-800' : 'border-blue-100'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <Info className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-medium">Staking Summary</span>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Amount</span>
                        <span className="font-medium">
                          {Number.parseFloat(amount).toLocaleString()} {tokenSymbol}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Lock Period</span>
                        <span className="font-medium">{getPeriodLabel(period)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Unlock Date</span>
                        <span className="font-medium">{unlockDate}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-blue-800/30">
                        <span className="font-medium">Estimated Rewards</span>
                        <span className="font-bold text-blue-500">
                          +{estimatedRewards} {tokenSymbol}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Disclaimer */}
                <div className="text-xs text-gray-500">
                  <p>
                    By staking your {tokenSymbol} tokens, you agree to lock them for the selected
                    period. You cannot unstake your tokens before the end of the lock period.
                    Rewards are distributed every minute.
                  </p>
                </div>

                {/* Approval Info */}
                <div
                  className={`p-3 rounded-lg text-xs ${
                    isDark ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
                  } border ${isDark ? 'border-yellow-800/50' : 'border-yellow-200'}`}
                >
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    <p>
                      When staking for the first time, you&apos;ll need to approve {tokenSymbol}{' '}
                      tokens before staking. This requires two separate transactions: first to
                      approve the tokens, then to stake them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className={`sticky bottom-0 z-10 p-4 border-t ${
                  isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                <LoadingButton
                  className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
                  disabled={!isFormValid}
                  onClick={handleStake}
                  loading={isStaking || isStakeLoading || isProcessing}
                  loadingText="Processing..."
                >
                  Stake {tokenSymbol}
                </LoadingButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Confirmation Modal for Token Approval */}
      <TransactionConfirmationModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onSuccess={handleApproval}
        onFail={() => setIsApprovalModalOpen(false)}
        transactionDescription={`Please approve ${tokenSymbol} for staking. This is step 1 of 2: token approval.`}
        successTitle="Token Approval"
        successDescription={`You have approved ${tokenSymbol} for staking. You will now need to confirm the staking transaction.`}
      />

      {/* Transaction Confirmation Modal for Staking */}
      <TransactionConfirmationModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        onSuccess={handleStakeConfirmed}
        onFail={() => setIsStakeModalOpen(false)}
        transactionDescription={`Please confirm staking ${amount} ${tokenSymbol} for ${period} ${
          period === 1 ? 'month' : 'months'
        }. ${isApprovalNeeded ? 'This is step 2 of 2: token staking.' : ''}`}
        successTitle="Staking Confirmation"
        successDescription={`You are staking ${amount} ${tokenSymbol} for ${period} ${
          period === 1 ? 'month' : 'months'
        }.`}
      />
    </>
  );
}
