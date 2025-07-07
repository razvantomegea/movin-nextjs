import React from 'react';
import { Camera, Upload, Award, CheckCircle, XCircle, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PhotoValidationSectionProps } from './types';
import { calculatePhotoValidationReward } from './utils/meal-score-utils';

// Confidence threshold for photo validation
const PHOTO_VALIDATION_CONFIDENCE_THRESHOLD = 70;

export function PhotoValidationSection({
  sourceType,
  detectedMeal,
  photoValidationState,
  onRemovePhoto,
  onShowCameraModal,
  isDark,
  canClaimReward,
  isLastClaimLoading,
  secondsToWait,
  photoValidationReward,
}: PhotoValidationSectionProps) {
  const { uploadedPhoto, photoValidation, isValidatingPhoto } = photoValidationState;

  if (sourceType !== 'text') {
    return null;
  }

  // Extract validation status box color/border
  let validationBoxClass = '';
  if (
    photoValidation &&
    photoValidation.isValid &&
    photoValidation.confidence >= PHOTO_VALIDATION_CONFIDENCE_THRESHOLD
  ) {
    validationBoxClass = isDark
      ? 'bg-green-900/20 border-green-800'
      : 'bg-green-50 border-green-200';
  } else if (photoValidation) {
    validationBoxClass = isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200';
  }

  return (
    <div
      className={`p-4 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Add Photo for Validation
          </h4>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Upload a photo of your meal to earn additional MVN rewards
          </p>
        </div>
      </div>

      {!uploadedPhoto ? (
        <div className="space-y-3">
          <div
            className={`p-6 border-2 border-dashed rounded-lg text-center ${
              isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <Upload
              className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            />
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Take a photo of your meal to validate it matches your description
            </p>
          </div>

          <Button onClick={onShowCameraModal} className="w-full" variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>

          {/* Reward Information */}
          <div
            className={`p-3 rounded-lg text-center ${
              isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <Award className="h-4 w-4 mr-1 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Bonus Rewards Available
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isLastClaimLoading ? (
                'Checking reward eligibility...'
              ) : canClaimReward ? (
                <>
                  If your photo matches the meal description, you can earn up to{' '}
                  <span className="font-semibold">
                    {calculatePhotoValidationReward(
                      detectedMeal?.mealScore || 0,
                      true,
                      PHOTO_VALIDATION_CONFIDENCE_THRESHOLD,
                    )}{' '}
                    MVN
                  </span>{' '}
                  (last meal claimed &gt; 2 hours ago)
                </>
              ) : secondsToWait > 0 ? (
                `You must wait ${Math.ceil(
                  secondsToWait / 60,
                )} minute(s) before claiming another meal reward.`
              ) : (
                'You are not eligible for meal rewards at this time.'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Uploaded Photo Display */}
          <div className="relative rounded-lg overflow-hidden h-48 bg-gray-200">
            <Image
              src={uploadedPhoto}
              alt="Uploaded meal photo"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
            <Button
              onClick={onRemovePhoto}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Validation Status */}
          {isValidatingPhoto ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-t-blue-500 border-b-blue-700 rounded-full animate-spin mr-3" />
              <span className="text-sm">Validating photo with AI...</span>
            </div>
          ) : photoValidation ? (
            <div className={`p-4 rounded-lg border ${validationBoxClass}`}>
              <div className="flex items-center mb-2">
                {photoValidation.isValid &&
                photoValidation.confidence >= PHOTO_VALIDATION_CONFIDENCE_THRESHOLD ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                )}
                <span className="font-medium">
                  {photoValidation.isValid &&
                  photoValidation.confidence >= PHOTO_VALIDATION_CONFIDENCE_THRESHOLD
                    ? 'Photo Validated!'
                    : 'Validation Failed'}
                </span>
              </div>
              <p className="text-sm mb-2">
                <strong>Detected:</strong> {photoValidation.detectedFood}
              </p>
              <p className="text-sm mb-2">
                <strong>Confidence:</strong> {photoValidation.confidence}%
              </p>
              <p className="text-sm mb-3">
                <strong>Reasoning:</strong> {photoValidation.reasoning}
              </p>

              {photoValidation.isValid &&
                photoValidation.confidence >= PHOTO_VALIDATION_CONFIDENCE_THRESHOLD &&
                canClaimReward && (
                  <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      🎉 You can now claim {photoValidationReward} MVN when saving this meal!
                    </span>
                  </div>
                )}
            </div>
          ) : null}

          <Button onClick={onShowCameraModal} variant="outline" size="sm" className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Retake Photo
          </Button>
        </div>
      )}
    </div>
  );
}
