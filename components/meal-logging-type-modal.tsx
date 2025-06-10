'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, PenTool, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MealLoggingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectText: () => void;
  onSelectSearch: () => void;
}

export function MealLoggingTypeModal({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectText,
  onSelectSearch,
}: MealLoggingTypeModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
          />

          <motion.div
            className={`relative w-full max-w-md rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <h2 className="text-xl font-bold">Log Your Meal</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose how you&apos;d like to log your meal
              </p>

              <div className="space-y-3">
                {/* Camera Option */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Card
                    className={`cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={onSelectCamera}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-500/20 p-3 rounded-full">
                          <Camera className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Scan with Camera</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Take a photo of your meal for AI analysis
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Text Option */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Card
                    className={`cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={onSelectText}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-500/20 p-3 rounded-full">
                          <PenTool className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Describe Your Meal</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Write what you ate in your own words
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Search Recent/Saved Meals Option */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Card
                    className={`cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                    onClick={onSelectSearch}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-500/20 p-3 rounded-full">
                          <Search className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Search Recent Meals</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Find and reuse meals you&apos;ve logged before
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                All methods use AI to provide accurate nutrition information
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
