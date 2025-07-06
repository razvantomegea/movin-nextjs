'use client';

import { Camera, PenTool, Search } from 'lucide-react';
import { BaseModal } from '@/components/ui/base-modal';
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
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Your Meal"
      subtitle="Choose how you'd like to log your meal"
      contentClassName="p-6"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          {/* Camera Option */}
          <Card
            className="cursor-pointer transition-all duration-150 ease-out hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]"
            onClick={onSelectCamera}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <Camera className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Scan with Camera</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Take a photo of your meal for AI analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Option */}
          <Card
            className="cursor-pointer transition-all duration-150 ease-out hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]"
            onClick={onSelectText}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500/20 p-3 rounded-full">
                  <PenTool className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Describe Your Meal</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Write what you ate in your own words
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Recent/Saved Meals Option */}
          <Card
            className="cursor-pointer transition-all duration-150 ease-out hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]"
            onClick={onSelectSearch}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <Search className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Search Recent Meals</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Find and reuse meals you&apos;ve logged before
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          All methods use AI to provide accurate nutrition information
        </div>
      </div>
    </BaseModal>
  );
}
