import { useState, useCallback, useRef, useEffect } from 'react';
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
    async (
      imageData: string,
      mealDescription: string,
      signal?: AbortSignal,
    ): Promise<PhotoValidationResult | null> => {
      // Input validation
      if (!imageData || typeof imageData !== 'string' || imageData.trim() === '') {
        dispatch(
          showErrorToast({
            title: 'Validation Error',
            description: 'Photo data is missing or invalid.',
          }),
        );
        return null;
      }
      if (
        !mealDescription ||
        typeof mealDescription !== 'string' ||
        mealDescription.trim() === ''
      ) {
        dispatch(
          showErrorToast({
            title: 'Validation Error',
            description: 'Meal description is missing or invalid.',
          }),
        );
        return null;
      }

      setPhotoValidationState((prev) => ({ ...prev, isValidatingPhoto: true }));

      let didAbort = false;

      try {
        const response = await fetch('/api/validate-meal-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData,
            mealDescription,
          }),
          signal,
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
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          didAbort = true;
        } else {
          console.error('Photo validation error:', error);
          dispatch(
            showErrorToast({
              title: 'Validation Error',
              description: 'An error occurred while validating the photo.',
            }),
          );
        }
        return null;
      } finally {
        if (!didAbort) {
          setPhotoValidationState((prev) => ({ ...prev, isValidatingPhoto: false }));
        }
      }
    },
    [dispatch],
  );

  // Ref to store the current AbortController for photo validation
  const photoValidationAbortRef = useRef<AbortController | null>(null);

  const handlePhotoCapture = useCallback(
    async (imageData: string, detectedMeal: DetectedMeal | null, originalDescription?: string) => {
      setPhotoValidationState((prev) => ({
        ...prev,
        uploadedPhoto: imageData,
        showCameraModal: false,
      }));

      // Abort any previous validation in progress
      if (photoValidationAbortRef.current) {
        photoValidationAbortRef.current.abort();
      }
      const abortController = new AbortController();
      photoValidationAbortRef.current = abortController;

      if (detectedMeal && originalDescription) {
        const validation = await validatePhoto(
          imageData,
          originalDescription,
          abortController.signal,
        );

        if (abortController.signal.aborted) return; // Don't update state if aborted

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

  // Cleanup: abort validation if component unmounts
  useEffect(() => {
    return () => {
      if (photoValidationAbortRef.current) {
        photoValidationAbortRef.current.abort();
      }
    };
  }, []);

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
