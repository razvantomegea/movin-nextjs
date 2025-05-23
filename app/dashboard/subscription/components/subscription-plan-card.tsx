'use client';

import { useCallback, useMemo } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlanTypeEnum } from '@/utils/subscription';
import { useSubscription } from '../hooks/useSubscription';

interface IPlanCardProps {
  planType: PlanTypeEnum;
  isRecommended?: boolean;
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

export function SubscriptionPlanCard({ planType, isRecommended = false }: IPlanCardProps) {
  const { isUpgrading, pendingTransaction, handlePlanAction, handleUpgrade, isPlanCurrent } =
    useSubscription();

  const isLoading = isUpgrading || !!pendingTransaction;
  const isCurrentPlan = isPlanCurrent(planType);
  const isFree = planType === PlanTypeEnum.FREE;

  // Get plan configuration
  const planConfig = getPlanConfig(planType);
  const { title, subtitle, price, period, features } = planConfig;
  // Handle discount safely
  const discount = 'discount' in planConfig ? planConfig.discount : undefined;

  // Get button text
  const buttonText = useMemo(() => {
    if (isPlanCurrent(planType)) {
      return 'Current Plan';
    }

    if (isUpgrading || pendingTransaction) {
      return 'Processing...';
    }

    if (planType === PlanTypeEnum.FREE) {
      return 'Downgrade to Free';
    }

    return 'Upgrade to Premium';
  }, [planType, isUpgrading, pendingTransaction, isPlanCurrent]);

  const onButtonClick = useCallback(() => {
    if (isFree) {
      handlePlanAction(planType);
    } else {
      handleUpgrade(planType);
    }
  }, [isFree, planType, handlePlanAction, handleUpgrade]);

  return (
    <Card
      className={`relative overflow-hidden ${
        isRecommended ? 'border-blue-500 dark:border-blue-400 shadow-lg' : ''
      } ${
        isCurrentPlan
          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
          : ''
      }`}
    >
      {isRecommended && !isCurrentPlan && (
        <div className="absolute top-0 right-0">
          <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl">
            RECOMMENDED
          </div>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 right-0">
          <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl flex items-center">
            <Check className="h-3 w-3 mr-1" />
            CURRENT
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center">
          {title === 'Premium' && <Crown className="h-5 w-5 text-blue-500 mr-2" />}
          {title}
          {isCurrentPlan && <Check className="h-5 w-5 text-green-500 ml-2" />}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-bold">{price} MVN</span>
          <span className="text-gray-500 dark:text-gray-400">/{period}</span>
          {discount && <Badge className="ml-2 bg-green-500">{discount}</Badge>}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${
            isCurrentPlan ? 'bg-green-600 hover:bg-green-700 cursor-default' : ''
          }`}
          onClick={onButtonClick}
          disabled={isLoading || isCurrentPlan}
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          ) : (
            buttonText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
