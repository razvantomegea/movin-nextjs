import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Plus, Trash2, Save, ArrowRight, BookOpen, Award, Info } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { CelebrationAnimation } from '@/components/celebration-animation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch } from '@/lib/redux/hooks';
import { addEnergyEntry, fetchEnergyData } from '@/lib/redux/slices/energyDataSlice';
import { addFailedSave } from '@/lib/redux/slices/failedSavesSlice';
import {
  addMealToLibrary,
  fetchRecentMeals,
  updateMealInLibrary, // Import the action
} from '@/lib/redux/slices/mealsSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import {
  Ingredient,
  DetectedMeal,
  ApiMealData,
  mapApiResponseToDetectedMeal,
  calculateTotals,
  generateUniqueIngredientId,
  mapIMealToDetectedMeal,
} from '@/utils/energy/mealHelpers';
import { getTodayDateString } from '@/utils/movin/energyMappers';

// Updated Props to include new ones for editing
export interface MealDetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string | null;
  mealData?: ApiMealData | null; // Used for text input
  sourceType?: 'camera' | 'text' | 'edit'; // Added 'edit' to signify editing mode
  originalDescription?: string; // For text based analysis display
  initialMealData?: IMeal | null; // For pre-filling when editing an existing meal
  isEditing?: boolean; // Explicit flag to denote editing mode
}

