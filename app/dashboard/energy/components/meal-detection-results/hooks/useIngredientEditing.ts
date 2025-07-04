import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  DetectedMeal,
  Ingredient,
  calculateTotals,
  generateUniqueIngredientId,
} from '@/utils/energy/mealHelpers';
import { IngredientEditingState } from '../types';

export function useIngredientEditing() {
  const dispatch = useAppDispatch();

  const [editingState, setEditingState] = useState<IngredientEditingState>({
    editingIngredientId: null,
    originalIngredientName: '',
    isAnalyzingIngredient: false,
  });

  const analyzeIngredient = useCallback(
    async (ingredientName: string) => {
      if (typeof ingredientName !== 'string' || ingredientName.trim().length === 0) {
        dispatch(
          showErrorToast({
            title: 'Invalid Ingredient Name',
            description: 'Please enter a valid ingredient name to analyze.',
          }),
        );
        return null;
      }
      try {
        const response = await fetch('/api/analyze-ingredient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredientName }),
        });

        let apiResult: { success: boolean; data: Ingredient; error: string };
        try {
          apiResult = await response.json();
        } catch (jsonError) {
          dispatch(
            showErrorToast({
              title: 'Invalid API Response',
              description: 'Could not parse ingredient analysis response.',
            }),
          );
          return null;
        }

        if (
          typeof apiResult !== 'object' ||
          typeof apiResult.success !== 'boolean' ||
          (!('data' in apiResult) && !('error' in apiResult))
        ) {
          dispatch(
            showErrorToast({
              title: 'Unexpected API Response',
              description: 'The ingredient analysis response was not in the expected format.',
            }),
          );
          return null;
        }

        if (apiResult.success) {
          return apiResult.data;
        } else {
          dispatch(
            showErrorToast({
              title: 'Ingredient Analysis Failed',
              description: apiResult.error || 'Failed to analyze ingredient.',
            }),
          );
          return null;
        }
      } catch (error) {
        console.error('Error analyzing ingredient:', error);
        dispatch(
          showErrorToast({
            title: 'Ingredient Analysis Error',
            description: 'An error occurred while analyzing the ingredient.',
          }),
        );
        return null;
      }
    },
    [dispatch],
  );

  const handleEditIngredient = useCallback((ingredientId: string, ingredientName: string) => {
    setEditingState({
      editingIngredientId: ingredientId,
      originalIngredientName: ingredientName,
      isAnalyzingIngredient: false,
    });
  }, []);

  const handleSaveIngredientEdit = useCallback(
    async (detectedMeal: DetectedMeal, setDetectedMeal: (meal: DetectedMeal) => void) => {
      if (editingState.isAnalyzingIngredient) return;
      if (!editingState.editingIngredientId) return;

      const currentIngredient = detectedMeal.ingredients.find(
        (ing) => ing.id === editingState.editingIngredientId,
      );

      if (!currentIngredient) return;

      const nameChanged = currentIngredient.name !== editingState.originalIngredientName;

      if (nameChanged && currentIngredient.name.trim()) {
        setEditingState((prev) => ({ ...prev, isAnalyzingIngredient: true }));

        try {
          const analyzedData = await analyzeIngredient(currentIngredient.name);

          if (analyzedData) {
            const updatedIngredients = detectedMeal.ingredients.map((ing) =>
              ing.id === editingState.editingIngredientId
                ? { ...ing, ...analyzedData, name: analyzedData.name }
                : ing,
            );

            const totals = calculateTotals(updatedIngredients);
            setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });

            dispatch(
              showSuccessToast({
                title: 'Ingredient Updated',
                description: `${analyzedData.name} nutritional info updated.`,
              }),
            );
          }
        } finally {
          setEditingState((prev) => ({ ...prev, isAnalyzingIngredient: false }));
        }
      }

      setEditingState({
        editingIngredientId: null,
        originalIngredientName: '',
        isAnalyzingIngredient: false,
      });
    },
    [editingState, analyzeIngredient, dispatch],
  );

  const handleEditIngredientName = useCallback(
    (
      id: string,
      value: string,
      detectedMeal: DetectedMeal,
      setDetectedMeal: (meal: DetectedMeal) => void,
    ) => {
      const updatedIngredients = detectedMeal.ingredients.map((ing) =>
        ing.id === id ? { ...ing, name: value } : ing,
      );
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients });
    },
    [],
  );

  const handleEditIngredientNumericField = useCallback(
    (
      id: string,
      field: keyof Ingredient,
      value: string,
      detectedMeal: DetectedMeal,
      setDetectedMeal: (meal: DetectedMeal) => void,
    ) => {
      const updatedIngredients = detectedMeal.ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: Number.parseFloat(value) || 0 } : ing,
      );
      const totals = calculateTotals(updatedIngredients);
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
    },
    [],
  );

  const handleAddIngredient = useCallback(
    (detectedMeal: DetectedMeal, setDetectedMeal: (meal: DetectedMeal) => void) => {
      const newIngredient: Ingredient = {
        id: generateUniqueIngredientId(),
        name: 'New Ingredient',
        calories: 0,
        carbohydrates: 0,
        fats: 0,
        protein: 0,
        fiber: 0,
      };

      const updatedIngredients = [...detectedMeal.ingredients, newIngredient];
      const totals = calculateTotals(updatedIngredients);
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });

      setEditingState({
        editingIngredientId: newIngredient.id,
        originalIngredientName: 'New Ingredient',
        isAnalyzingIngredient: false,
      });
    },
    [],
  );

  const handleRemoveIngredient = useCallback(
    (id: string, detectedMeal: DetectedMeal, setDetectedMeal: (meal: DetectedMeal) => void) => {
      const updatedIngredients = detectedMeal.ingredients.filter((ing) => ing.id !== id);
      const totals = calculateTotals(updatedIngredients);
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
    },
    [],
  );

  const resetEditingState = useCallback(() => {
    setEditingState({
      editingIngredientId: null,
      originalIngredientName: '',
      isAnalyzingIngredient: false,
    });
  }, []);

  return {
    editingState,
    handleEditIngredient,
    handleSaveIngredientEdit,
    handleEditIngredientName,
    handleEditIngredientNumericField,
    handleAddIngredient,
    handleRemoveIngredient,
    resetEditingState,
  };
}
