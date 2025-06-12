import { useAppKitAccount } from '@reown/appkit/react';
import { parseUnits } from 'viem';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { mapError } from '@/utils/errors';
import { useMovinEarn, ISignatureRequest, ISignatureResponse } from './useMovinEarn';
import { useMovinToken } from './useMovinToken';

export function useMovinEarnUtils() {
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const {
    getContractAddress,
    useUserActivity,
    getMaxStepsPerMinute,
    getMaxMetsPerMinute,
    useNonce,
  } = useMovinEarn();
  const { useTokenAllowance, useTokenDecimals } = useMovinToken();

  /**
   * Checks if token approval is needed for the specified amount
   * @param amount The amount to check approval for
   * @returns True if approval is needed, false otherwise
   */
  const useCheckIfTokenApprovalIsNeeded = () => {
    const earnAddress = getContractAddress();
    const allowanceHook = useTokenAllowance(earnAddress, addressLower);
    const allowanceData = allowanceHook.data;

    const decimalsHook = useTokenDecimals();
    const decimalsData = decimalsHook.data;

    return (amount: string): boolean => {
      if (!allowanceData || decimalsData === undefined) {
        return true;
      }

      const currentAllowance = allowanceData as bigint;
      const requiredAmount = parseUnits(amount, decimalsData);

      return currentAllowance < requiredAmount;
    };
  };

  /**
   * Checks if activity can be recorded based on rate limits
   * @param steps Number of steps to record
   * @param mets Number of METs to record
   * @returns True if activity can be recorded, false otherwise
   */
  const useCanRecordActivity = (steps: number, mets: number): boolean => {
    const { formattedActivity } = useUserActivity();

    try {
      if (steps === 0 && mets === 0) {
        return false;
      }

      const maxStepsPerMinute = getMaxStepsPerMinute();
      const maxMetsPerMinute = getMaxMetsPerMinute();
      const activityData = formattedActivity();

      if (activityData?.dailySteps === 0 && activityData?.dailyMets === 0) {
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
      const errorMessage = mapError(error);
      dispatch(
        showErrorToast({
          title: 'Error Checking Activity Limits',
          description: errorMessage,
        }),
      );
      return false;
    }
  };

  /**
   * Validates that a signature request has all required parameters
   * @param request The signature request to validate
   * @returns True if valid, false otherwise
   */
  const validateSignatureRequest = (request: ISignatureRequest): boolean => {
    if (!request.caller || !request.selector || request.nonce === undefined || !request.deadline) {
      return false;
    }

    // Check if deadline is in the future
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (request.deadline <= currentTimestamp) {
      return false;
    }

    // Check if deadline is not too far in the future (max 24 hours)
    const maxDeadline = currentTimestamp + 86400;
    if (request.deadline > maxDeadline) {
      return false;
    }

    return true;
  };

  /**
   * Checks if user can perform signature-based transactions
   * @returns True if user can perform transactions, false otherwise
   */
  const useCanPerformSignedTransactions = (): boolean => {
    const { data: nonce } = useNonce();

    if (!addressLower || nonce === undefined) {
      return false;
    }

    return true;
  };

  /**
   * Gets current nonce for signature-based transactions
   * @returns Current nonce or null if not available
   */
  const useCurrentNonce = (): number | null => {
    const { data: nonce } = useNonce();

    if (nonce === undefined) {
      return null;
    }

    return Number(nonce);
  };

  /**
   * Validates activity input based on contract limits
   * @param steps Number of steps
   * @param mets Number of METs
   * @returns Validation result with errors if any
   */
  const validateActivityInput = (
    steps: number,
    mets: number,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check basic requirements
    if (steps < 0 || mets < 0) {
      errors.push('Steps and METs cannot be negative');
    }

    if (steps === 0 && mets === 0) {
      errors.push('At least one of steps or METs must be greater than 0');
    }

    // Check daily limits from ABI constants
    const MAX_DAILY_STEPS = 30000;
    const MAX_DAILY_METS = 500;

    if (steps > MAX_DAILY_STEPS) {
      errors.push(`Steps cannot exceed ${MAX_DAILY_STEPS} per day`);
    }

    if (mets > MAX_DAILY_METS) {
      errors.push(`METs cannot exceed ${MAX_DAILY_METS} per day`);
    }

    // Check per-minute limits
    const maxStepsPerMinute = getMaxStepsPerMinute();
    const maxMetsPerMinute = getMaxMetsPerMinute();

    if (steps > maxStepsPerMinute) {
      errors.push(`Steps cannot exceed ${maxStepsPerMinute} per minute`);
    }

    if (mets > maxMetsPerMinute) {
      errors.push(`METs cannot exceed ${maxMetsPerMinute} per minute`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    useCheckIfTokenApprovalIsNeeded,
    useCanRecordActivity,
    validateSignatureRequest,
    useCanPerformSignedTransactions,
    useCurrentNonce,
    validateActivityInput,
  };
}
