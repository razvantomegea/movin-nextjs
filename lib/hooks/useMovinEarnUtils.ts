import { formatUnits, parseUnits } from 'viem';
import { useAccount } from 'wagmi';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { formatDecimal, formatTimeRemaining, formatLockPeriod, formatDate } from '@/utils/crypto';
import { parseError } from '@/utils/errors';
import { useMovinEarn } from './useMovinEarn';
import { useMovinToken } from './useMovinToken';

// Define types for higher-level abstraction
export interface RewardsInfo {
  baseStepsRate: string;
  baseMetsRate: string;
  rewardsPerStepsThreshold: number;
  rewardsPerMetsThreshold: number;
  maxDailySteps: number;
  maxDailyMets: number;
  rewardHalvingTimestamp: number;
  steps: number;
  mets: number;
  isPremium: boolean;
  premiumExpiration: number;
  lastUpdated: number;
}

export interface FormattedStake {
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

export interface UserStaking {
  stakeCount: number;
  stakes: FormattedStake[];
  hasActiveStakes: boolean;
  totalStaked: string;
  totalStakingRewards: string;
  rewardsPercentageFee: number;
}

export interface HealthData {
  steps: number;
  mets: number;
}

/**
 * Higher-level hook for interacting with MovinEarn functionality
 * Provides utilities built on top of the basic contract calls
 */
export function useMovinEarnUtils() {
  const dispatch = useAppDispatch();
  const { address } = useAccount();
  const movinEarn = useMovinEarn();
  const movinToken = useMovinToken();

  // Default initial states
  const DEFAULT_ACTIVITY: RewardsInfo = {
    baseStepsRate: '0',
    baseMetsRate: '0',
    rewardsPerStepsThreshold: 0,
    rewardsPerMetsThreshold: 0,
    maxDailySteps: 0,
    maxDailyMets: 0,
    rewardHalvingTimestamp: 0,
    steps: 0,
    mets: 0,
    isPremium: false,
    premiumExpiration: 0,
    lastUpdated: 0,
  };

  const DEFAULT_STAKING: UserStaking = {
    stakeCount: 0,
    stakes: [],
    hasActiveStakes: false,
    totalStaked: '0',
    totalStakingRewards: '0',
    rewardsPercentageFee: 0,
  };

  /**
   * Checks if token approval is needed for the specified amount
   * @param amount The amount to check approval for
   * @returns True if approval is needed, false otherwise
   */
  const checkIfTokenApprovalIsNeeded = async (amount: string): Promise<boolean> => {
    try {
      if (!address) return false;

      const earnAddress = movinEarn.getContractAddress();
      const allowanceResult = movinToken.useTokenAllowance(earnAddress, address);
      const decimalsResult = movinToken.useTokenDecimals();

      if (!allowanceResult.data || decimalsResult.data === undefined) {
        return true; // Assume approval is needed if we can't determine allowance
      }

      const currentAllowance = allowanceResult.data as bigint;
      const requiredAmount = parseUnits(amount, decimalsResult.data);

      return currentAllowance < requiredAmount;
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Checking Allowance',
          description: parsedError.message,
        }),
      );
      return true; // Conservatively assume approval is needed
    }
  };

  /**
   * Checks if token has sufficient allowance and approves if needed
   * @param amount The amount to approve in ether
   * @returns True if sufficient allowance exists or approval succeeded
   */
  const checkAndApproveTokenAllowance = async (amount: string): Promise<boolean> => {
    try {
      const approvalNeeded = await checkIfTokenApprovalIsNeeded(amount);

      if (approvalNeeded) {
        console.info('Insufficient allowance, requesting approval...');
        const earnAddress = movinEarn.getContractAddress();
        const approveTokens = movinToken.useApproveTokens();
        return await approveTokens.approveTokens(earnAddress, amount);
      }

      return true; // Allowance is already sufficient
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Approving Tokens',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  /**
   * Gets comprehensive rewards info combining several contract calls
   * @returns Promise that resolves to rewards info
   */
  const getRewardsInfo = async (): Promise<RewardsInfo> => {
    try {
      if (!address) {
        return DEFAULT_ACTIVITY;
      }

      // Get activity info
      const activityResult = movinEarn.useUserActivity();
      const activity = activityResult.formattedActivity();

      // Get base rates
      const ratesResult = movinEarn.useBaseRates();
      const rates = ratesResult.formattedBaseRates();

      // Get premium status
      const premiumResult = movinEarn.usePremiumStatus();
      const premium = premiumResult.formattedPremiumStatus();

      // Get reward halving timestamp
      const halvingResult = movinEarn.useRewardHalvingTimestamp();
      const halving = halvingResult.data ? Number(halvingResult.data) : 0;

      // Get threshold values and limits
      const stepsThreshold = movinEarn.getStepsThreshold();
      const metsThreshold = movinEarn.getMetsThreshold();
      const maxDailySteps = movinEarn.getMaxDailySteps();
      const maxDailyMets = movinEarn.getMaxDailyMets();

      return {
        baseStepsRate: rates.baseStepsRate,
        baseMetsRate: rates.baseMetsRate,
        rewardsPerStepsThreshold: stepsThreshold,
        rewardsPerMetsThreshold: metsThreshold,
        maxDailySteps,
        maxDailyMets,
        rewardHalvingTimestamp: halving,
        steps: activity.dailySteps,
        mets: activity.dailyMets,
        isPremium: premium.status,
        premiumExpiration: premium.expiration,
        lastUpdated: activity.lastUpdated,
      };
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Getting Rewards Info',
          description: parsedError.message,
        }),
      );
      return DEFAULT_ACTIVITY;
    }
  };

  /**
   * Gets comprehensive user staking data combining several contract calls
   * @returns Promise that resolves to user staking data
   */
  const getUserStaking = async (): Promise<UserStaking> => {
    try {
      if (!address) {
        return DEFAULT_STAKING;
      }

      // Get stake count
      const stakeCountResult = movinEarn.useUserStakeCount();
      const stakeCount = stakeCountResult.data ? Number(stakeCountResult.data) : 0;

      // Get all stakes
      const stakesResult = movinEarn.useUserStakes();
      const stakes = stakesResult.formattedStakes();

      let totalStaked = BigInt(0);
      let totalStakingRewards = 0;
      const formattedStakes: FormattedStake[] = [];

      // Format each stake with additional information
      for (let i = 0; i < stakeCount; i++) {
        if (i >= stakes.length) continue;

        const stake = stakes[i];
        const rewardResult = movinEarn.useCalculateStakingReward(i);
        const reward = rewardResult.formattedReward();

        const stakeAmount = parseUnits(stake.amount, 18);
        totalStaked += stakeAmount;

        // Calculate timestamps and format them
        const startTimeNum = Number(stake.startTime);
        const lockDurationNum = Number(stake.lockDuration);
        const endTime = startTimeNum + lockDurationNum;
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(0, endTime - now);

        // Format dates using crypto utils
        const startTimeFormatted = formatDate(startTimeNum * 1000);
        const endTimeFormatted = formatDate(endTime * 1000);

        // Format durations using crypto utils
        const lockDurationFormatted = formatLockPeriod(lockDurationNum);
        const timeRemainingFormatted = formatTimeRemaining(timeRemaining);

        formattedStakes.push({
          amount: stake.amount,
          startTime: startTimeNum,
          startTimeFormatted,
          lockDuration: lockDurationNum,
          lockDurationFormatted,
          endTime: endTime,
          endTimeFormatted,
          timeRemaining: timeRemaining,
          timeRemainingFormatted: timeRemaining > 0 ? timeRemainingFormatted : 'Unlocked',
          reward,
          canUnstake: timeRemaining === 0,
          lastClaimed: stake.lastClaimed,
        });

        totalStakingRewards += parseFloat(reward);
      }

      // Get unstake fee percentage
      const feePercentage = 1; // Hard-coded for now, could be fetched from contract

      return {
        stakeCount,
        stakes: formattedStakes,
        hasActiveStakes: formattedStakes.length > 0,
        totalStaked: formatUnits(totalStaked, 18),
        totalStakingRewards: formatDecimal(totalStakingRewards.toString()),
        rewardsPercentageFee: feePercentage,
      };
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Getting Staking Info',
          description: parsedError.message,
        }),
      );
      return DEFAULT_STAKING;
    }
  };

  /**
   * Checks if activity can be recorded based on rate limits
   * @param steps Number of steps to record
   * @param mets Number of METs to record
   * @returns True if activity can be recorded, false otherwise
   */
  const canRecordActivity = async (steps: number, mets: number): Promise<boolean> => {
    try {
      if (steps === 0 && mets === 0) {
        return false;
      }

      const activityData = await getRewardsInfo();
      const maxStepsPerMinute = movinEarn.getMaxStepsPerMinute();
      const maxMetsPerMinute = movinEarn.getMaxMetsPerMinute();

      if (activityData.steps === 0 && activityData.mets === 0) {
        return true;
      }

      const lastUpdated = activityData?.lastUpdated;

      if (!lastUpdated) {
        return true;
      }

      const minutesPassed = (Date.now() / 1000 - lastUpdated) / 60;
      const stepsPerMinute = steps / minutesPassed;
      const metsPerMinute = mets / minutesPassed;

      const canRecord = stepsPerMinute <= maxStepsPerMinute && metsPerMinute <= maxMetsPerMinute;

      if (!canRecord) {
        const stepsMessage = steps > 0 ? `${Math.round(stepsPerMinute)} steps` : '';
        const metsMessage = mets > 0 ? `${Math.round(metsPerMinute)} METs` : '';
        const message = [stepsMessage, metsMessage].filter(Boolean).join(' and ');

        dispatch(
          showErrorToast({
            title: 'Rate Limit Exceeded',
            description: `A human cannot perform ${message} per minute.`,
          }),
        );
      }

      return canRecord;
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Checking Activity Limits',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  /**
   * Records activity (steps and METs) with added validation
   * @param steps Number of steps to record
   * @param mets Number of METs to record
   * @returns True if recording is successful
   */
  const recordActivity = async (steps: number, mets: number): Promise<boolean> => {
    try {
      if (!address) {
        dispatch(
          showErrorToast({
            title: 'Wallet Not Connected',
            description: 'Please connect your wallet to record activity.',
          }),
        );
        return false;
      }

      const canRecord = await canRecordActivity(steps, mets);
      if (!canRecord) {
        return false;
      }

      const recordActivityHook = movinEarn.useRecordActivity();
      return await recordActivityHook.recordActivity(steps, mets);
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Recording Activity',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  /**
   * Checks if activity was updated within the last minute
   * @returns True if activity was updated within the last minute
   */
  const wasActivityUpdatedWithinLastMinute = async (): Promise<boolean> => {
    try {
      const activityResult = movinEarn.useUserActivity();
      const activity = activityResult.formattedActivity();

      const lastUpdated = activity.lastUpdated || 0;
      const now = Math.floor(Date.now() / 1000);

      return lastUpdated > 0 && now - lastUpdated < 60;
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Checking Activity Update',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  /**
   * Checks if activity was updated within the last minute with a timeout
   * @returns Promise that resolves to true if activity was updated within last minute
   */
  const wasActivityUpdatedWithinLastMinuteTimeout = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const wasUpdated = await wasActivityUpdatedWithinLastMinute();
        resolve(wasUpdated);
      }, 60000); // 1 minute timeout
    });
  };

  /**
   * Gets estimated rewards for new steps and METs
   * @param newSteps Number of new steps
   * @param newMets Number of new METs
   * @returns Estimated rewards as a string
   */
  const getEstimatedRewards = async (newSteps: number, newMets: number): Promise<string> => {
    try {
      const rewardsResult = movinEarn.useCalculateActivityRewards(newSteps, newMets);
      const rewards = rewardsResult.formattedRewards();

      const totalRewards = rewards.stepsRewards + rewards.metsRewards;
      return formatDecimal(totalRewards);
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Calculating Rewards',
          description: parsedError.message,
        }),
      );
      return '0';
    }
  };

  /**
   * Calculates new steps and METs based on health data and saved activity
   * @param healthData Current health data
   * @param savedActivity Saved health data
   * @param rewardsInfo Current rewards info
   * @returns New steps and METs
   */
  const calculateNewStepsAndMets = (
    healthData: HealthData | null,
    savedActivity: HealthData | null,
    rewardsInfo: RewardsInfo,
  ): {
    newSteps: number;
    newMets: number;
  } => {
    if (!rewardsInfo) {
      return { newSteps: 0, newMets: 0 };
    }

    const blockchainSteps = rewardsInfo?.steps || 0;
    const blockchainMets = rewardsInfo?.mets || 0;
    const steps = healthData?.steps || savedActivity?.steps || 0;
    const mets = healthData?.mets || savedActivity?.mets || 0;

    let newSteps = 0;
    let newMets = 0;

    if (steps > 0 || mets > 0) {
      if (steps >= blockchainSteps) {
        newSteps = steps - blockchainSteps;
      }

      // Only calculate METs if the user has premium status
      if (rewardsInfo.isPremium) {
        if (mets >= blockchainMets) {
          newMets = mets - blockchainMets;
        }
      }
    }

    return { newSteps, newMets };
  };

  /**
   * Stakes tokens with automatic allowance checking
   * @param amount Amount to stake in ether
   * @param lockMonths Lock period in months
   * @returns True if staking is successful
   */
  const stakeTokens = async (amount: string, lockMonths: number): Promise<boolean> => {
    try {
      // First check and approve allowance if needed
      const allowanceApproved = await checkAndApproveTokenAllowance(amount);
      if (!allowanceApproved) {
        dispatch(
          showErrorToast({
            title: 'Allowance Approval Failed',
            description: 'Failed to approve token allowance for staking.',
          }),
        );
        return false;
      }

      // Now proceed with staking
      const stakeTokensHook = movinEarn.useStakeTokens();
      return await stakeTokensHook.stakeTokens(amount, lockMonths);
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Staking Tokens',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  /**
   * Sets premium status with automatic allowance checking
   * @param status The premium status to set
   * @param amount The amount to pay for premium
   * @returns True if setting premium status is successful
   */
  const setPremiumStatus = async (status: boolean, amount: string): Promise<boolean> => {
    try {
      // Check and approve allowance if needed
      if (status && parseFloat(amount) > 0) {
        const allowanceApproved = await checkAndApproveTokenAllowance(amount);
        if (!allowanceApproved) {
          dispatch(
            showErrorToast({
              title: 'Allowance Approval Failed',
              description: 'Failed to approve token allowance for premium status.',
            }),
          );
          return false;
        }
      }

      // Set premium status
      const setPremiumStatusHook = movinEarn.useSetPremiumStatus();
      return await setPremiumStatusHook.setPremiumStatus(status, amount);
    } catch (error) {
      const parsedError = parseError(error);
      dispatch(
        showErrorToast({
          title: 'Error Setting Premium Status',
          description: parsedError.message,
        }),
      );
      return false;
    }
  };

  return {
    // Data retrieval functions
    getRewardsInfo,
    getUserStaking,
    getEstimatedRewards,
    wasActivityUpdatedWithinLastMinute,
    wasActivityUpdatedWithinLastMinuteTimeout,

    // Activity and health related functions
    canRecordActivity,
    recordActivity,
    calculateNewStepsAndMets,

    // Token and staking functions
    checkIfTokenApprovalIsNeeded,
    checkAndApproveTokenAllowance,
    stakeTokens,
    setPremiumStatus,

    // Pass-through to direct contract calls
    movinEarn,
  };
}
