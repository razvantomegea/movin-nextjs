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
 * Get button text based on plan type and current status
 */
export function getButtonText(
  planType: PlanTypeEnum,
  cycle: Exclude<PlanTypeEnum, PlanTypeEnum.FREE> | undefined,
  currentPlan: PlanTypeEnum,
  isUpgrading: boolean,
  pendingTransaction: PendingTransaction | null,
): string {
  if (planType === PlanTypeEnum.FREE) {
    if (isPlanCurrent(PlanTypeEnum.FREE, currentPlan)) {
      return 'Current Plan';
    }
    if (isUpgrading || pendingTransaction) {
      return 'Processing...';
    }
    return 'Downgrade to Free';
  } else {
    const targetPlan = cycle || PlanTypeEnum.YEARLY;
    if (isPlanCurrent(targetPlan, currentPlan)) {
      return 'Current Plan';
    }
    if (isUpgrading || pendingTransaction) {
      return 'Processing...';
    }
    return 'Upgrade to Premium';
  }
}

/**
 * Get plan configuration for rendering
 */
export function getPlanConfig(planType: PlanTypeEnum) {
  const plans = {
    [PlanTypeEnum.FREE]: {
      title: 'Free',
      subtitle: 'Basic',
      price: '0',
      period: 'forever',
      features: [
        'Basic step tracking',
        'Earn MVN tokens for activity',
        'Staking up to 12 months',
        'Referral program (1% rewards)',
        'Import from Apple Health & Google Fit',
        'Contains ads',
      ],
    },
    [PlanTypeEnum.MONTHLY]: {
      title: 'Premium',
      subtitle: 'Advanced',
      price: '100',
      period: 'month',
      features: [
        'Everything in Free plan',
        'MET tracking and advanced fitness metrics',
        'Ad-free experience',
        '24% APY staking for 2 years',
        'Access to maps & route tracking (soon)',
        'Friend sync for joint exercises (soon)',
        'AI based calorie tracking (soon)',
      ],
      isRecommended: true,
    },
    [PlanTypeEnum.YEARLY]: {
      title: 'Premium',
      subtitle: 'Advanced',
      price: '1000',
      period: 'year',
      features: [
        'Everything in Free plan',
        'MET tracking and advanced fitness metrics',
        'Ad-free experience',
        '24% APY staking for 2 years',
        'Access to maps & route tracking (soon)',
        'Friend sync for joint exercises (soon)',
        'AI based calorie tracking (soon)',
      ],
      isRecommended: true,
      discount: 'Save 17%',
    },
  };

  return plans[planType];
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
