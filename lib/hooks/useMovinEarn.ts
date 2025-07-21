'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { formatUnits, parseUnits } from 'viem';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFunding } from '@/app/contexts/funding-provider';
import movinEarnAbi from '@/lib/abi/movin-earn-abi.json';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import { captureBlockchainError } from '@/lib/sentry';
import { forceLogout, isWalletConnected, handleAuthError } from '@/utils/auth';
import { mapError } from '@/utils/errors';
import { getFormattedStakes } from '@/utils/staking/getFormattedStakes';

// MovinEarn contract address (Base network)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MOVIN_EARN_CONTRACT_ADDRESS as `0x${string}`;

// Constants for max values
const MAX_STEPS_PER_MINUTE = 300;
const MAX_METS_PER_MINUTE = 5;
const REWARDS_PERCENTAGE_FEE = 1;

// Types
export interface IUserActivity {
  dailySteps: number;
  dailyMets: number;
  lastRewardAccumulationTime: number;
  isPremium: boolean;
  lastUpdated: number;
}

export interface IUserActivityAbi {
  dailySteps: bigint;
  dailyMets: bigint;
  lastRewardAccumulationTime: bigint;
  isPremium: boolean;
  lastUpdated: bigint;
}

export interface IActivityRewards {
  stepsRewards: number;
  metsRewards: number;
  steps: number;
  mets: number;
}

export interface IReferralInfo {
  referrer: string;
  earnedBonus: string;
  referralCount: number;
}

export interface IUserStakeAbi {
  amount: bigint;
  startTime: bigint;
  lockDuration: bigint;
  lastClaimed: bigint;
  rewards: bigint;
}

export interface IUserStake {
  amount: string;
  startTime: number;
  startTimeFormatted: string;
  lockDuration: number;
  lockDurationFormatted: string;
  endTime: number;
  endTimeFormatted: string;
  timeRemaining: number;
  timeRemainingFormatted: string;
  reward: string;
  canUnstake: boolean;
  lastClaimed: bigint;
}

export interface IStakeRewards {
  stakes: IUserStake[];
  rewardsPercentageFee: number;
  totalStaked: string;
  totalStakingRewards: string;
}

export interface IPremiumStatus {
  status: boolean;
  paid: string;
  expiration: number;
}

export interface IPremiumStatusAbi {
  status: boolean;
  paid: bigint;
  expiration: bigint;
}

export interface IBaseRates {
  baseStepsRate: string;
  baseMetsRate: string;
}

/**
 * Hook for interacting with the MovinEarn contract
 * Provides methods for reading and writing to the contract
 */
