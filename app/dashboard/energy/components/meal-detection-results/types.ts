import { IMeal } from '@/lib/supabase/meals';
import { ApiMealData, DetectedMeal, Ingredient } from '@/utils/energy/mealHelpers';

export interface MealDetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string | null;
  mealData?: ApiMealData | null;
  sourceType?: 'camera' | 'text' | 'edit';
  originalDescription?: string;
  initialMealData?: IMeal | null;
  isEditing?: boolean;
}

export interface PhotoValidationResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  detectedFood: string;
  matchScore: number;
}

export interface MealScoreInfo {
  color: string;
  bg: string;
  label: string;
  icon: string;
}

export interface PhotoValidationState {
  uploadedPhoto: string | null;
  photoValidation: PhotoValidationResult | null;
  isValidatingPhoto: boolean;
  photoValidationReward: string;
  showCameraModal: boolean;
}

export interface IngredientEditingState {
  editingIngredientId: string | null;
  originalIngredientName: string;
  isAnalyzingIngredient: boolean;
}

export interface MealState {
  detectedMeal: DetectedMeal | null;
  editedMealName: string;
  mealNameEditMode: boolean;
  saveToMealLibrary: boolean;
  isLoading: boolean;
}

export interface RewardState {
  rewardAmount: string;
  lastMeal: DetectedMeal | null;
  showCelebration: boolean;
  pendingToast: {
    title: string;
    description: string;
  } | null;
}

export interface MealScoreDisplayProps {
  mealScore: number;
  isDark: boolean;
  isEditingDisabled: boolean;
  sourceType: 'camera' | 'text' | 'edit';
  canClaimReward: boolean;
  rewardAmount: string;
  isLastClaimLoading: boolean;
  secondsToWait: number;
}

export interface PhotoValidationSectionProps {
  sourceType: 'camera' | 'text' | 'edit';
  originalDescription?: string;
  detectedMeal: DetectedMeal | null;
  photoValidationState: PhotoValidationState;
  onPhotoCapture: (imageData: string) => Promise<void>;
  onRemovePhoto: () => void;
  onShowCameraModal: () => void;
  isDark: boolean;
  canClaimReward: boolean;
  isLastClaimLoading: boolean;
  secondsToWait: number;
  photoValidationReward: string;
  canClaimPhotoReward: boolean;
}

export interface IngredientsListProps {
  detectedMeal: DetectedMeal;
  editingState: IngredientEditingState;
  isEditingDisabled: boolean;
  isEditing: boolean;
  initialMealData?: IMeal | null;
  onEditIngredient: (ingredientId: string) => void;
  onSaveIngredientEdit: () => Promise<void>;
  onAddIngredient: () => void;
  onRemoveIngredient: (id: string) => void;
  onEditIngredientName: (id: string, value: string) => void;
  onEditIngredientField: (id: string, field: keyof Ingredient, value: string) => void;
  isDark: boolean;
}

export interface NutritionTotalsProps {
  detectedMeal: DetectedMeal;
  isDark: boolean;
}
