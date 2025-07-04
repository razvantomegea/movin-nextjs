import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import {
  DetectedMeal,
  ApiMealData,
  mapApiResponseToDetectedMeal,
  mapIMealToDetectedMeal,
} from '@/utils/energy/mealHelpers';
import { MealState } from '../types';

export function useMealData() {
  const dispatch = useAppDispatch();

  const [mealState, setMealState] = useState<MealState>({
    detectedMeal: null,
    editedMealName: '',
    mealNameEditMode: false,
    saveToMealLibrary: false,
    isLoading: false,
  });

  const handleDataProcessed = useCallback((processedMealData: DetectedMeal) => {
    setMealState((prev) => ({
      ...prev,
      detectedMeal: processedMealData,
      editedMealName: processedMealData.mealName,
      isLoading: false,
    }));
  }, []);

  const handleAnalysisError = useCallback(
    (error: unknown, context: string = 'meal') => {
      console.error(`Error analyzing ${context}:`, error);
      dispatch(
        showErrorToast({
          title: `${context.charAt(0).toUpperCase() + context.slice(1)} Analysis Error`,
          description: `An error occurred while analyzing the ${context}.`,
        }),
      );
      setMealState((prev) => ({ ...prev, isLoading: false }));
    },
    [dispatch],
  );

  const handleAnalysisFailure = useCallback(
    (errorMessage: string, context: string = 'meal') => {
      dispatch(
        showErrorToast({
          title: `${context.charAt(0).toUpperCase() + context.slice(1)} Analysis Failed`,
          description: errorMessage || `Failed to analyze ${context}.`,
        }),
      );
      setMealState((prev) => ({ ...prev, isLoading: false }));
    },
    [dispatch],
  );

  const analyzeMealFromImage = useCallback(
    async (imageData: string) => {
      setMealState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        });

        const apiResult = await response.json();

        if (apiResult.success) {
          const mappedMeal = mapApiResponseToDetectedMeal(apiResult.data);
          handleDataProcessed(mappedMeal);
          return mappedMeal;
        } else {
          handleAnalysisFailure(apiResult.error);
          return null;
        }
      } catch (error) {
        handleAnalysisError(error);
        return null;
      }
    },
    [handleDataProcessed, handleAnalysisFailure, handleAnalysisError],
  );

  const processMealFromText = useCallback(
    (mealData: ApiMealData) => {
      const mappedMeal = mapApiResponseToDetectedMeal(mealData);
      handleDataProcessed(mappedMeal);
      return mappedMeal;
    },
    [handleDataProcessed],
  );

  const processMealFromLibrary = useCallback(
    (initialMealData: IMeal) => {
      const mappedMeal = mapIMealToDetectedMeal(initialMealData);
      handleDataProcessed(mappedMeal);
      return mappedMeal;
    },
    [handleDataProcessed],
  );

  const updateDetectedMeal = useCallback((meal: DetectedMeal) => {
    setMealState((prev) => ({ ...prev, detectedMeal: meal }));
  }, []);

  const updateMealName = useCallback((name: string) => {
    setMealState((prev) => ({ ...prev, editedMealName: name }));
  }, []);

  const toggleMealNameEditMode = useCallback(() => {
    setMealState((prev) => ({ ...prev, mealNameEditMode: !prev.mealNameEditMode }));
  }, []);

  const setSaveToMealLibrary = useCallback((save: boolean) => {
    setMealState((prev) => ({ ...prev, saveToMealLibrary: save }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setMealState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const resetMealState = useCallback(() => {
    setMealState({
      detectedMeal: null,
      editedMealName: '',
      mealNameEditMode: false,
      saveToMealLibrary: false,
      isLoading: false,
    });
  }, []);

  const initializeMealData = useCallback(
    async ({
      isOpen,
      sourceType,
      imageData,
      mealData,
      initialMealData,
      isEditing,
    }: {
      isOpen: boolean;
      sourceType: 'camera' | 'text' | 'edit';
      imageData?: string | null;
      mealData?: ApiMealData | null;
      initialMealData?: IMeal | null;
      isEditing?: boolean;
    }) => {
      if (!isOpen) {
        resetMealState();
        return;
      }

      // Set saveToMealLibrary based on editing state
      setMealState((prev) => ({
        ...prev,
        saveToMealLibrary: isEditing || sourceType === 'edit',
        isLoading: true,
      }));

      if (isEditing && initialMealData) {
        processMealFromLibrary(initialMealData);
      } else if (sourceType === 'text' && mealData) {
        processMealFromText(mealData);
      } else if (sourceType === 'camera' && imageData) {
        await analyzeMealFromImage(imageData);
      } else {
        setMealState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [resetMealState, processMealFromLibrary, processMealFromText, analyzeMealFromImage],
  );

  return {
    mealState,
    updateDetectedMeal,
    updateMealName,
    toggleMealNameEditMode,
    setSaveToMealLibrary,
    setIsLoading,
    resetMealState,
    initializeMealData,
  };
}
