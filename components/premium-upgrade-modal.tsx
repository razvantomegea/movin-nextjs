import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
            className={`relative w-full max-w-md rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-900 dark:text-white`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 dark:from-blue-800 dark:via-purple-900 dark:to-blue-900 p-6 text-white">
              <div className="flex items-start mb-4">
                <div className="bg-white/20 dark:bg-white/10 p-2 rounded-full mr-3">
                  <Crown className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 dark:bg-yellow-300 dark:text-yellow-900">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium Only
                  </Badge>
                </div>
                {/* Move close button to the right, vertically centered with the icon/title */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="ml-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-full self-start"
                  style={{ marginTop: '-0.25rem' }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-blue-100 dark:text-blue-200">{description}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-100">
                  <Zap className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                  Unlock {featureName} with Premium:
                </h3>
                <ul className="space-y-2">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="bg-green-500/10 dark:bg-green-400/10 p-1 rounded-full mr-2 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleUpgrade}
                  className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full dark:border-gray-700 dark:text-white"
                >
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
