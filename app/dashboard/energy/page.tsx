'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumUpgradeModal } from '@/components/premium-upgrade-modal';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { EnergyPage } from './components/energy-page';

export default function Energy() {
  const router = useRouter();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive, isLoading } = usePremiumStatus();
  const isPremium = isPremiumActive();

  useEffect(() => {
    if (!isLoading) {
      if (!isPremium) {
        // Show premium upgrade modal for non-premium users
        setShowPremiumModal(true);
      }
    }
  }, [isPremium, isLoading]);

  const handleModalClose = () => {
    setShowPremiumModal(false);
    // Redirect to dashboard when modal is closed
    router.push('/dashboard');
  };

  // If still loading premium status, show nothing (or loading state)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If premium user, show the energy page
  if (isPremium) {
    return <EnergyPage />;
  }

  // For non-premium users, show modal and redirect
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Energy</h1>
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>

      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={handleModalClose}
        featureName="Energy Tracking"
        title="Energy Tracking - Premium Feature"
        description="Track your meals, calories, and nutrition with AI-powered meal detection. Get detailed insights into your energy consumption and macronutrients."
      />
    </>
  );
}
