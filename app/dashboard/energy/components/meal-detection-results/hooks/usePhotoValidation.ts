import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { DetectedMeal } from '@/utils/energy/mealHelpers';
import { PhotoValidationState, PhotoValidationResult } from '../types';
import { calculatePhotoValidationReward } from '../utils/meal-score-utils';

export function usePhotoValidation() {
  const dispatch = useAppDispatch();

  const [photoValidationState, setPhotoValidationState] = useState<PhotoValidationState>({
    uploadedPhoto: null,
    photoValidation: null,
    isValidatingPhoto: false,
    photoValidationReward: '0',
    showCameraModal: false,
  });

  const validatePhoto = useCallback(
    async (imageData: string, mealDescription: string): Promise<PhotoValidationResult | null> => {
      setPhotoValidationState((prev) => ({ ...prev, isValidatingPhoto: true }));

      try {
        const response = await fetch('/api/validate-meal-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData,
            mealDescription,
          }),
        });

        const result = await response.json();

        if (result.success) {
          return result.validation;
        } else {
          dispatch(
            showErrorToast({
              title: 'Validation Error',
              description: result.error || 'Failed to validate photo.',
            }),
          );
          return null;
        }
      } catch (error) {
        console.error('Photo validation error:', error);
        dispatch(
          showErrorToast({
            title: 'Validation Error',
            description: 'An error occurred while validating the photo.',
          }),
        );
        return null;
      } finally {
        setPhotoValidationState((prev) => ({ ...prev, isValidatingPhoto: false }));
      }
    },
    [dispatch],
  );

  const handlePhotoCapture = useCallback(
    async (imageData: string, detectedMeal: DetectedMeal | null, originalDescription?: string) => {
      setPhotoValidationState((prev) => ({
        ...prev,
        uploadedPhoto: imageData,
        showCameraModal: false,
      }));

      if (detectedMeal && originalDescription) {
        const validation = await validatePhoto(imageData, originalDescription);

        if (validation) {
          setPhotoValidationState((prev) => ({
            ...prev,
            photoValidation: validation,
            photoValidationReward: calculatePhotoValidationReward(
              detectedMeal.mealScore || 0,
              validation.isValid,
              validation.confidence,
            ),
          }));

          if (validation.isValid && validation.confidence >= 70) {
            dispatch(
              showSuccessToast({
                title: 'Photo Validated!',
                description: `Your photo matches the meal description with ${validation.confidence}% confidence. You can now claim additional MVN rewards!`,
              }),
            );
          } else {
            dispatch(
              showErrorToast({
                title: 'Photo Validation Failed',
                description: validation.reasoning,
              }),
            );
          }
        }
      }
    },
    [dispatch, validatePhoto],
  );

  const handleRemovePhoto = useCallback(() => {
    setPhotoValidationState((prev) => ({
      ...prev,
      uploadedPhoto: null,
      photoValidation: null,
      photoValidationReward: '0',
    }));
  }, []);

  const handleShowCameraModal = useCallback(() => {
    setPhotoValidationState((prev) => ({ ...prev, showCameraModal: true }));
  }, []);

  const handleCloseCameraModal = useCallback(() => {
    setPhotoValidationState((prev) => ({ ...prev, showCameraModal: false }));
  }, []);

  const resetPhotoValidation = useCallback(() => {
    setPhotoValidationState({
      uploadedPhoto: null,
      photoValidation: null,
      isValidatingPhoto: false,
      photoValidationReward: '0',
      showCameraModal: false,
    });
  }, []);

  return {
    photoValidationState,
    handlePhotoCapture,
    handleRemovePhoto,
    handleShowCameraModal,
    handleCloseCameraModal,
    resetPhotoValidation,
  };
}