export function MealDetectionResultsModal({
  isOpen,
  onClose,
  imageData,
  mealData, // This prop can be from text input OR when editing (via initialMealData)
  sourceType = 'camera',
  originalDescription,
  initialMealData, // Provided when sourceType is 'edit'
  isEditing = false, // Explicitly passed to indicate edit mode
}: MealDetectionResultsModalProps) {
  const dispatch = useAppDispatch();
  const { resolvedTheme } = useTheme();
  const { address } = useAppKitAccount();
  const [detectedMeal, setDetectedMeal] = useState<DetectedMeal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editedMealName, setEditedMealName] = useState('');
  const [mealNameEditMode, setMealNameEditMode] = useState(false); // For meal name text input vs. display
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [originalIngredientName, setOriginalIngredientName] = useState<string>('');
  const [isAnalyzingIngredient, setIsAnalyzingIngredient] = useState(false);
  const [saveToMealLibrary, setSaveToMealLibrary] = useState(isEditing); // Default to true if editing a library item
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastMeal, setLastMeal] = useState<DetectedMeal | null>(null);
  const { useClaimMealRewards, useLastMealClaim } = useMovinEarn();
  const { claimMealRewards, error: claimError } = useClaimMealRewards();
  const { lastClaimTimestamp, isLoading: isLastClaimLoading } = useLastMealClaim(address);
  const [rewardAmount, setRewardAmount] = useState<string>('0');
  const [rewardCooldown, setRewardCooldown] = useState<number>(0);
  const [pendingToast, setPendingToast] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const isDark = resolvedTheme === 'dark';

  // Check if editing should be disabled (camera-based meals)
  const isEditingDisabled = sourceType === 'camera';

  // Get meal score color and label based on score
  const getMealScoreInfo = (score: number) => {
    if (score >= 90)
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500/10',
        label: 'Exceptional',
        icon: '🌟',
      };
    if (score >= 80)
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-500/10',
        label: 'Very Good',
        icon: '✨',
      };
    if (score >= 70)
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
        label: 'Good',
        icon: '👍',
      };
    if (score >= 60)
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-500/10',
        label: 'Fair',
        icon: '⚡',
      };
    if (score >= 50)
      return {
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10',
        label: 'Average',
        icon: '📊',
      };
    if (score >= 40)
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
        label: 'Below Average',
        icon: '⚠️',
      };
    if (score >= 30)
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
        label: 'Poor',
        icon: '❌',
      };
    return {
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-600/20',
      label: 'Very Poor',
      icon: '🚫',
    };
  };

  // Unified handler for successful data processing (API or initialMealData)
  const handleDataProcessed = useCallback((processedMealData: DetectedMeal) => {
    setDetectedMeal(processedMealData);
    setEditedMealName(processedMealData.mealName);
    // Calculate reward and show transaction modal
    const score = processedMealData.mealScore || 0;
    const reward = (score / 100).toFixed(2);
    setRewardAmount(reward);
    setIsLoading(false);
  }, []);

  // Unified error handler for API calls
  const handleAnalysisError = useCallback(
    (error: unknown, context: string = 'meal') => {
      console.error(`Error analyzing ${context}:`, error);
      dispatch(
        showErrorToast({
          title: `${context.charAt(0).toUpperCase() + context.slice(1)} Analysis Error`,
          description: `An error occurred while analyzing the ${context}.`,
        }),
      );
      setIsLoading(false);
    },
    [dispatch],
  );

  // Unified failure handler for API calls
  const handleAnalysisFailure = useCallback(
    (errorMessage: string, context: string = 'meal') => {
      dispatch(
        showErrorToast({
          title: `${context.charAt(0).toUpperCase() + context.slice(1)} Analysis Failed`,
          description: errorMessage || `Failed to analyze ${context}.`,
        }),
      );
      setIsLoading(false);
    },
    [dispatch],
  );

  // Handler for meal name input change
  const handleMealNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedMealName(e.target.value);
  }, []);

  // Handler for toggling meal name edit UI
  const handleToggleMealNameEditMode = useCallback(() => {
    setMealNameEditMode(!mealNameEditMode);
  }, [mealNameEditMode]);

  // Handler for backdrop click to close modal (if no confirmation dialog is open)
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handler for saving ingredient edits (includes re-analysis if name changes)
  const handleSaveIngredientEdit = useCallback(async () => {
    if (!detectedMeal || !editingIngredientId) return;
    const currentIngredient = detectedMeal.ingredients.find(
      (ing) => ing.id === editingIngredientId,
    );
    if (!currentIngredient) return;

    const nameChanged = currentIngredient.name !== originalIngredientName;
    if (nameChanged && currentIngredient.name.trim()) {
      setIsAnalyzingIngredient(true);
      try {
        const response = await fetch('/api/analyze-ingredient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredientName: currentIngredient.name }),
        });
        const apiResult = await response.json();
        if (apiResult.success) {
          const updatedIngredients = detectedMeal.ingredients.map((ing) =>
            ing.id === editingIngredientId
              ? { ...ing, ...apiResult.data, name: apiResult.data.name } // Ensure name from API is used
              : ing,
          );
          const totals = calculateTotals(updatedIngredients);
          setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
          dispatch(
            showSuccessToast({
              title: 'Ingredient Updated',
              description: `${apiResult.data.name} nutritional info updated.`,
            }),
          );
        } else {
          handleAnalysisFailure(apiResult.error, 'ingredient');
        }
      } catch (error) {
        handleAnalysisError(error, 'ingredient');
      } finally {
        setIsAnalyzingIngredient(false);
      }
    }
    setEditingIngredientId(null);
    setOriginalIngredientName('');
  }, [
    detectedMeal,
    editingIngredientId,
    originalIngredientName,
    dispatch,
    handleAnalysisFailure,
    handleAnalysisError,
  ]);

  // Effect to initialize or reset modal state when it opens or relevant props change
  useEffect(() => {
    if (isOpen) {
      // Reset common states
      setDetectedMeal(null);
      setEditedMealName('');
      setMealNameEditMode(false);
      setEditingIngredientId(null);
      setIsAnalyzingIngredient(false);
      // Set saveToMealLibrary based on whether we are editing an existing library meal
      setSaveToMealLibrary(isEditing || sourceType === 'edit');

      setIsLoading(true); // Set loading true initially for all paths

      if (isEditing && initialMealData) {
        // Editing an existing meal from the library
        const mappedMeal = mapIMealToDetectedMeal(initialMealData);
        handleDataProcessed(mappedMeal);
      } else if (sourceType === 'text' && mealData) {
        // Analyzing a meal from text input
        const mappedMeal = mapApiResponseToDetectedMeal(mealData as ApiMealData);
        handleDataProcessed(mappedMeal);
      } else if (sourceType === 'camera' && imageData) {
        // Analyzing a meal from image
        fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData }),
        })
          .then((res) => res.json())
          .then((apiResult) => {
            if (apiResult.success) {
              handleDataProcessed(mapApiResponseToDetectedMeal(apiResult.data));
            } else {
              handleAnalysisFailure(apiResult.error);
            }
          })
          .catch(handleAnalysisError)
          .finally(() => setIsLoading(false)); // Ensure loading is set to false in all cases
      } else {
        // No valid data source for analysis or editing, or just opened blank
        setIsLoading(false);
        if (sourceType !== 'edit') {
          // Avoid error if it's an edit scenario without initial data yet
          // console.warn('Meal modal opened without sufficient data for analysis or editing.');
        }
      }
    } else {
      // Reset all states when modal is closed to ensure clean state for next open
      setDetectedMeal(null);
      setIsLoading(false);
      setEditedMealName('');
      setMealNameEditMode(false);
      setEditingIngredientId(null);
      setOriginalIngredientName('');
      setIsAnalyzingIngredient(false);
      // setSaveToMealLibrary(false); // Or persist user's last choice - current is to reset based on edit state
    }
  }, [
    isOpen,
    imageData,
    mealData,
    sourceType,
    initialMealData,
    isEditing,
    handleDataProcessed,
    handleAnalysisFailure,
    handleAnalysisError,
    // dispatch // dispatch is stable, not needed here
  ]);

  // Handle direct editing of ingredient properties (e.g., calories, protein)
  const handleEditIngredientNumericField = useCallback(
    (id: string, field: keyof Ingredient, value: string) => {
      if (!detectedMeal) return;
      const updatedIngredients = detectedMeal.ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: Number.parseFloat(value) || 0 } : ing,
      );
      const totals = calculateTotals(updatedIngredients);
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
    },
    [detectedMeal],
  );
  // Specifically for name, as it might trigger re-analysis if different from original
  const handleEditIngredientName = useCallback(
    (id: string, value: string) => {
      if (!detectedMeal) return;
      const updatedIngredients = detectedMeal.ingredients.map((ing) =>
        ing.id === id ? { ...ing, name: value } : ing,
      );
      // Totals don't change with name, but we update the state
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients });
    },
    [detectedMeal],
  );

  // Handle adding a new ingredient
  const handleAddIngredient = useCallback(() => {
    if (!detectedMeal) return;
    const newIngredient: Ingredient = {
      id: generateUniqueIngredientId(),
      name: 'New Ingredient', // Default name
      calories: 0,
      carbohydrates: 0,
      fats: 0,
      protein: 0,
      fiber: 0,
    };
    const updatedIngredients = [...detectedMeal.ingredients, newIngredient];
    const totals = calculateTotals(updatedIngredients);
    setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
    setEditingIngredientId(newIngredient.id); // Immediately set new ingredient to edit mode
    setOriginalIngredientName('New Ingredient'); // Set for potential re-analysis if name changes
  }, [detectedMeal]);

  // Handle removing an ingredient
  const handleRemoveIngredient = useCallback(
    (id: string) => {
      if (!detectedMeal) return;
      const updatedIngredients = detectedMeal.ingredients.filter((ing) => ing.id !== id);
      const totals = calculateTotals(updatedIngredients);
      setDetectedMeal({ ...detectedMeal, ingredients: updatedIngredients, ...totals });
    },
    [detectedMeal],
  );

  // Calculate if user can claim meal reward (2 hour cooldown)
  const now = Math.floor(Date.now() / 1000);
  const canClaimReward =
    (!lastClaimTimestamp || now - lastClaimTimestamp >= 7200) && Number(rewardAmount) > 0;
  const secondsToWait = lastClaimTimestamp ? Math.max(0, 7200 - (now - lastClaimTimestamp)) : 0;

  // This function is called after user confirms in the AlertDialog
  const handleSaveMealClick = async () => {
    if (!detectedMeal || !address) return;

    // Consolidate meal data for saving/updating
    const mealPayload: Partial<IMeal> = {
      meal_name: editedMealName || detectedMeal.mealName,
      calories: Math.round(detectedMeal.calories), // Ensure whole numbers
      protein: Math.round(detectedMeal.protein),
      carbohydrates: Math.round(detectedMeal.carbohydrates),
      fats: Math.round(detectedMeal.fats),
      fiber: Math.round(detectedMeal.fiber),
      log_date: getTodayDateString(), // For new energy entries
    };

    try {
      if (isEditing && initialMealData && address) {
        // Updating an existing meal in the library
        await dispatch(
          updateMealInLibrary({
            mealId: initialMealData.id,
            address: address.toLowerCase(),
            mealData: mealPayload,
          }),
        ).unwrap();
        setPendingToast({
          title: 'Meal logged successfully',
          description: 'Your meal has been updated in the library.',
        });
      } else if (address) {
        // Ensure address exists for adding new meal too
        // Adding a new meal (from camera/text analysis)
        await dispatch(
          addEnergyEntry({ address: address.toLowerCase(), energyData: mealPayload }),
        ).unwrap();

        let successMessage = 'Your meal has been added to your log.';
        if (saveToMealLibrary) {
          await dispatch(
            addMealToLibrary({ address: address.toLowerCase(), mealData: mealPayload }),
          ).unwrap();
          successMessage = 'Your meal has been added to your log and saved to your meal library.';
        }
        setPendingToast({
          title: 'Meal Added',
          description: successMessage,
        });
      }

      // Common post-save actions
      if (address) {
        dispatch(fetchRecentMeals(address.toLowerCase())); // Refresh recent meals
        dispatch(fetchEnergyData(address.toLowerCase())); // Refresh daily energy data
      }

      setLastMeal(detectedMeal);

      if (sourceType === 'camera') {
        if (canClaimReward) {
          // Show loading state while claiming reward
          setIsLoading(true);
          const claimSuccess = await claimMealRewards(address, detectedMeal.mealScore || 0);
          setIsLoading(false);

          if (claimSuccess) {
            setShowCelebration(true);
          } else if (claimError) {
            dispatch(
              showErrorToast({
                title: 'Reward Claim Failed',
                description: claimError.message || 'Could not claim MVN reward for this meal.',
              }),
            );
          }
        } else {
          setRewardCooldown(secondsToWait);
        }
        return;
      } else {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'save'} meal:`, error);

      // Check if it's a network error and add to retry queue
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'NetworkError');

      if (isNetworkError && !isEditing && address) {
        // Only add to retry queue for new energy entries (not library updates)
        dispatch(
          addFailedSave({
            type: 'add',
            dataType: 'meal',
            address: address.toLowerCase(),
            mealData: {
              address: address.toLowerCase(),
              meal_name: mealPayload.meal_name || 'Unknown Meal',
              calories: mealPayload.calories || 0,
              protein: mealPayload.protein || 0,
              carbohydrates: mealPayload.carbohydrates || 0,
              fats: mealPayload.fats || 0,
              fiber: mealPayload.fiber || 0,
              log_date: mealPayload.log_date || getTodayDateString(),
            },
            error: error instanceof Error ? error.message : 'Failed to save meal',
          }),
        );

        dispatch(
          showErrorToast({
            title: 'Meal Queued for Retry',
            description:
              'Your meal will be saved when connection is restored. Check the energy page refresh button to retry.',
          }),
        );
      } else {
        dispatch(
          showErrorToast({
            title: 'Save Failed',
            description: `Failed to ${isEditing ? 'update' : 'save'} your meal. Please try again.`,
          }),
        );
      }
    }
  };

  // Auto-share handler for celebration modal
  const handleShareMealAchievement = async () => {
    if (!address || !lastMeal) return;
    try {
      const mealName = lastMeal.mealName;
      const mealScore = lastMeal.mealScore;
      const postContent = `I just logged a meal: ${mealName} (Nutrition Score: ${mealScore}/100)! #movin #nutrition`;
      await dispatch(
        createPost({
          address: address.toLowerCase(),
          postData: { content: postContent },
        }),
      ).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Achievement Shared!',
          description: 'Your meal achievement has been shared with your connections.',
        }),
      );
      setShowCelebration(false);
      onClose();
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  };

  // UI Callback Handlers for ingredient edits, add, remove
  const handleAddIngredientClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent form submission if applicable
      handleAddIngredient();
    },
    [handleAddIngredient],
  );

  const handleIngredientEditClick = useCallback(
    (ingredientId: string) => {
      if (!detectedMeal) return;
      const ingredient = detectedMeal.ingredients.find((ing) => ing.id === ingredientId);
      if (ingredient) {
        setOriginalIngredientName(ingredient.name); // Store original name for re-analysis logic
      }
      setEditingIngredientId(ingredientId);
    },
    [detectedMeal],
  );

  const handleRemoveIngredientClick = useCallback(
    (ingredientId: string) => {
      handleRemoveIngredient(ingredientId);
    },
    [handleRemoveIngredient],
  );

  // Updated change handlers to use the specific field editor functions
  const handleIngredientNameChange = useCallback(
    (id: string, value: string) => handleEditIngredientName(id, value),
    [handleEditIngredientName],
  );
  const handleIngredientCaloriesChange = useCallback(
    (id: string, value: string) => handleEditIngredientNumericField(id, 'calories', value),
    [handleEditIngredientNumericField],
  );
  const handleIngredientCarbsChange = useCallback(
    (id: string, value: string) => handleEditIngredientNumericField(id, 'carbohydrates', value),
    [handleEditIngredientNumericField],
  );
  const handleIngredientFatsChange = useCallback(
    (id: string, value: string) => handleEditIngredientNumericField(id, 'fats', value),
    [handleEditIngredientNumericField],
  );
  const handleIngredientProteinChange = useCallback(
    (id: string, value: string) => handleEditIngredientNumericField(id, 'protein', value),
    [handleEditIngredientNumericField],
  );
  const handleIngredientFiberChange = useCallback(
    (id: string, value: string) => handleEditIngredientNumericField(id, 'fiber', value),
    [handleEditIngredientNumericField],
  );

  // Handler for "Save to Meal Library" checkbox
  const handleSaveToMealLibraryChange = useCallback((checked: boolean) => {
    setSaveToMealLibrary(checked);
  }, []);

  // Handler for closing the celebration modal
  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);

    if (pendingToast) {
      dispatch(showSuccessToast(pendingToast));
      setPendingToast(null);
    }

    onClose();
  }, [dispatch, onClose, pendingToast]);

  let loadingMessage = 'Analyzing your meal...';
  if (claimError && sourceType === 'camera' && canClaimReward) {
    loadingMessage = 'Claiming reward failed. Please try again.';
  } else if (sourceType === 'camera' && canClaimReward) {
    loadingMessage = 'Claiming your meal reward...';
  }

  return (
    <>
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
                    <p className="text-lg font-medium">{loadingMessage}</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {sourceType === 'camera' && canClaimReward
                        ? 'Please wait while we process your reward claim.'
                        : 'Our AI is identifying ingredients and calculating nutrition information'}
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
                          className={`font-medium mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          Original Description:
                        </h4>
                        <p className={`italic ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          &quot;{originalDescription}&quot;
                        </p>
                      </div>
                    )}

                    {/* Meal Name and Score */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {mealNameEditMode && !isEditingDisabled ? (
                          <Input
                            value={editedMealName}
                            onChange={handleMealNameChange}
                            className="text-lg font-bold flex-1"
                            placeholder="Enter meal name"
                          />
                        ) : (
                          <h3
                            className="text-lg font-bold flex-1 truncate"
                            title={editedMealName || detectedMeal.mealName}
                          >
                            {editedMealName || detectedMeal.mealName}
                          </h3>
                        )}
                        {!isEditingDisabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleMealNameEditMode}
                            className="ml-2 p-2"
                            aria-label={mealNameEditMode ? 'Save meal name' : 'Edit meal name'}
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">
                              {mealNameEditMode ? 'Save' : 'Edit'} meal name
                            </span>
                          </Button>
                        )}
                      </div>

                      {/* Meal Score Display */}
                      {detectedMeal.mealScore !== undefined && (
                        <div
                          className={`p-4 rounded-lg border ${
                            getMealScoreInfo(detectedMeal.mealScore).bg
                          } ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Award
                                className={`h-5 w-5 ${
                                  getMealScoreInfo(detectedMeal.mealScore).color
                                }`}
                              />
                              <span className="font-medium">Nutrition Score</span>
                              {isEditingDisabled && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isDark
                                      ? 'bg-gray-700 text-gray-300'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  AI Analysis
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-2xl font-bold ${
                                  getMealScoreInfo(detectedMeal.mealScore).color
                                }`}
                              >
                                {detectedMeal.mealScore}
                              </span>
                              <span className="text-2xl">
                                {getMealScoreInfo(detectedMeal.mealScore).icon}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div
                              className={`text-sm font-medium ${
                                getMealScoreInfo(detectedMeal.mealScore).color
                              }`}
                            >
                              {getMealScoreInfo(detectedMeal.mealScore).label}
                            </div>
                            {(() => {
                              let progressBarColor = 'bg-red-500';
                              if (detectedMeal.mealScore >= 70) progressBarColor = 'bg-green-500';
                              else if (detectedMeal.mealScore >= 50)
                                progressBarColor = 'bg-yellow-500';
                              return (
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${progressBarColor}`}
                                    style={{ width: `${detectedMeal.mealScore}%` }}
                                  />
                                </div>
                              );
                            })()}
                            {/* MVN reward message for camera-based meals */}
                            {sourceType === 'camera' && (
                              <div className="mt-3 flex items-center text-sm">
                                {isLastClaimLoading ? (
                                  <span>Checking reward eligibility...</span>
                                ) : canClaimReward ? (
                                  <>
                                    <span>
                                      You will receive{' '}
                                      <span className="font-semibold">{rewardAmount} MVN</span>
                                    </span>
                                    <div className="ml-2 relative group">
                                      <button
                                        type="button"
                                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                        aria-label="Info"
                                      >
                                        <Info className="inline h-4 w-4" />
                                      </button>
                                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-2 rounded bg-gray-800 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                                        After saving this meal and confirming the transaction, you
                                        will receive {rewardAmount} MVN in your wallet.
                                      </div>
                                    </div>
                                  </>
                                ) : secondsToWait > 0 ? (
                                  <span className="text-orange-500">
                                    You must wait {Math.ceil(secondsToWait / 60)} minute(s) before
                                    claiming another meal reward. You can still save the meal.
                                  </span>
                                ) : (
                                  <span className="text-orange-500">
                                    You are not eligible for a meal reward at this time (e.g., score too low), but you can still save the meal.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ingredients List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">Ingredients</h4>
                          {isEditingDisabled && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              AI Generated - View Only
                            </span>
                          )}
                        </div>
                        {!isEditingDisabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={Boolean(
                              isEditing &&
                                initialMealData &&
                                detectedMeal?.ingredients.length === 1 &&
                                detectedMeal.ingredients[0].name === initialMealData.meal_name,
                            )}
                            onClick={handleAddIngredientClick} // Disable add if editing a single-entry library meal
                            className="text-blue-500 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            type="button"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Ingredient
                          </Button>
                        )}
                      </div>

                      {isEditingDisabled && (
                        <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Camera-based meals are analyzed by AI and cannot be edited to ensure
                          accuracy. The ingredients and nutrition information are automatically
                          detected from your photo.
                        </p>
                      )}

                      {isEditing &&
                        initialMealData &&
                        detectedMeal?.ingredients.length === 1 &&
                        detectedMeal.ingredients[0].name === initialMealData.meal_name && (
                          <p
                            className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            Editing overall nutrition for &quot;{initialMealData.meal_name}&quot;.
                            To edit individual ingredients, log this as a new meal for full
                            analysis.
                          </p>
                        )}
                      <div className="space-y-3">
                        {detectedMeal.ingredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className={`p-3 rounded-lg transition-all duration-200 ${
                              isDark ? 'bg-gray-800' : 'bg-gray-50'
                            } ${
                              editingIngredientId === ingredient.id ? 'ring-2 ring-blue-500' : ''
                            } ${
                              isAnalyzingIngredient && editingIngredientId === ingredient.id
                                ? 'opacity-75'
                                : ''
                            }`}
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
                                    disabled={isAnalyzingIngredient}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveIngredientEdit}
                                    disabled={isAnalyzingIngredient}
                                    className="ml-2"
                                  >
                                    {isAnalyzingIngredient ? (
                                      <div className="w-4 h-4 border-2 border-t-blue-500 border-b-blue-700 rounded-full animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Save</span>
                                  </Button>
                                </div>
                                {isAnalyzingIngredient && editingIngredientId === ingredient.id && (
                                  <div
                                    className={`text-xs ${
                                      isDark ? 'text-blue-400' : 'text-blue-600'
                                    } font-medium`}
                                  >
                                    Analyzing ingredient and updating nutrition data...
                                  </div>
                                )}
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
                                        handleIngredientCaloriesChange(
                                          ingredient.id,
                                          e.target.value,
                                        )
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
                                      value={ingredient.carbohydrates}
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
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}
                                    >
                                      Fiber (g)
                                    </label>
                                    <Input
                                      type="number"
                                      value={ingredient.fiber}
                                      onChange={(e) =>
                                        handleIngredientFiberChange(ingredient.id, e.target.value)
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
                                  {!isEditingDisabled && (
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
                                  )}
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
                                    <div className="font-medium">{ingredient.carbohydrates}g</div>
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
                                  <div className="text-center p-1 bg-purple-500/10 rounded">
                                    <div
                                      className={`text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}
                                    >
                                      Fiber
                                    </div>
                                    <div className="font-medium">{ingredient.fiber}g</div>
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
                          <div className="text-2xl font-bold">
                            {Math.round(detectedMeal.protein)}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Protein (g)
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{Math.round(detectedMeal.fiber)}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Fiber (g)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-lg font-medium text-red-500">Failed to detect meal</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      We couldn&apos;t analyze your meal. Please try taking another photo with
                      better lighting.
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
                      onCheckedChange={(checked) =>
                        handleSaveToMealLibraryChange(checked as boolean)
                      }
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
                    {isEditing
                      ? "Changes will update this meal in your library. It won't be automatically re-logged to today's energy."
                      : "Your meal will always be saved to today's energy log. Check this to also save it to your meal library for easy reuse."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={onClose}>
                    Cancel {/* Using onClose directly */}
                  </Button>
                  <Button
                    onClick={handleSaveMealClick}
                    disabled={isLoading || !detectedMeal}
                    className={
                      isEditing
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }
                  >
                    {isEditing ? 'Update Meal' : 'Save to Log'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Celebration Animation after meal add or reward claim */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        achievementType="meal"
        achievementValue={lastMeal ? lastMeal.mealName : ''}
        achievementTitle="Meal Logged"
        description={lastMeal ? `Nutrition Score: ${lastMeal.mealScore}/100` : ''}
        showReward={sourceType === 'camera'}
        rewardAmount={rewardAmount}
        rewardCurrency="MVN"
        onShare={handleShareMealAchievement}
        showShareButton={!!address}
      />
    </>
  );
}
