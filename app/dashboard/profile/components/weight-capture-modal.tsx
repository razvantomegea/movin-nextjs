'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Scale, Camera } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { CameraModal } from '@/components/camera-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/lib/redux/hooks';
import { updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';

interface WeightCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  currentWeightUnit?: string;
}

export function WeightCaptureModal({
  isOpen,
  onClose,
  userAddress,
  currentWeightUnit = 'kg',
}: WeightCaptureModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedWeight, setExtractedWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<string>(currentWeightUnit);

  const handleOpenCamera = useCallback(() => {
    setIsCameraOpen(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setIsCameraOpen(false);
  }, []);

  const processWeightImage = useCallback(
    async (imageData: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        // Convert file to base64
        const base64Data = imageData.split(',')[1];

        // Call the server API endpoint
        const response = await fetch('/api/analyse-weight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64Data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze weight');
        }

        const { data } = await response.json();

        if (!data.isValidScale) {
          setError('This image does not appear to be a valid weight scale screenshot or photo.');
          setIsProcessing(false);
          return;
        }

        if (!data.weight) {
          setError('Could not extract weight value from the image. Please take another photo.');
          setIsProcessing(false);
          return;
        }

        setExtractedWeight(data.weight);
        setWeightUnit(data.unit || weightUnit);
      } catch (error) {
        console.error('Error processing weight image:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to process the image. Please try again.',
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [weightUnit],
  );

  const handleImageCapture = useCallback(
    (capturedImage: string) => {
      setImageData(capturedImage);
      setError(null);
      setExtractedWeight(null);
      processWeightImage(capturedImage);
    },
    [processWeightImage, setImageData, setError, setExtractedWeight],
  );

  const handleSaveWeight = async () => {
    try {
      const weightValue = extractedWeight;

      if (!weightValue || isNaN(weightValue)) {
        throw new Error('Please capture a valid weight value');
      }

      await dispatch(
        updateProfile({
          address: userAddress,
          profileData: {
            weight: weightValue,
            weight_unit: weightUnit,
            weight_updated_at: new Date().toISOString(),
          },
        }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Weight Updated',
          description: 'Your weight has been successfully updated',
        }),
      );

      onClose();
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'Please try again later',
        }),
      );
    }
  };

  const handleWeightUnitChange = (unit: string) => {
    setWeightUnit(unit);
  };

  const handleBackdropClick = () => {
    onClose();
  };

  if (isCameraOpen) {
    return (
      <CameraModal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleImageCapture}
        title="Capture Weight Scale"
        instruction="Position your scale in the frame with the weight clearly visible"
        confirmText="Use This Photo"
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          <motion.div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } flex flex-col`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <div>
                <h2 className="text-xl font-bold">Update Weight</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Take a photo of your scale to update your weight
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {/* Instructions */}
              <Alert className="mb-6">
                <Scale className="h-4 w-4" />
                <AlertDescription>
                  <strong>For best results when using a camera:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Ensure good lighting conditions</li>
                    <li>Make sure the weight display is clearly visible</li>
                    <li>Avoid reflections on the scale display</li>
                    <li>Keep the camera steady when capturing</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Capture Photo Button - Centered */}
              <div className="flex justify-center">
                <Button
                  onClick={handleOpenCamera}
                  className="bg-blue-500 hover:bg-blue-600"
                  size="lg"
                  disabled={isProcessing}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </div>

              {/* Preview Image */}
              {imageData && (
                <div className="my-6">
                  <p className="text-sm font-medium mb-2">Captured Image:</p>
                  <div className="relative h-48 rounded-lg overflow-hidden bg-gray-200">
                    <Image
                      src={imageData}
                      alt="Weight scale"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <div className="flex items-center justify-center py-8 mb-6">
                  <Loader2 className="h-8 w-8 mr-3 animate-spin text-blue-500" />
                  <p>Processing image...</p>
                </div>
              )}

              {/* Weight Input */}
              {extractedWeight !== null && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium mb-1">
                      Detected weight:
                    </label>
                    <div className="flex items-center">
                      <div className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                        {extractedWeight} {weightUnit}
                      </div>
                      <div className="ml-2 inline-flex rounded-md shadow-sm" role="group">
                        <button
                          type="button"
                          onClick={() => handleWeightUnitChange('kg')}
                          className={`px-3 py-1.5 text-xs font-medium bg-white border rounded-l-lg ${
                            weightUnit === 'kg'
                              ? 'text-blue-700 border-blue-700 bg-blue-50'
                              : 'text-gray-900 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600'
                          }`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWeightUnitChange('lb')}
                          className={`px-3 py-1.5 text-xs font-medium bg-white border-t border-b border-r rounded-r-lg ${
                            weightUnit === 'lb'
                              ? 'text-blue-700 border-blue-700 bg-blue-50'
                              : 'text-gray-900 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600'
                          }`}
                        >
                          lb
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`flex-shrink-0 p-6 border-t ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWeight}
                  disabled={isProcessing || extractedWeight === null}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Weight
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