export function useMovinEarn() {
  const dispatch = useAppDispatch();
  const { address, isConnected } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const { checkAndFundWallet } = useFunding();
  const router = useRouter();

  /**
   * Gets the contract address
   * @returns The contract address
   */
  const getContractAddress = (): string => {
    return CONTRACT_ADDRESS;
  };

  /**
   * Checks if wallet is connected and forces logout if not
   * @returns boolean indicating if wallet is connected
   */
  const checkWalletConnection = (): boolean => {
    if (!isWalletConnected(address, isConnected)) {
      console.warn('Wallet disconnected during transaction attempt, forcing logout');
      forceLogout();
      return false;
    }
    return true;
  };

  /**
   * Checks wallet connection and funds wallet if balance is 0
   * @returns boolean indicating if wallet is ready for transactions
   */
  const checkWalletAndFund = async (): Promise<boolean> => {
    if (!checkWalletConnection()) {
      return false;
    }

    // Check and fund wallet if needed
    const funded = await checkAndFundWallet();
    return funded;
  };

  /**
   * Gets the user's activity data
   * @returns Hook result with activity data
   */
  const useUserActivity = () => {
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getTodayUserActivity',
      args: [addressLower],
      query: {
        enabled: !!addressLower,
      },
    });

    // Format the activity data
    const formattedActivity = (): IUserActivity => {
      if (result.data) {
        const activity = result.data as IUserActivityAbi;
        return {
          dailySteps: Number(activity.dailySteps),
          dailyMets: Number(activity.dailyMets),
          lastRewardAccumulationTime: Number(activity.lastRewardAccumulationTime),
          isPremium: activity.isPremium,
          lastUpdated: Number(activity.lastUpdated),
        };
      }
      return {
        dailySteps: 0,
        dailyMets: 0,
        lastRewardAccumulationTime: 0,
        isPremium: false,
        lastUpdated: 0,
      };
    };

    return {
      ...result,
      formattedActivity,
    };
  };

  /**
   * Calculates activity rewards based on steps and METs
   * @param steps The number of steps
   * @param mets The number of METs
   * @returns Hook result with calculated rewards
   */
  const useCalculateActivityRewards = (steps: number, mets: number) => {
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'calculateActivityRewards',
      args: [addressLower, steps, mets],
      query: {
        enabled: !!addressLower && (steps > 0 || mets > 0),
      },
    });

    // Format the rewards
    const formattedRewards = (): IActivityRewards => {
      if (result.data) {
        const rewards = result.data as [bigint, bigint, bigint, bigint];

        return {
          stepsRewards: Number(formatUnits(rewards[0], 18)),
          metsRewards: Number(formatUnits(rewards[1], 18)),
          steps: Number(rewards[2]),
          mets: Number(rewards[3]),
        };
      }
      return {
        stepsRewards: 0,
        metsRewards: 0,
        steps: 0,
        mets: 0,
      };
    };

    return {
      ...result,
      formattedRewards,
    };
  };

  /**
   * Gets referral information for a user
   * @param userAddress The user's address (defaults to connected wallet)
   * @returns Hook result with referral information
   */
  const useReferralInfo = (userAddress?: string) => {
    const addressToUse = userAddress || addressLower;

    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getReferralInfo',
      args: addressToUse ? [addressToUse] : undefined,
      query: {
        enabled: !!addressToUse,
      },
    });

    // Format the referral info
    const formattedReferralInfo = (): IReferralInfo | null => {
      if (result.data) {
        const info = result.data as [string, bigint, bigint];
        return {
          referrer: info[0],
          earnedBonus: formatUnits(info[1], 18),
          referralCount: Number(info[2]),
        };
      }
      return null;
    };

    return {
      ...result,
      formattedReferralInfo,
    };
  };

  /**
   * Gets the user's referrals
   * @param userAddress The user's address (defaults to connected wallet)
   * @returns Hook result with referrals
   */
  const useUserReferrals = (userAddress?: string) => {
    const addressToUse = userAddress || addressLower;

    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getUserReferrals',
      args: addressToUse ? [addressToUse] : undefined,
      query: {
        enabled: !!addressToUse,
      },
    }) as { data: string[] | undefined; isLoading: boolean; error: Error | null };
  };

  /**
   * Hook to register a referral
   * @returns Hook result with register function
   */
  const useRegisterReferral = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Registers a referral
     * @param referrerAddress The address of the referrer
     * @returns A promise resolved when the transaction is initiated
     */
    const registerReferral = async (referrerAddress: string): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'registerReferral',
          args: [referrerAddress],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );
        dispatch(
          showErrorToast({
            title: 'Error Registering Referral',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - registerReferral');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      registerReferral,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Gets the base rates for steps and METs
   * @returns Hook result with base rates
   */
  const useBaseRates = () => {
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getBaseRates',
    });

    // Format the base rates
    const formattedBaseRates = (): IBaseRates => {
      if (result.data) {
        const rates = result.data as [bigint, bigint];
        return {
          baseStepsRate: formatUnits(rates[0], 18),
          baseMetsRate: formatUnits(rates[1], 18),
        };
      }
      return {
        baseStepsRate: '1',
        baseMetsRate: '1',
      };
    };

    return {
      ...result,
      formattedBaseRates,
    };
  };

  /**
   * Gets the constants for maximum daily steps and METs
   */

  const getMaxStepsPerMinute = (): number => MAX_STEPS_PER_MINUTE;
  const getMaxMetsPerMinute = (): number => MAX_METS_PER_MINUTE;

  /**
   * Gets the reward halving timestamp
   * @returns Hook result with halving timestamp
   */
  const useRewardHalvingTimestamp = () => {
    return useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'rewardHalvingTimestamp',
    }) as { data: bigint | undefined; isLoading: boolean; error: Error | null };
  };

  /**
   * Hook to record activity
   * @returns Hook result with record function
   */
  const useRecordActivity = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Records activity
     * @param steps The number of steps to record
     * @param mets The number of METs to record
     * @returns A promise resolved when the transaction is initiated
     */
    const recordActivity = async (steps: number, mets: number): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'recordActivity',
          args: [addressLower, steps, mets],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);

        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );

        dispatch(
          showErrorToast({
            title: 'Error Recording Activity',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - recordActivity');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      recordActivity,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Gets the user's stakes
   * @param userAddress The user's address (defaults to connected wallet)
   * @returns Hook result with stakes
   */
  const useUserStakes = (userAddress?: string) => {
    const addressToUse = userAddress || addressLower;

    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getUserStakes',
      args: addressToUse ? [addressToUse] : undefined,
      query: {
        enabled: !!addressToUse,
      },
    });

    const rewardsPercentageFee = REWARDS_PERCENTAGE_FEE;

    return {
      ...result,
      data: getFormattedStakes({
        stakes: result?.data as IUserStakeAbi[],
        rewardsPercentageFee,
      }),
    };
  };

  /**
   * Hook to claim staking rewards
   * @returns Hook result with claim function
   */
  const useClaimStakingRewards = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Claims staking rewards for a specific stake
     * @param stakeIndex The index of the stake
     * @returns A promise resolved when the transaction is initiated
     */
    const claimStakingRewards = async (stakeIndex: number): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'claimStakingRewards',
          args: [stakeIndex],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );

        dispatch(
          showErrorToast({
            title: 'Error Claiming Staking Rewards',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - claimStakingRewards');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      claimStakingRewards,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to claim all staking rewards
   * @returns Hook result with claim function
   */
  const useClaimAllStakingRewards = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Claims all staking rewards
     * @returns A promise resolved when the transaction is initiated
     */
    const claimAllStakingRewards = async (): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'claimAllStakingRewards',
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );
        dispatch(
          showErrorToast({
            title: 'Error Claiming All Staking Rewards',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - claimAllStakingRewards');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      claimAllStakingRewards,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to stake tokens
   * @returns Hook result with stake function
   */
  const useStakeTokens = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Stakes tokens
     * @param amount The amount to stake in ether
     * @param lockMonths The lock period in months
     * @returns A promise resolved when the transaction is initiated
     */
    const stakeTokens = async (amount: string, lockMonths: number): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        const amountWei = parseUnits(amount, 18);

        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'stakeTokens',
          args: [amountWei, lockMonths],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );

        dispatch(
          showErrorToast({
            title: 'Error Staking Tokens',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - stakeTokens');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      stakeTokens,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to unstake tokens
   * @returns Hook result with unstake function
   */
  const useUnstake = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Unstakes tokens
     * @param stakeIndex The index of the stake to unstake
     * @returns A promise resolved when the transaction is initiated
     */
    const unstake = async (stakeIndex: number): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'unstake',
          args: [stakeIndex],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );
        dispatch(
          showErrorToast({
            title: 'Error Unstaking Tokens',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - unstake');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      unstake,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to restake tokens
   * @returns Hook result with restake function
   */
  const useRestake = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Restakes tokens
     * @param stakeIndex The index of the stake to restake
     * @param lockMonths The new lock period in months
     * @returns A promise resolved when the transaction is initiated
     */
    const restake = async (stakeIndex: number, lockMonths: number): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'restake',
          args: [stakeIndex, lockMonths],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );
        dispatch(
          showErrorToast({
            title: 'Error Restaking Tokens',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - restake');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      restake,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Gets the premium status for the user
   * @returns Hook result with premium status
   */
  const usePremiumStatus = () => {
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getPremiumStatus',
      args: addressLower ? [addressLower] : undefined,
      query: {
        enabled: !!addressLower,
      },
    });

    // Format the premium status
    const formattedPremiumStatus = (): IPremiumStatus => {
      if (result.data) {
        const premiumStatus = result.data as IPremiumStatusAbi;

        return {
          status: premiumStatus.status,
          paid: formatUnits(premiumStatus.paid, 18),
          expiration: Number(premiumStatus.expiration),
        };
      }

      return {
        status: false,
        paid: '0',
        expiration: 0,
      };
    };

    // Check if premium status is active (status = true and not expired)
    const isPremiumActive = (): boolean => {
      const premium = formattedPremiumStatus();
      if (!premium.status) return false;

      // Check expiration
      if (premium.expiration === 0) return false;
      return premium.expiration > Math.floor(Date.now() / 1000);
    };

    return {
      ...result,
      formattedPremiumStatus,
      isPremiumActive,
    };
  };

  /**
   * Hook to set premium status
   * @returns Hook result with set premium function
   */
  const useSetPremiumStatus = () => {
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isSuccess, error: waitError } = useWaitForTransactionReceipt({ hash });

    /**
     * Sets premium status
     * @param status The premium status to set
     * @param amount The amount to pay for premium in ether
     * @returns A promise resolved when the transaction is initiated
     */
    const setPremiumStatus = async (status: boolean, amount: string): Promise<boolean> => {
      const ready = await checkWalletAndFund();
      if (!ready) {
        return false;
      }

      try {
        const amountWei = parseUnits(amount, 18);

        await writeContract({
          address: CONTRACT_ADDRESS,
          abi: movinEarnAbi,
          functionName: 'setPremiumStatus',
          args: [status, amountWei],
        });

        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          hash,
          CONTRACT_ADDRESS,
          address,
        );
        dispatch(
          showErrorToast({
            title: 'Error Setting Premium Status',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - setPremiumStatus');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }

        return false;
      }
    };

    return {
      setPremiumStatus,
      hash,
      error: writeError || waitError,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to claim meal rewards by owner (admin)
   * @returns Hook result with claimMealRewards function
   */
  const useClaimMealRewards = () => {
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const claimMealRewards = async (user: string, score: number): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      setIsSuccess(false);

      try {
        const response = await fetch('/api/admin/claim-meal-rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, score }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }

        setIsPending(false);
        setIsSuccess(true);
        return true;
      } catch (err) {
        const errorMessage = mapError(err);
        captureBlockchainError(
          err instanceof Error
            ? err
            : new Error(String((err as unknown as Error)?.message || 'Unknown blockchain error')),
          '',
          CONTRACT_ADDRESS,
          address,
        );

        setError(err as Error);
        dispatch(
          showErrorToast({
            title: 'Error Claiming Meal Rewards',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - claimMealRewards');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }
        setIsPending(false);
        return false;
      }
    };

    return {
      claimMealRewards,
      error,
      isPending,
      isSuccess,
    };
  };

  /**
   * Hook to fund wallet with initial ETH for gas fees
   * @returns Hook result with fundWallet function
   */
  const useFundWallet = () => {
    const [error, setError] = useState<Error | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const fundWallet = async (): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      setIsSuccess(false);

      try {
        const response = await fetch('/api/fund-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }

        setIsPending(false);
        setIsSuccess(true);

        // Show success toast
        dispatch(
          showSuccessToast({
            title: 'Gas Fees Funded',
            description: data.message || '0.0001 ETH received for gas fees',
          }),
        );

        return true;
      } catch (err) {
        const errorMessage = mapError(err);

        setError(err as Error);
        dispatch(
          showErrorToast({
            title: 'Error Funding Wallet',
            description: errorMessage,
          }),
        );
        handleAuthError(errorMessage, 'useMovinEarn - fundWallet');
        if (errorMessage.includes('not connected')) {
          router.push('/connect-page');
        } else if (errorMessage.includes('connected')) {
          forceLogout();
        }
        setIsPending(false);
        return false;
      }
    };

    return {
      fundWallet,
      error,
      isPending,
      isSuccess,
    };
  };

  /**
   * Gets the last meal claim timestamp for the user
   * @returns Hook result with last claim timestamp
   */
  const useLastMealClaim = (userAddress?: string) => {
    const addressToUse = userAddress || addressLower;
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getLastMealClaim',
      args: addressToUse ? [addressToUse] : undefined,
      query: {
        enabled: !!addressToUse,
      },
    });
    // Format the last claim timestamp
    const lastClaimTimestamp = result.data ? Number(result.data as bigint) : 0;
    return {
      ...result,
      lastClaimTimestamp,
    };
  };

  /**
   * Gets the meal rewards for a user and score
   * @param userAddress The user's address (defaults to connected wallet)
   * @param score The meal score
   * @returns Hook result with meal reward amount
   */
  const useGetMealRewards = (score: number, userAddress?: string) => {
    const addressToUse = userAddress || addressLower;
    const result = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: movinEarnAbi,
      functionName: 'getMealRewards',
      args: addressToUse && score !== undefined ? [addressToUse, score] : undefined,
      query: {
        enabled: !!addressToUse && score !== undefined && score > 0,
      },
    });
    // Format the reward amount
    const rewardAmount = result.data ? formatUnits(result.data as bigint, 18) : '0';
    return {
      ...result,
      rewardAmount,
    };
  };

  return {
    // Utility functions
    getContractAddress,
    getMaxStepsPerMinute,
    getMaxMetsPerMinute,

    // Read-only hooks
    useUserActivity,
    useCalculateActivityRewards,
    useReferralInfo,
    useUserReferrals,
    useBaseRates,
    useRewardHalvingTimestamp,
    useLastMealClaim,
    useUserStakes,
    usePremiumStatus,
    useGetMealRewards,

    // Write hooks
    useRegisterReferral,
    useRecordActivity,
    useClaimStakingRewards,
    useClaimAllStakingRewards,
    useStakeTokens,
    useUnstake,
    useRestake,
    useSetPremiumStatus,
    useClaimMealRewards,
    useFundWallet,
  };
}
