'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Crown, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchSubscriptionStatus, upgradeToPremium } from '@/lib/redux/slices/subscriptionSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { SubscriptionPageSkeleton } from './subscription-page-skeleton';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function SubscriptionPage() {
  const dispatch = useAppDispatch();
  const { isPremium, currentPlan, expiryDate, isLoading, error } = useAppSelector(
    (state) => state.subscription,
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await dispatch(upgradeToPremium(billingCycle)).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Subscription Upgraded',
          description: `You are now a Premium member! Enjoy all the benefits.`,
        }),
      );
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Upgrade Failed',
          description: (error as string) || 'Please try again later',
        }),
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading && !isPremium) {
    return <SubscriptionPageSkeleton />;
  }

  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <motion.div className="mb-6" variants={item}>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose the plan that works for you</p>
      </motion.div>

      {error && (
        <motion.div variants={item} className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {isPremium && (
        <motion.div variants={item} className="mb-6">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Crown className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700 dark:text-blue-300">
              Premium Subscription Active
            </AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              Your premium subscription is active until {formatDate(expiryDate)}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={item} className="mb-6">
        <Tabs
          defaultValue="yearly"
          onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
        >
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly <Badge className="ml-2 bg-green-500">Save 16%</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlanCard
                title="Free"
                subtitle="Basic"
                price="0"
                period="forever"
                features={[
                  'Basic step tracking',
                  'Earn MVN tokens for activity',
                  'Staking up to 12 months',
                  'Referral program (1% rewards)',
                  'Import from Apple Health & Google Fit',
                  'Contains ads',
                ]}
                buttonText="Get Started"
                onButtonClick={() => {}}
                isCurrentPlan={currentPlan === 'free'}
                isLoading={isLoading}
              />

              <PlanCard
                title="Premium"
                subtitle="Advanced"
                price="100"
                period="month"
                features={[
                  'Everything in Free plan',
                  'MET tracking and advanced fitness metrics',
                  'Ad-free experience',
                  '24% APY staking for 2 years',
                  'Access to maps & route tracking (soon)',
                  'Friend sync for joint exercises (soon)',
                  'AI based calorie tracking (soon)',
                ]}
                buttonText={isPremium ? 'Current Plan' : 'Upgrade Now'}
                onButtonClick={handleUpgrade}
                isCurrentPlan={currentPlan === 'premium'}
                isLoading={isUpgrading}
                isRecommended={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlanCard
                title="Free"
                subtitle="Basic"
                price="0"
                period="forever"
                features={[
                  'Basic step tracking',
                  'Earn MVN tokens for activity',
                  'Staking up to 12 months',
                  'Referral program (1% rewards)',
                  'Import from Apple Health & Google Fit',
                  'Contains ads',
                ]}
                buttonText="Get Started"
                onButtonClick={() => {}}
                isCurrentPlan={currentPlan === 'free'}
                isLoading={isLoading}
              />

              <PlanCard
                title="Premium"
                subtitle="Advanced"
                price="1000"
                period="year"
                features={[
                  'Everything in Free plan',
                  'MET tracking and advanced fitness metrics',
                  'Ad-free experience',
                  '24% APY staking for 2 years',
                  'Access to maps & route tracking (soon)',
                  'Friend sync for joint exercises (soon)',
                  'AI based calorie tracking (soon)',
                ]}
                buttonText={isPremium ? 'Current Plan' : 'Upgrade Now'}
                onButtonClick={handleUpgrade}
                isCurrentPlan={currentPlan === 'premium'}
                isLoading={isUpgrading}
                isRecommended={true}
                discount="Save 16%"
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div variants={item} className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How do I cancel my subscription?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can cancel your subscription at any time from your account settings. Your
                premium features will remain active until the end of your billing period.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Can I switch between monthly and yearly billing?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Yes, you can switch between monthly and yearly billing at any time. If you switch
                from monthly to yearly, you&apos;ll be charged the yearly rate and your subscription
                will be extended accordingly.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We accept MVN tokens as payment for premium subscriptions. You can use tokens earned
                through activity or purchase them directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface PlanCardProps {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  onButtonClick: () => void;
  isCurrentPlan: boolean;
  isLoading: boolean;
  isRecommended?: boolean;
  discount?: string;
}

function PlanCard({
  title,
  subtitle,
  price,
  period,
  features,
  buttonText,
  onButtonClick,
  isCurrentPlan,
  isLoading,
  isRecommended = false,
  discount,
}: PlanCardProps) {
  return (
    <Card
      className={`relative overflow-hidden ${
        isRecommended ? 'border-blue-500 dark:border-blue-400 shadow-lg' : ''
      }`}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0">
          <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl">
            RECOMMENDED
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center">
          {title === 'Premium' && <Crown className="h-5 w-5 text-blue-500 mr-2" />}
          {title}
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
          className={`w-full ${isCurrentPlan ? 'bg-green-600 hover:bg-green-700' : ''}`}
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
              Current Plan
            </>
          ) : (
            buttonText
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
