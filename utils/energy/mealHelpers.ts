// Types for meal detection and processing
export interface ApiIngredient {
  name: string;
  calories: number;
  carbohydrates: number;
  fats: number;
  protein: number;
}

export interface ApiMealData {
  mealName: string;
  ingredients: ApiIngredient[];
  calories: number;
  carbohydrates: number;
  fats: number;
  protein: number;
}

export interface Ingredient {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  fats: number;
  protein: number;
}

export interface DetectedMeal {
  mealName: string;
  ingredients: Ingredient[];
  calories: number;
  carbohydrates: number;
  fats: number;
  protein: number;
}

export interface MealDetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string | null;
  mealData?: any;
  sourceType?: 'camera' | 'text';
  originalDescription?: string;
}

/**
 * Maps API response data to DetectedMeal format
 * @param apiData - Raw API response data
 * @returns Formatted DetectedMeal object
 */
export function mapApiResponseToDetectedMeal(apiData: ApiMealData): DetectedMeal {
  const mappedIngredients = apiData.ingredients.map((ingredient: ApiIngredient, index: number) => ({
    id: (index + 1).toString(),
    name: ingredient.name,
    calories: ingredient.calories,
    carbs: ingredient.carbohydrates,
    fats: ingredient.fats,
    protein: ingredient.protein,
  }));

  return {
    mealName: apiData.mealName,
    ingredients: mappedIngredients,
    calories: apiData.calories,
    carbohydrates: apiData.carbohydrates,
    fats: apiData.fats,
    protein: apiData.protein,
  };
}

/**
 * Calculates nutritional totals from an array of ingredients
 * @param ingredients - Array of ingredients to calculate totals for
 * @returns Object containing total calories, carbohydrates, fats, and protein
 */
export function calculateTotals(ingredients: Ingredient[]) {
  return ingredients.reduce(
    (acc, ingredient) => {
      return {
        calories: acc.calories + ingredient.calories,
        carbohydrates: acc.carbohydrates + ingredient.carbs,
        fats: acc.fats + ingredient.fats,
        protein: acc.protein + ingredient.protein,
      };
    },
    { calories: 0, carbohydrates: 0, fats: 0, protein: 0 },
  );
}

/**
 * Generates a unique ingredient ID
 * @returns A unique identifier string for new ingredients
 */
export function generateUniqueIngredientId(): string {
  return `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
