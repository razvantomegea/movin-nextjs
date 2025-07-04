import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, ArrowRight, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { CameraModal } from '@/components/camera-modal';
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
  updateMealInLibrary,
} from '@/lib/redux/slices/mealsSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import { Ingredient } from '@/utils/energy/mealHelpers';
import { getTodayDateString } from '@/utils/movin/energyMappers';
import { useIngredientEditing } from './hooks/useIngredientEditing';
import { useMealData } from './hooks/useMealData';
import { usePhotoValidation } from './hooks/usePhotoValidation';
import { IngredientsList } from './ingredients-list';
import { MealScoreDisplay } from './meal-score-display';
import { NutritionTotals } from './nutrition-totals';
import { PhotoValidationSection } from './photo-validation-section';
import { MealDetectionResultsModalProps, RewardState } from './types';
import { calculateRewardAmount, canClaimReward, getSecondsToWait } from './utils/meal-score-utils';

export function MealDetectionResultsModal({
  isOpen,
  onClose,
  imageData,
  mealData,
  sourceType = 'camera',
  originalDescription,
  initialMealData,
  isEditing = false,
}: MealDetectionResultsModalProps) {
  const dispatch = useAppDispatch();
  const { resolvedTheme } = useTheme();
  const { address } = useAppKitAccount();
  const isDark = resolvedTheme === 'dark';

  // Extract complex state into custom hooks
  const {
    mealState,
    updateDetectedMeal,
    updateMealName,
    toggleMealNameEditMode,
    setSaveToMealLibrary,
    setIsLoading,
    initializeMealData,
  } = useMealData();

  const {
    photoValidationState,
    handlePhotoCapture,
    handleRemovePhoto,
    handleShowCameraModal,
    handleCloseCameraModal,
    resetPhotoValidation,
  } = usePhotoValidation();

  const {
    editingState,
    handleEditIngredient,
    handleSaveIngredientEdit,
    handleEditIngredientName,
    handleEditIngredientNumericField,
    handleAddIngredient,
    handleRemoveIngredient,
    resetEditingState,
  } = useIngredientEditing();

  // Reward and celebration state
  const [rewardState, setRewardState] = useState<RewardState>({
    rewardAmount: '0',
    lastMeal: null,
    showCelebration: false,
    pendingToast: null,
  });

  const { useClaimMealRewards, useLastMealClaim } = useMovinEarn();
  const { claimMealRewards, error: claimError } = useClaimMealRewards();
  const { lastClaimTimestamp, isLoading: isLastClaimLoading } = useLastMealClaim(address);

  // Check if editing should be disabled (camera-based meals)
  const isEditingDisabled = sourceType === 'camera';

  // Calculate reward eligibility
  const canClaim = canClaimReward(lastClaimTimestamp, rewardState.rewardAmount);
  const secondsToWait = getSecondsToWait(lastClaimTimestamp);
  const canClaimPhotoReward = Boolean(
    canClaim &&
      photoValidationState.photoValidation?.isValid &&
      photoValidationState.photoValidation?.confidence >= 70 &&
      Number(photoValidationState.photoValidationReward) > 0,
  );

  // Initialize meal data when modal opens or props change
  useEffect(() => {
    const initialize = async () => {
      await initializeMealData({
        isOpen,
        sourceType,
        imageData,
        mealData,
        initialMealData,
        isEditing,
      });

      // Calculate reward amount if meal data is available
      if (mealState.detectedMeal?.mealScore) {
        const reward = calculateRewardAmount(mealState.detectedMeal.mealScore);
        setRewardState((prev) => ({ ...prev, rewardAmount: reward }));
      }
    };

    if (isOpen) {
      initialize();
    } else {
      // Reset all states when modal is closed
      resetPhotoValidation();
      resetEditingState();
      setRewardState({
        rewardAmount: '0',
        lastMeal: null,
        showCelebration: false,
        pendingToast: null,
      });
    }
  }, [
    isOpen,
    imageData,
    mealData,
    sourceType,
    initialMealData,
    isEditing,
    initializeMealData,
    mealState.detectedMeal?.mealScore,
    resetPhotoValidation,
    resetEditingState,
  ]);

  // Handler for backdrop click to close modal
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handler for meal name input change
  const handleMealNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMealName(e.target.value);
    },
    [updateMealName],
  );

  // Handler for save to meal library checkbox change
  const handleSaveToMealLibraryChange = useCallback(
    (checked: boolean) => {
      setSaveToMealLibrary(checked);
    },
    [setSaveToMealLibrary],
  );

  // Wrapper functions for ingredient editing to maintain compatibility
  const handleEditIngredientWrapper = useCallback(
    (ingredientId: string) => {
      if (!mealState.detectedMeal) return;
      const ingredient = mealState.detectedMeal.ingredients.find(
        (ing: Ingredient) => ing.id === ingredientId,
      );
      if (ingredient) {
        handleEditIngredient(ingredientId, ingredient.name);
      }
    },
    [mealState.detectedMeal, handleEditIngredient],
  );

  const handleSaveIngredientEditWrapper = useCallback(async () => {
    if (!mealState.detectedMeal) return;
    await handleSaveIngredientEdit(mealState.detectedMeal, updateDetectedMeal);
  }, [mealState.detectedMeal, handleSaveIngredientEdit, updateDetectedMeal]);

  const handleEditIngredientNameWrapper = useCallback(
    (id: string, value: string) => {
      if (!mealState.detectedMeal) return;
      handleEditIngredientName(id, value, mealState.detectedMeal, updateDetectedMeal);
    },
    [mealState.detectedMeal, handleEditIngredientName, updateDetectedMeal],
  );

  const handleEditIngredientFieldWrapper = useCallback(
    (id: string, field: keyof Ingredient, value: string) => {
      if (!mealState.detectedMeal) return;
      handleEditIngredientNumericField(
        id,
        field,
        value,
        mealState.detectedMeal,
        updateDetectedMeal,
      );
    },
    [mealState.detectedMeal, handleEditIngredientNumericField, updateDetectedMeal],
  );

  const handleAddIngredientWrapper = useCallback(() => {
    if (!mealState.detectedMeal) return;
    handleAddIngredient(mealState.detectedMeal, updateDetectedMeal);
  }, [mealState.detectedMeal, handleAddIngredient, updateDetectedMeal]);

  const handleRemoveIngredientWrapper = useCallback(
    (id: string) => {
      if (!mealState.detectedMeal) return;
      handleRemoveIngredient(id, mealState.detectedMeal, updateDetectedMeal);
    },
    [mealState.detectedMeal, handleRemoveIngredient, updateDetectedMeal],
  );

  // Handler for photo capture
  const handlePhotoCaptureWrapper = useCallback(
    async (imageData: string) => {
      await handlePhotoCapture(imageData, mealState.detectedMeal, originalDescription);
    },
    [handlePhotoCapture, mealState.detectedMeal, originalDescription],
  );

  // Handler for celebration close
  const handleCelebrationClose = useCallback(() => {
    setRewardState((prev) => ({ ...prev, showCelebration: false }));
    if (rewardState.pendingToast) {
      dispatch(showSuccessToast(rewardState.pendingToast));
      setRewardState((prev) => ({ ...prev, pendingToast: null }));
    }
    onClose();
  }, [rewardState.pendingToast, dispatch, onClose]);

  // Main save meal function
  const handleSaveMealClick = async () => {
    if (!mealState.detectedMeal || !address) return;

    const mealPayload: Partial<IMeal> = {
      meal_name: mealState.editedMealName || mealState.detectedMeal.mealName,
      calories: Math.round(mealState.detectedMeal.calories),
      protein: Math.round(mealState.detectedMeal.protein),
      carbohydrates: Math.round(mealState.detectedMeal.carbohydrates),
      fats: Math.round(mealState.detectedMeal.fats),
      fiber: Math.round(mealState.detectedMeal.fiber),
      log_date: getTodayDateString(),
    };

    try {
      if (isEditing && initialMealData && address) {
        await dispatch(
          updateMealInLibrary({
            mealId: initialMealData.id,
            address: address.toLowerCase(),
            mealData: mealPayload,
          }),
        ).unwrap();
        setRewardState((prev) => ({
          ...prev,
          pendingToast: {
            title: 'Meal logged successfully',
            description: 'Your meal has been updated in the library.',
          },
        }));
      } else if (address) {
        await dispatch(
          addEnergyEntry({ address: address.toLowerCase(), energyData: mealPayload }),
        ).unwrap();

        let successMessage = 'Your meal has been added to your log.';
        if (mealState.saveToMealLibrary) {
          await dispatch(
            addMealToLibrary({ address: address.toLowerCase(), mealData: mealPayload }),
          ).unwrap();
          successMessage = 'Your meal has been added to your log and saved to your meal library.';
        }
        setRewardState((prev) => ({
          ...prev,
          pendingToast: {
            title: 'Meal Added',
            description: successMessage,
          },
        }));
      }

      // Common post-save actions
      if (address) {
        dispatch(fetchRecentMeals(address.toLowerCase()));
        dispatch(fetchEnergyData(address.toLowerCase()));
      }

      setRewardState((prev) => ({ ...prev, lastMeal: mealState.detectedMeal }));

      if (sourceType === 'camera') {
        if (canClaim) {
          setIsLoading(true);
          const claimSuccess = await claimMealRewards(
            address,
            mealState.detectedMeal.mealScore || 0,
          );
          setIsLoading(false);

          if (claimSuccess) {
            setRewardState((prev) => ({ ...prev, showCelebration: true }));
          } else if (claimError) {
            dispatch(
              showErrorToast({
                title: 'Reward Claim Failed',
                description: claimError.message || 'Could not claim MVN reward for this meal.',
              }),
            );
          }
        }
        return;
      } else if (sourceType === 'text' && canClaimPhotoReward) {
        setIsLoading(true);
        const claimSuccess = await claimMealRewards(address, mealState.detectedMeal.mealScore || 0);
        setIsLoading(false);

        if (claimSuccess) {
          setRewardState((prev) => ({ ...prev, showCelebration: true }));
        } else if (claimError) {
          dispatch(
            showErrorToast({
              title: 'Reward Claim Failed',
              description: claimError.message || 'Could not claim MVN reward for photo validation.',
            }),
          );
        }
        return;
      } else {
        setRewardState((prev) => ({ ...prev, showCelebration: true }));
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'save'} meal:`, error);

      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'NetworkError');

      if (isNetworkError && !isEditing && address) {
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
    if (!address || !rewardState.lastMeal) return;
    try {
      const mealName = rewardState.lastMeal.mealName;
      const mealScore = rewardState.lastMeal.mealScore;
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
      setRewardState((prev) => ({ ...prev, showCelebration: false }));
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

  let loadingMessage = 'Analyzing your meal...';
  if (claimError && sourceType === 'camera' && canClaim) {
    loadingMessage = 'Claiming reward failed. Please try again.';
  } else if (sourceType === 'camera' && canClaim) {
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
                {mealState.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium">{loadingMessage}</p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {sourceType === 'camera' && canClaim
                        ? 'Please wait while we process your reward claim.'
                        : 'Our AI is identifying ingredients and calculating nutrition information'}
                    </p>
                  </div>
                ) : mealState.detectedMeal ? (
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

                    {/* Photo Upload Section for Text-based Meals */}
                    <PhotoValidationSection
                      sourceType={sourceType}
                      originalDescription={originalDescription}
                      detectedMeal={mealState.detectedMeal}
                      photoValidationState={photoValidationState}
                      onPhotoCapture={handlePhotoCaptureWrapper}
                      onRemovePhoto={handleRemovePhoto}
                      onShowCameraModal={handleShowCameraModal}
                      isDark={isDark}
                      canClaimReward={canClaim}
                      isLastClaimLoading={isLastClaimLoading}
                      secondsToWait={secondsToWait}
                      photoValidationReward={photoValidationState.photoValidationReward}
                      canClaimPhotoReward={canClaimPhotoReward}
                    />

                    {/* Meal Name and Score */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {mealState.mealNameEditMode && !isEditingDisabled ? (
                          <Input
                            value={mealState.editedMealName}
                            onChange={handleMealNameChange}
                            className="text-lg font-bold flex-1"
                            placeholder="Enter meal name"
                          />
                        ) : (
                          <h3
                            className="text-lg font-bold flex-1 truncate"
                            title={mealState.editedMealName || mealState.detectedMeal.mealName}
                          >
                            {mealState.editedMealName || mealState.detectedMeal.mealName}
                          </h3>
                        )}
                        {!isEditingDisabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMealNameEditMode}
                            className="ml-2 p-2"
                            aria-label={
                              mealState.mealNameEditMode ? 'Save meal name' : 'Edit meal name'
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">
                              {mealState.mealNameEditMode ? 'Save' : 'Edit'} meal name
                            </span>
                          </Button>
                        )}
                      </div>

                      {/* Meal Score Display */}
                      <MealScoreDisplay
                        mealScore={mealState.detectedMeal.mealScore || 0}
                        isDark={isDark}
                        isEditingDisabled={isEditingDisabled}
                        sourceType={sourceType}
                        canClaimReward={canClaim}
                        rewardAmount={rewardState.rewardAmount}
                        isLastClaimLoading={isLastClaimLoading}
                        secondsToWait={secondsToWait}
                      />
                    </div>

                    {/* Ingredients List */}
                    <IngredientsList
                      detectedMeal={mealState.detectedMeal}
                      editingState={editingState}
                      isEditingDisabled={isEditingDisabled}
                      isEditing={isEditing}
                      initialMealData={initialMealData}
                      onEditIngredient={handleEditIngredientWrapper}
                      onSaveIngredientEdit={handleSaveIngredientEditWrapper}
                      onAddIngredient={handleAddIngredientWrapper}
                      onRemoveIngredient={handleRemoveIngredientWrapper}
                      onEditIngredientName={handleEditIngredientNameWrapper}
                      onEditIngredientField={handleEditIngredientFieldWrapper}
                      isDark={isDark}
                    />

                    {/* Nutrition Totals */}
                    <NutritionTotals detectedMeal={mealState.detectedMeal} isDark={isDark} />
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
                      checked={mealState.saveToMealLibrary}
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
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMealClick}
                    disabled={mealState.isLoading || !mealState.detectedMeal}
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
        isOpen={rewardState.showCelebration}
        onClose={handleCelebrationClose}
        achievementType="meal"
        achievementValue={rewardState.lastMeal ? rewardState.lastMeal.mealName : ''}
        achievementTitle="Meal Logged"
        description={
          rewardState.lastMeal ? `Nutrition Score: ${rewardState.lastMeal.mealScore}/100` : ''
        }
        showReward={sourceType === 'camera'}
        rewardAmount={rewardState.rewardAmount}
        rewardCurrency="MVN"
        onShare={handleShareMealAchievement}
        showShareButton={!!address}
      />

      {/* Camera Modal for Photo Validation */}
      <CameraModal
        isOpen={photoValidationState.showCameraModal}
        onClose={handleCloseCameraModal}
        onCapture={handlePhotoCaptureWrapper}
        title="Take Meal Photo"
        instruction="Position your meal in the frame to validate it matches your description"
        confirmText="Validate Photo"
      />
    </>
  );
}
