import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useMovinEarnUtils } from '@/lib/hooks/useMovinEarnUtils';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch } from '@/lib/redux/hooks';
import { updateProfile } from '@/lib/redux/slices/profileSlice';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import {
  PlanTypeEnum,
  PendingTransaction,
  getCurrentPlan,
  isPremiumExpired,
  isPlanCurrent,
} from '@/utils/subscription';
import { MONTHLY_SUBSCRIPTION_AMOUNT, YEARLY_SUBSCRIPTION_AMOUNT } from '@/utils/subscription';

export function useSubscription() {
  const dispatch = useAppDispatch();
  const { usePremiumStatus, useSetPremiumStatus } = useMovinEarn();
  const { useTokenSymbol, useApproveTokens } = useMovinToken();
  const { useCheckIfTokenApprovalIsNeeded } = useMovinEarnUtils();
  const { data: tokenSymbol } = useTokenSymbol();

  // Get premium status from contract
  const {
    formattedPremiumStatus,
    isPremiumActive,
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

  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const { approveTokens } = useApproveTokens();
  const { getContractAddress } = useMovinEarn();

  // Local state
  const [billingCycle, setBillingCycle] = useState<PlanTypeEnum>(PlanTypeEnum.YEARLY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);
  const [isApprovalNeeded, setIsApprovalNeeded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const checkApproval = useCheckIfTokenApprovalIsNeeded();

  // Computed values
  const isExpired = isPremiumExpired(premiumStatus);
  const currentPlan = getCurrentPlan(premiumStatus);
  const isPremium = isPremiumActive();

  // Set default billing cycle based on current plan when premium status loads
  useEffect(() => {
    if (!premiumLoading && premiumStatus) {
      if (currentPlan === PlanTypeEnum.YEARLY) {
        setBillingCycle(PlanTypeEnum.YEARLY);
      } else if (currentPlan === PlanTypeEnum.MONTHLY) {
        setBillingCycle(PlanTypeEnum.MONTHLY);
      }
    }
  }, [premiumLoading, premiumStatus, currentPlan]);

  // Handle successful upgrade
  useEffect(() => {
    if (upgradeSuccess && pendingTransaction) {
      setIsModalOpen(false);

      const actionDescription =
        pendingTransaction.planType === PlanTypeEnum.FREE
          ? 'Premium subscription cancelled successfully.'
          : `Successfully upgraded to ${pendingTransaction.planType} premium!`;

      dispatch(
        showSuccessToast({
          title: 'Subscription Updated',
          description: actionDescription,
        }),
      );

      if (addressLower) {
        dispatch(
          updateProfile({
            address: addressLower,
            profileData: { is_premium: pendingTransaction.planType !== PlanTypeEnum.FREE },
          }),
        ).unwrap();
      }

      setPendingTransaction(null);
      refetchPremiumStatus();
    }
  }, [upgradeSuccess, pendingTransaction, dispatch, addressLower, refetchPremiumStatus]);

  // Handle upgrade errors
  useEffect(() => {
    if (upgradeError && pendingTransaction) {
      setIsModalOpen(false);
      setPendingTransaction(null);

      dispatch(
        showErrorToast({
          title: 'Update Failed',
          description: 'Subscription update failed. Please try again.',
        }),
      );
    }
  }, [upgradeError, pendingTransaction, dispatch]);

  // Handle approval confirmation
  const handleApprovalSuccess = async () => {
    if (!pendingTransaction) {
      setIsApprovalModalOpen(false);
      return;
    }

    if (!addressLower) {
      setIsApprovalModalOpen(false);
      dispatch(
        showErrorToast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to continue.',
        }),
      );
      return;
    }

    try {
      setIsProcessing(true);
      const earnAddress = getContractAddress();
      const approvalSuccess = await approveTokens(earnAddress, pendingTransaction.amount);

      if (approvalSuccess) {
        dispatch(
          showSuccessToast({
            title: 'Approval Successful',
            description: `You have successfully approved ${tokenSymbol} for subscription.`,
          }),
        );

        setIsApprovalNeeded(false);
        setIsApprovalModalOpen(false);

        // Show the subscription transaction modal after approval
        setIsModalOpen(true);
      } else {
        throw new Error('Approval failed');
      }
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Approval Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle approval failure
  const handleApprovalFail = () => {
    setIsApprovalModalOpen(false);
    setPendingTransaction(null);

    dispatch(
      showErrorToast({
        title: 'Approval Not Received',
        description: 'Token approval not received. Please try again.',
      }),
    );
  };

  // Handle approval modal close
  const handleApprovalModalClose = () => {
    setIsApprovalModalOpen(false);
    setPendingTransaction(null);
  };

  // Action handlers
  const handlePlanAction = async (planType: PlanTypeEnum) => {
    // Don't allow selecting the current plan
    if (isPlanCurrent(planType, currentPlan)) {
      return;
    }

    let amount = '0';
    let isUpgrade = true;

    if (planType === PlanTypeEnum.MONTHLY) {
      amount = MONTHLY_SUBSCRIPTION_AMOUNT;
    } else if (planType === PlanTypeEnum.YEARLY) {
      amount = YEARLY_SUBSCRIPTION_AMOUNT;
    } else {
      // Free plan - downgrade
      isUpgrade = false;
    }

    try {
      setIsProcessing(true);
      // Set pending transaction
      setPendingTransaction({ planType, amount, isUpgrade });

      // Check if approval is needed for the amount
      if (isUpgrade) {
        const needsApproval = checkApproval(amount);

        if (needsApproval) {
          // Show approval modal first
          setIsApprovalModalOpen(true);
          return;
        }
      }

      // If no approval needed or downgrading, show transaction modal directly
      setIsModalOpen(true);
    } catch (error) {
      // If process fails, reset state and show error
      setIsApprovalModalOpen(false);
      setIsModalOpen(false);
      setPendingTransaction(null);

      dispatch(
        showErrorToast({
          title: 'Transaction Process Failed',
          description: 'Failed to process subscription. Please try again.',
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = async (planType: PlanTypeEnum) => {
    await handlePlanAction(planType);
  };

  const handleTransactionSuccess = async () => {
    if (!pendingTransaction) {
      setIsModalOpen(false);
      return;
    }

    try {
      setIsProcessing(true);

      // Execute the premium status update
      const success = await setPremiumStatus(
        pendingTransaction.isUpgrade,
        pendingTransaction.amount,
      );

      if (!success) {
        throw new Error('Premium status update failed');
      }
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Subscription Update Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
        }),
      );
    } finally {
      setIsProcessing(false);
      setIsModalOpen(false);
    }
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
    isApprovalModalOpen,
    pendingTransaction,
    isUpgrading,
    isProcessing,
    isApprovalNeeded,
    tokenSymbol,

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
    handleApprovalSuccess,
    handleApprovalFail,
    handleApprovalModalClose,

    // Utilities
    isPlanCurrent: (plan: PlanTypeEnum) => isPlanCurrent(plan, currentPlan),
  };
}
