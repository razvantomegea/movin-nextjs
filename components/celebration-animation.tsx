'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Star, Check, Flame, Share2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { randomInRange } from '@/utils/randomInRange';

interface CelebrationAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  achievementType: 'steps' | 'workout' | 'streak' | 'level';
  achievementValue: string;
  achievementTitle: string;
  description?: string;
  rewardAmount?: string;
  rewardCurrency?: string;
  showReward?: boolean;
  onShare?: () => void;
  showShareButton?: boolean;
}

export function CelebrationAnimation({
  isOpen,
  onClose,
  achievementType,
  achievementValue,
  achievementTitle,
  description,
  rewardAmount = '0.5',
  rewardCurrency = 'MVN',
  showReward = true,
  onShare,
  showShareButton = false,
}: CelebrationAnimationProps) {
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (isOpen && !confettiTriggered) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        });
      }, 250);

      setConfettiTriggered(true);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen, confettiTriggered]);

  // Reset confetti triggered state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfettiTriggered(false);
      setIsSharing(false);
    }
  }, [isOpen]);

  // Auto close after 8 seconds (increased to give time for sharing)
  useEffect(() => {
    if (isOpen && !isSharing) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, isSharing]);

  const getIcon = () => {
    switch (achievementType) {
      case 'steps':
        return <Trophy className="h-10 w-10 text-yellow-400" />;
      case 'workout':
        return <Award className="h-10 w-10 text-purple-400" />;
      case 'streak':
        return <Flame className="h-10 w-10 text-orange-400" />;
      case 'level':
        return <Star className="h-10 w-10 text-blue-400" />;
      default:
        return <Check className="h-10 w-10 text-green-400" />;
    }
  };

  const handleShare = async () => {
    if (onShare) {
      setIsSharing(true);
      try {
        await onShare();
        // Don't close automatically, let the share callback handle it
      } catch (error) {
        console.error('Failed to share achievement:', error);
        setIsSharing(false);
      }
    }
  };

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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`relative rounded-2xl p-6 shadow-xl max-w-md w-full overflow-hidden ${
              isDark
                ? 'bg-gradient-to-b from-gray-900 to-gray-800 border border-blue-500/20'
                : 'bg-gradient-to-b from-white to-gray-100 border border-blue-500/20'
            }`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Glowing background effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -inset-1 bg-blue-500/10 blur-xl rounded-full"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="mb-4 bg-blue-500/10 p-4 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
                >
                  {getIcon()}
                </motion.div>

                <motion.div
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3
                    className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}
                  >
                    Goal Achieved!
                  </h3>
                  <div className="text-3xl font-bold text-blue-500 mb-2">{achievementValue}</div>
                  <h2
                    className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}
                  >
                    {achievementTitle}
                  </h2>
                  {description && (
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                      {description}
                    </p>
                  )}
                </motion.div>

                {showReward && (
                  <motion.div
                    className="mt-6 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Flame className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-500">
                          +{rewardAmount} {rewardCurrency}
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Reward Added
                      </span>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  className="mt-6 flex gap-3 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {showShareButton && onShare && (
                    <Button
                      variant="outline"
                      className="flex-1 py-2 bg-transparent border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={handleShare}
                      disabled={isSharing}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isSharing ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Share2 className="h-4 w-4 mr-2" />
                      )}
                      {isSharing ? 'Sharing...' : 'Share Achievement'}
                    </Button>
                  )}
                  <Button
                    className={`${
                      showShareButton && onShare ? 'flex-1' : 'w-full'
                    } py-2 bg-blue-500 hover:bg-blue-600 text-white`}
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Awesome!
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Animated stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    scale: Math.random() * 0.5 + 0.5,
                    opacity: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: Math.random() * 2 + 1,
                    delay: Math.random() * 2,
                  }}
                >
                  <Star className="h-3 w-3 text-yellow-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
