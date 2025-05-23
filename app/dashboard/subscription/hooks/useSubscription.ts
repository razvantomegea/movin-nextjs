import { useState, useEffect } from 'react';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import {
  PlanType,
  PendingTransaction,
  getCurrentPlan,
  isPremiumExpired,
  isPlanCurrent,
} from '@/utils/subscription';

export function useSubscription() {
  const dispatch = useAppDispatch();
  const { usePremiumStatus, useSetPremiumStatus } = useMovinEarn();

  // Get premium status from contract
  const {
    formattedPremiumStatus,
    isLoading: premiumLoading,
    error: premiumError,
    refetch: refetchPremiumStatus,
  } = usePremiumStatus();
  const premiumStatus = formattedPremiumStatus();

  // Set premium status hook
  const {
    setPremiumStatus,
    isPending: isUpgrading,
    isSuccess: upgradeSuccess,
    error: upgradeError,
  } = useSetPremiumStatus();

  // Local state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);

  // Computed values
  const isExpired = isPremiumExpired(premiumStatus);
  const currentPlan = getCurrentPlan(premiumStatus);
  const isPremium = premiumStatus.status && !isExpired;

  // Set default billing cycle based on current plan when premium status loads
  useEffect(() => {
    if (!premiumLoading && premiumStatus) {
      if (currentPlan === 'yearly') {
        setBillingCycle('yearly');
      } else if (currentPlan === 'monthly') {
        setBillingCycle('monthly');
      }
    }
  }, [premiumLoading, premiumStatus, currentPlan]);

  // Handle successful upgrade
  useEffect(() => {
    if (upgradeSuccess && isModalOpen && pendingTransaction) {
      setIsModalOpen(false);

      const actionDescription =
        pendingTransaction.planType === 'free'
          ? 'Premium subscription cancelled successfully.'
          : `Successfully upgraded to ${pendingTransaction.planType} premium!`;

      dispatch(
        showSuccessToast({
          title: 'Subscription Updated',
          description: actionDescription,
        }),
      );

      setPendingTransaction(null);
      refetchPremiumStatus();
    }
  }, [upgradeSuccess, isModalOpen, pendingTransaction, dispatch, refetchPremiumStatus]);

  // Handle upgrade errors
  useEffect(() => {
    if (upgradeError && isModalOpen && pendingTransaction) {
      setIsModalOpen(false);
      setPendingTransaction(null);

      dispatch(
        showErrorToast({
          title: 'Update Failed',
          description: 'Subscription update failed. Please try again.',
        }),
      );
    }
  }, [upgradeError, isModalOpen, pendingTransaction, dispatch]);

  // Action handlers
  const handlePlanAction = async (planType: PlanType) => {
    // Don't allow selecting the current plan
    if (isPlanCurrent(planType, currentPlan)) {
      return;
    }

    let amount = '0';
    let isUpgrade = true;

    if (planType === 'monthly') {
      amount = '100';
    } else if (planType === 'yearly') {
      amount = '1000';
    } else {
      // Free plan - downgrade
      isUpgrade = false;
    }

    try {
      // Set pending transaction and show modal
      setPendingTransaction({ planType, amount, isUpgrade });
      setIsModalOpen(true);

      // Execute the transaction immediately
      await setPremiumStatus(isUpgrade, amount);
    } catch (error) {
      // If transaction fails, close modal and show error
      setIsModalOpen(false);
      setPendingTransaction(null);
      dispatch(
        showErrorToast({
          title: 'Transaction Failed',
          description: 'Failed to update subscription. Please try again.',
        }),
      );
    }
  };

  const handleUpgrade = async (planType: PlanType) => {
    await handlePlanAction(planType);
  };

  const handleTransactionSuccess = async () => {
    setIsModalOpen(false);
    setPendingTransaction(null);
    // Success message and refetch will be handled by useEffect
  };

  const handleTransactionFail = () => {
    setIsModalOpen(false);
    setPendingTransaction(null);
    dispatch(
      showErrorToast({
        title: 'Transaction Not Received',
        description: 'Please try again if the transaction was not completed.',
      }),
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPendingTransaction(null);
  };

  return {
    // State
    premiumStatus,
    premiumLoading,
    premiumError,
    billingCycle,
    setBillingCycle,
    isModalOpen,
    pendingTransaction,
    isUpgrading,

    // Computed values
    isExpired,
    currentPlan,
    isPremium,

    // Action handlers
    handlePlanAction,
    handleUpgrade,
    handleTransactionSuccess,
    handleTransactionFail,
    handleModalClose,

    // Utilities
    isPlanCurrent: (plan: PlanType) => isPlanCurrent(plan, currentPlan),
  };
}
