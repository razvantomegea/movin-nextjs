import { IPremiumStatus } from '@/lib/hooks/useMovinEarn';

export type PlanType = 'free' | 'monthly' | 'yearly';

export interface PendingTransaction {
  planType: PlanType;
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
export function getCurrentPlan(premiumStatus: IPremiumStatus): PlanType {
  if (!premiumStatus.status || isPremiumExpired(premiumStatus)) {
    return 'free';
  }

  // Calculate months until expiry to determine if it's monthly or yearly
  const now = new Date();
  const expiry = new Date(premiumStatus.expiration * 1000);
  const monthsUntilExpiry = Math.round(
    (expiry.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000),
  );

  return monthsUntilExpiry >= 11 ? 'yearly' : 'monthly';
}

/**
 * Check if a plan is the current active plan
 */
export function isPlanCurrent(plan: PlanType, currentPlan: PlanType): boolean {
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

  if (planType === 'free') {
    return {
      description: 'Cancel Premium Subscription',
      amount: 0,
    };
  } else {
    const planName = planType === 'monthly' ? 'Monthly Premium' : 'Yearly Premium';
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
  planType: 'free' | 'premium',
  cycle: PlanType | undefined,
  currentPlan: PlanType,
  isUpgrading: boolean,
  pendingTransaction: PendingTransaction | null,
): string {
  if (planType === 'free') {
    if (isPlanCurrent('free', currentPlan)) {
      return 'Current Plan';
    }
    if (isUpgrading || pendingTransaction) {
      return 'Processing...';
    }
    return 'Downgrade to Free';
  } else {
    const targetPlan = cycle || 'yearly';
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
export function getPlanConfig(planType: PlanType) {
  const plans = {
    free: {
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
    monthly: {
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
    yearly: {
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
      discount: 'Save 16%',
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
