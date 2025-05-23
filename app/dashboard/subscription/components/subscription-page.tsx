'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Crown } from 'lucide-react';
import { TransactionConfirmationModal } from '@/components/transaction-confirmation-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getTransactionDetails,
  getButtonText,
  getPlanConfig,
  formatSubscriptionDate,
} from '@/utils/subscription';
import { SubscriptionPageSkeleton } from './subscription-page-skeleton';
import { SubscriptionPlanCard } from './subscription-plan-card';
import { useSubscription } from '../hooks/useSubscription';

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
  const {
    premiumLoading,
    premiumError,
    setBillingCycle,
    isModalOpen,
    pendingTransaction,
    isUpgrading,
    isExpired,
    currentPlan,
    isPremium,
    handlePlanAction,
    handleUpgrade,
    handleTransactionSuccess,
    handleTransactionFail,
    handleModalClose,
    isPlanCurrent,
    premiumStatus,
  } = useSubscription();

  if (premiumLoading) {
    return <SubscriptionPageSkeleton />;
  }

  const transactionDetails = getTransactionDetails(pendingTransaction);

  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <motion.div className="mb-6" variants={item}>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose the plan that works for you</p>
      </motion.div>

      {premiumError && (
        <motion.div variants={item} className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load subscription status. Please try refreshing the page.
            </AlertDescription>
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
              Your premium subscription is active until{' '}
              {formatSubscriptionDate(premiumStatus.expiration)}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {isExpired && (
        <motion.div variants={item} className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Premium Subscription Expired</AlertTitle>
            <AlertDescription>
              Your premium subscription expired on{' '}
              {formatSubscriptionDate(premiumStatus.expiration)}. Upgrade to continue enjoying
              premium features.
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
              <SubscriptionPlanCard
                {...getPlanConfig('free')}
                buttonText={getButtonText(
                  'free',
                  undefined,
                  currentPlan,
                  isUpgrading,
                  pendingTransaction,
                )}
                onButtonClick={() => handlePlanAction('free')}
                isCurrentPlan={isPlanCurrent('free')}
                isLoading={isUpgrading || !!pendingTransaction}
              />

              <SubscriptionPlanCard
                {...getPlanConfig('monthly')}
                buttonText={getButtonText(
                  'premium',
                  'monthly',
                  currentPlan,
                  isUpgrading,
                  pendingTransaction,
                )}
                onButtonClick={() => handleUpgrade('monthly')}
                isCurrentPlan={isPlanCurrent('monthly')}
                isLoading={isUpgrading || !!pendingTransaction}
              />
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubscriptionPlanCard
                {...getPlanConfig('free')}
                buttonText={getButtonText(
                  'free',
                  undefined,
                  currentPlan,
                  isUpgrading,
                  pendingTransaction,
                )}
                onButtonClick={() => handlePlanAction('free')}
                isCurrentPlan={isPlanCurrent('free')}
                isLoading={isUpgrading || !!pendingTransaction}
              />

              <SubscriptionPlanCard
                {...getPlanConfig('yearly')}
                buttonText={getButtonText(
                  'premium',
                  'yearly',
                  currentPlan,
                  isUpgrading,
                  pendingTransaction,
                )}
                onButtonClick={() => handleUpgrade('yearly')}
                isCurrentPlan={isPlanCurrent('yearly')}
                isLoading={isUpgrading || !!pendingTransaction}
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div variants={item} className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">How do I cancel my subscription?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can cancel your subscription at any time from your account settings. Your premium
              features will remain active until the end of your billing period.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Can I switch between monthly and yearly billing?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Yes, you can switch between monthly and yearly billing at any time. If you switch from
              monthly to yearly, you&apos;ll be charged the yearly rate and your subscription will
              be extended accordingly.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We accept MVN tokens as payment for premium subscriptions. You can use tokens earned
              through activity or purchase them directly.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleTransactionSuccess}
        onFail={handleTransactionFail}
        rewardAmount={transactionDetails.amount}
        transactionDescription={
          pendingTransaction?.planType === 'free'
            ? 'Please confirm the transaction in your wallet to cancel your premium subscription.'
            : `Please confirm the transaction in your wallet to upgrade to ${transactionDetails.description.toLowerCase()} for ${
                transactionDetails.amount
              } MVN.`
        }
      />
    </motion.div>
  );
}
