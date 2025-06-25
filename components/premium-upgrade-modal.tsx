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
  const isLight = theme !== 'dark';

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
              isLight
                ? 'bg-gray-900 text-white shadow-gray-900/20'
                : 'bg-white text-gray-900 shadow-gray-900/20'
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header with gradient background */}
            <div
              className={`relative p-6 text-white ${
                isLight
                  ? 'bg-gradient-to-br from-blue-800 via-purple-900 to-blue-900'
                  : 'bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600'
              }`}
            >
              <div className="flex items-start mb-4">
                <div className={`p-2 rounded-full mr-3 ${isLight ? 'bg-white/10' : 'bg-white/20'}`}>
                  <Crown className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  <Badge
                    className={`hover:opacity-90 ${
                      isLight ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-400 text-yellow-900'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium Only
                  </Badge>
                </div>
                {/* Move close button to the right, vertically centered with the icon/title */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className={`ml-2 text-white rounded-full self-start ${
                    isLight ? 'hover:bg-white/10' : 'hover:bg-white/20'
                  }`}
                  style={{ marginTop: '-0.25rem' }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className={`${isLight ? 'text-blue-200' : 'text-blue-100'}`}>{description}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3
                  className={`font-semibold mb-3 flex items-center ${
                    isLight ? 'text-gray-100' : 'text-gray-800'
                  }`}
                >
                  <Zap className={`h-4 w-4 mr-2 ${isLight ? 'text-blue-400' : 'text-blue-500'}`} />
                  Unlock {featureName} with Premium:
                </h3>
                <ul className="space-y-2">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div
                        className={`p-1 rounded-full mr-2 mt-0.5 ${
                          isLight ? 'bg-green-400/10' : 'bg-green-500/10'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLight ? 'bg-green-400' : 'bg-green-500'
                          }`}
                        ></div>
                      </div>
                      <span className={`${isLight ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleUpgrade}
                  className={`w-full ${
                    isLight
                      ? 'bg-blue-700 hover:bg-blue-800 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className={`w-full ${
                    isLight
                      ? 'border-gray-700 text-white hover:bg-gray-800'
                      : 'border-gray-300 bg-white text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Maybe Later
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className={`text-xs ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
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
