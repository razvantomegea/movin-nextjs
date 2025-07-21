'use client';

import { useAppKitAccount } from '@reown/appkit/react';
import { parseUnits } from 'viem';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { mapError } from '@/utils/errors';
import { useMovinEarn } from './useMovinEarn';
import { useMovinToken } from './useMovinToken';

export function useMovinEarnUtils() {
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const { getContractAddress, useUserActivity, getMaxStepsPerMinute, getMaxMetsPerMinute } =
    useMovinEarn();
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

  return {
    useCheckIfTokenApprovalIsNeeded,
    useCanRecordActivity,
  };
}
