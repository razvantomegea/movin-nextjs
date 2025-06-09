import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  title?: string;
  description?: string;
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  featureName = 'Energy Tracking',
  title = 'Premium Feature',
  description = 'This feature is available for premium subscribers only.',
}: PremiumUpgradeModalProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleUpgrade = () => {
    onClose();
    router.push('/dashboard/subscription');
  };

  const premiumFeatures = [
    'AI-powered meal detection & calorie tracking',
    'Advanced energy & nutrition analytics',
    'MET tracking and fitness metrics',
    'Ad-free experience',
    '24% APY staking for 2 years',
    'Exclusive premium features (coming soon)',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`relative w-full max-w-md rounded-xl overflow-hidden shadow-xl ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 p-6 text-white">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{title}</h2>
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium Only
                  </Badge>
                </div>
              </div>

              <p className="text-blue-100">{description}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-500" />
                  Unlock {featureName} with Premium:
                </h3>
                <ul className="space-y-2">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="bg-green-500/10 p-1 rounded-full mr-2 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Button onClick={handleUpgrade} className="w-full bg-blue-500 hover:bg-blue-600">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Maybe Later
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Starting from 100 MVN/month • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
