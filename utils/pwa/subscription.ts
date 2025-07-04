import { IPremiumStatus } from '@/lib/hooks/useMovinEarn';

export enum PlanTypeEnum {
  FREE = 'free',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export const MONTHLY_SUBSCRIPTION_AMOUNT = '100';
export const YEARLY_SUBSCRIPTION_AMOUNT = '1000';

export interface PendingTransaction {
  planType: PlanTypeEnum;
  amount: string;
  isUpgrade: boolean;
}

export interface TransactionDetails {
  description: string;
  amount: number;
}

/**
 * Check if premium subscription is expired
 */
export function isPremiumExpired(premiumStatus: IPremiumStatus): boolean {
  return premiumStatus.status && premiumStatus.expiration
    ? premiumStatus.expiration < Math.floor(Date.now() / 1000)
    : false;
}

/**
 * Determine current plan based on premium status and expiration
 */
export function getCurrentPlan(premiumStatus: IPremiumStatus): PlanTypeEnum {
  if (!premiumStatus.status || isPremiumExpired(premiumStatus)) {
    return PlanTypeEnum.FREE;
  }

  // Calculate months until expiry to determine if it's monthly or yearly
  const now = new Date();
  const expiry = new Date(premiumStatus.expiration * 1000);
  const monthsUntilExpiry = Math.round(
    (expiry.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000),
  );

  return monthsUntilExpiry >= 11 ? PlanTypeEnum.YEARLY : PlanTypeEnum.MONTHLY;
}

/**
 * Check if a plan is the current active plan
 */
export function isPlanCurrent(plan: PlanTypeEnum, currentPlan: PlanTypeEnum): boolean {
  return currentPlan === plan;
}

/**
 * Get transaction details for the modal
 */
export function getTransactionDetails(
  pendingTransaction: PendingTransaction | null,
): TransactionDetails {
  if (!pendingTransaction) return { description: '', amount: 0 };

  const { planType, amount, isUpgrade } = pendingTransaction;

  if (planType === PlanTypeEnum.FREE) {
    return {
      description: 'Cancel Premium Subscription',
      amount: 0,
    };
  } else {
    const planName = planType === PlanTypeEnum.MONTHLY ? 'Monthly Premium' : 'Yearly Premium';
    const mvnAmount = parseFloat(amount);
    return {
      description: `${isUpgrade ? 'Upgrade to' : 'Switch to'} ${planName}`,
      amount: mvnAmount,
    };
  }
}

/**
 * Format timestamp to readable date
 */
export function formatSubscriptionDate(timestamp: number | null): string {
  if (!timestamp || timestamp === 0) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
