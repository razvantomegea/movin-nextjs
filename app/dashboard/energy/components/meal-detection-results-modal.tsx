import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Plus, Trash2, Save, ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/lib/redux/hooks';
import { addEnergyEntry } from '@/lib/redux/slices/energyDataSlice';
import { addMealToLibrary } from '@/lib/redux/slices/mealsSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  Ingredient,
  DetectedMeal,
  MealDetectionResultsModalProps,
  ApiMealData,
  mapApiResponseToDetectedMeal,
  calculateTotals,
  generateUniqueIngredientId,
} from '@/utils/energy/mealHelpers';
import { getTodayDateString } from '@/utils/movin/energyMappers';

export function MealDetectionResultsModal({
  isOpen,
  onClose,
  imageData,
  mealData,
  sourceType = 'camera',
  originalDescription,
}: MealDetectionResultsModalProps) {
  const dispatch = useAppDispatch();
  const { resolvedTheme } = useTheme();
  const { address } = useAppKitAccount();
  const [detectedMeal, setDetectedMeal] = useState<DetectedMeal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editedMealName, setEditedMealName] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [saveToMealLibrary, setSaveToMealLibrary] = useState(false);

  const isDark = resolvedTheme === 'dark';

  // Handler for API response success
  const handleAnalysisSuccess = useCallback((data: ApiMealData) => {
    const mappedMeal = mapApiResponseToDetectedMeal(data);
    setDetectedMeal(mappedMeal);
    setEditedMealName(mappedMeal.mealName);
  }, []);

  // Handler for API response error
  const handleAnalysisError = useCallback(
    (error: unknown) => {
      console.error('Error analyzing meal:', error);
      dispatch(
        showErrorToast({
          title: 'Analysis Error',
          description: 'An error occurred while analyzing the meal',
        }),
      );
    },
    [dispatch],
  );

  // Handler for API response failure
  const handleAnalysisFailure = useCallback(
    (errorMessage: string) => {
      dispatch(
        showErrorToast({
          title: 'Analysis Failed',
          description: errorMessage || 'Failed to analyze meal image',
        }),
      );
    },
    [dispatch],
  );

  // Handler for API completion
  const handleAnalysisComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handler for editing meal name input
  const handleMealNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedMealName(e.target.value);
  }, []);

  // Handler for toggling edit mode
  const handleToggleEditMode = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode]);

  // Handler for backdrop click to close modal
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handler for saving ingredient edit
  const handleSaveIngredientEdit = useCallback(() => {
    setEditingIngredientId(null);
  }, []);

  // Analyze meal when modal opens
  useEffect(() => {
    if (isOpen) {
      if (sourceType === 'text' && mealData) {
        // For text-based analysis, use the provided mealData directly
        handleAnalysisSuccess(mealData);
      } else if (sourceType === 'camera' && imageData) {
        setIsLoading(true);

        // Call the meal analysis API for image
        fetch('/api/analyze-meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              handleAnalysisSuccess(data.data);
            } else {
              handleAnalysisFailure(data.error);
            }
          })
          .catch(handleAnalysisError)
          .finally(handleAnalysisComplete);
      }
    }
  }, [
    isOpen,
    imageData,
    mealData,
    sourceType,
    handleAnalysisSuccess,
    handleAnalysisFailure,
    handleAnalysisError,
    handleAnalysisComplete,
  ]);

  // Handle editing an ingredient
  const handleEditIngredient = useCallback(
    (id: string, field: keyof Ingredient, value: string) => {
      if (!detectedMeal) return;

      const updatedIngredients = detectedMeal.ingredients.map((ingredient) => {
        if (ingredient.id === id) {
          if (field === 'name') {
            return { ...ingredient, [field]: value };
          } else {
            // Convert string to number for numeric fields
            return { ...ingredient, [field]: Number.parseFloat(value) || 0 };
          }
        }
        return ingredient;
      });

      const totals = calculateTotals(updatedIngredients);

      setDetectedMeal({
        ...detectedMeal,
        ingredients: updatedIngredients,
        ...totals,
      });
    },
    [detectedMeal],
  );

  // Handle adding a new ingredient
  const handleAddIngredient = useCallback(() => {
    if (!detectedMeal) {
      console.log('No detected meal found');
      return;
    }

    const newIngredient: Ingredient = {
      id: generateUniqueIngredientId(),
      name: 'New Ingredient',
      calories: 0,
      carbs: 0,
      fats: 0,
      protein: 0,
    };

    const updatedIngredients = [...detectedMeal.ingredients, newIngredient];
    const totals = calculateTotals(updatedIngredients);

    const updatedMeal = {
      ...detectedMeal,
      ingredients: updatedIngredients,
      ...totals,
    };

    console.log('Setting new detected meal:', updatedMeal); // Debug log
    setDetectedMeal(updatedMeal);

    // Set this new ingredient to edit mode
    setEditingIngredientId(newIngredient.id);
  }, [detectedMeal]);

  // Handle removing an ingredient
  const handleRemoveIngredient = useCallback(
    (id: string) => {
      if (!detectedMeal) return;

      const updatedIngredients = detectedMeal.ingredients.filter(
        (ingredient) => ingredient.id !== id,
      );
      const totals = calculateTotals(updatedIngredients);

      setDetectedMeal({
        ...detectedMeal,
        ingredients: updatedIngredients,
        ...totals,
      });
    },
    [detectedMeal],
  );

  // Handle saving the meal
  const handleSaveMeal = async () => {
    if (!detectedMeal || !address) return;

    try {
      // Create energy entry data
      const energyEntryData = {
        address,
        meal_name: editedMealName || detectedMeal.mealName,
        calories: detectedMeal.calories,
        protein: detectedMeal.protein,
        carbohydrates: detectedMeal.carbohydrates,
        fats: detectedMeal.fats,
        log_date: getTodayDateString(),
      };

      // Save to energy log
      await dispatch(addEnergyEntry({ address, energyData: energyEntryData })).unwrap();

      // Optionally save to meals library for quick access
      if (saveToMealLibrary) {
        await dispatch(addMealToLibrary({ address, mealData: energyEntryData })).unwrap();
      }

      dispatch(
        showSuccessToast({
          title: 'Meal Added',
          description: saveToMealLibrary
            ? 'Your meal has been added to your log and saved to your meal library'
            : 'Your meal has been added to your log',
        }),
      );

      onClose();
    } catch (error) {
      console.error('Failed to add meal:', error);
      dispatch(
        showErrorToast({
          title: 'Save Failed',
          description: 'Failed to save meal to your log',
        }),
      );
    }
  };

  // Additional UI callback handlers
  // Handler for adding ingredient button click with event handling
  const handleAddIngredientClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Add button clicked'); // Debug log
      handleAddIngredient();
    },
    [handleAddIngredient],
  );

  // Handler for editing ingredient in edit mode
  const handleIngredientEditClick = useCallback((ingredientId: string) => {
    setEditingIngredientId(ingredientId);
  }, []);

  // Handler for removing ingredient
  const handleRemoveIngredientClick = useCallback(
    (ingredientId: string) => {
      handleRemoveIngredient(ingredientId);
    },
    [handleRemoveIngredient],
  );

  // Handler for ingredient name change
  const handleIngredientNameChange = useCallback(
    (ingredientId: string, value: string) => {
      handleEditIngredient(ingredientId, 'name', value);
    },
    [handleEditIngredient],
  );

  // Handler for ingredient calories change
  const handleIngredientCaloriesChange = useCallback(
    (ingredientId: string, value: string) => {
      handleEditIngredient(ingredientId, 'calories', value);
    },
    [handleEditIngredient],
  );

  // Handler for ingredient carbs change
  const handleIngredientCarbsChange = useCallback(
    (ingredientId: string, value: string) => {
      handleEditIngredient(ingredientId, 'carbs', value);
    },
    [handleEditIngredient],
  );

  // Handler for ingredient fats change
  const handleIngredientFatsChange = useCallback(
    (ingredientId: string, value: string) => {
      handleEditIngredient(ingredientId, 'fats', value);
    },
    [handleEditIngredient],
  );

  // Handler for ingredient protein change
  const handleIngredientProteinChange = useCallback(
    (ingredientId: string, value: string) => {
      handleEditIngredient(ingredientId, 'protein', value);
    },
    [handleEditIngredient],
  );

  // Handler for save to meal library checkbox change
  const handleSaveToMealLibraryChange = useCallback((checked: boolean) => {
    setSaveToMealLibrary(checked);
  }, []);

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
            onClick={handleBackdropClick}
          />

          <motion.div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
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
                <h2 className="text-xl font-bold">Meal Detection Results</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Review and edit the detected ingredients and nutrition information
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium">Analyzing your meal...</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Our AI is identifying ingredients and calculating nutrition information
                  </p>
                </div>
              ) : detectedMeal ? (
                <div className="space-y-6">
                  {/* Meal Image or Description */}
                  {sourceType === 'camera' && imageData && (
                    <div className="relative rounded-lg overflow-hidden h-48 bg-gray-200">
                      <Image
                        src={imageData || '/placeholder.svg'}
                        alt="Captured meal"
                        fill
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  )}

                  {sourceType === 'text' && originalDescription && (
                    <div
                      className={`p-4 rounded-lg border-2 border-dashed ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <h4
                        className={`font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        Original Description:
                      </h4>
                      <p className={`italic ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        &quot;{originalDescription}&quot;
                      </p>
                    </div>
                  )}

                  {/* Meal Name */}
                  <div className="flex items-center justify-between">
                    {editMode ? (
                      <Input
                        value={editedMealName}
                        onChange={handleMealNameChange}
                        className="text-lg font-bold"
                        placeholder="Enter meal name"
                      />
                    ) : (
                      <h3 className="text-lg font-bold">
                        {editedMealName || detectedMeal.mealName}
                      </h3>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleEditMode}
                      className="ml-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">{editMode ? 'Save' : 'Edit'} meal name</span>
                    </Button>
                  </div>

                  {/* Ingredients List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Ingredients</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddIngredientClick}
                        className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        type="button"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ingredient
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {detectedMeal.ingredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className={`p-3 rounded-lg transition-all duration-200 ${
                            isDark ? 'bg-gray-800' : 'bg-gray-50'
                          } ${editingIngredientId === ingredient.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          {editingIngredientId === ingredient.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <Input
                                  value={ingredient.name}
                                  onChange={(e) =>
                                    handleIngredientNameChange(ingredient.id, e.target.value)
                                  }
                                  className="flex-1"
                                  placeholder="Ingredient name"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveIngredientEdit}
                                  className="ml-2"
                                >
                                  <Save className="h-4 w-4" />
                                  <span className="sr-only">Save</span>
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Calories
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.calories}
                                    onChange={(e) =>
                                      handleIngredientCaloriesChange(ingredient.id, e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Carbs (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.carbs}
                                    onChange={(e) =>
                                      handleIngredientCarbsChange(ingredient.id, e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Fats (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.fats}
                                    onChange={(e) =>
                                      handleIngredientFatsChange(ingredient.id, e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Protein (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.protein}
                                    onChange={(e) =>
                                      handleIngredientProteinChange(ingredient.id, e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{ingredient.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleIngredientEditClick(ingredient.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveIngredientClick(ingredient.id)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="text-center p-1 bg-blue-500/10 rounded">
                                  <div
                                    className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Calories
                                  </div>
                                  <div className="font-medium">{ingredient.calories}</div>
                                </div>
                                <div className="text-center p-1 bg-blue-500/10 rounded">
                                  <div
                                    className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Carbs
                                  </div>
                                  <div className="font-medium">{ingredient.carbs}g</div>
                                </div>
                                <div className="text-center p-1 bg-yellow-500/10 rounded">
                                  <div
                                    className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Fats
                                  </div>
                                  <div className="font-medium">{ingredient.fats}g</div>
                                </div>
                                <div className="text-center p-1 bg-green-500/10 rounded">
                                  <div
                                    className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                  >
                                    Protein
                                  </div>
                                  <div className="font-medium">{ingredient.protein}g</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div
                    className={`p-4 rounded-lg ${
                      isDark
                        ? 'bg-blue-900/20 border border-blue-800'
                        : 'bg-blue-50 border border-blue-100'
                    }`}
                  >
                    <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">
                      Nutrition Totals
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(detectedMeal.calories)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Calories
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(detectedMeal.carbohydrates)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Carbs (g)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Math.round(detectedMeal.fats)}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Fats (g)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Math.round(detectedMeal.protein)}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Protein (g)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg font-medium text-red-500">Failed to detect meal</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    We couldn&apos;t analyze your meal. Please try taking another photo with better
                    lighting.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`flex-shrink-0 p-6 border-t ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              {/* Save Options */}
              <div className="mb-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="save-to-library"
                    checked={saveToMealLibrary}
                    onCheckedChange={(checked) => handleSaveToMealLibraryChange(checked as boolean)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="save-to-library"
                    className={`text-sm font-medium cursor-pointer flex items-center space-x-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Save to meal library for quick access later</span>
                  </label>
                </div>
                <p className={`text-xs mt-1 ml-7 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Your meal will always be saved to today&apos;s energy log. Check this to also save
                  it to your meal library for easy reuse.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMeal}
                  disabled={isLoading || !detectedMeal}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save to Log
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
