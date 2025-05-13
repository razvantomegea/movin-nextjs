'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/lib/redux/hooks';
import { addMeal } from '@/lib/redux/slices/energyDataSlice';
import { showSuccessToast } from '@/lib/redux/slices/toastSlice';

// Define types for our component
interface Ingredient {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  fats: number;
  protein: number;
}

interface DetectedMeal {
  name: string;
  ingredients: Ingredient[];
  totalCalories: number;
  totalCarbs: number;
  totalFats: number;
  totalProtein: number;
}

interface MealDetectionResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string | null;
}

// Sample data for detected meals
const sampleDetectedMeals: DetectedMeal[] = [
  {
    name: 'Chicken Salad with Avocado',
    ingredients: [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        calories: 165,
        carbs: 0,
        fats: 3.6,
        protein: 31,
      },
      {
        id: '2',
        name: 'Mixed Greens',
        calories: 15,
        carbs: 3,
        fats: 0,
        protein: 1,
      },
      {
        id: '3',
        name: 'Avocado',
        calories: 160,
        carbs: 8,
        fats: 15,
        protein: 2,
      },
      {
        id: '4',
        name: 'Olive Oil Dressing',
        calories: 120,
        carbs: 0,
        fats: 14,
        protein: 0,
      },
    ],
    totalCalories: 460,
    totalCarbs: 11,
    totalFats: 32.6,
    totalProtein: 34,
  },
  {
    name: 'Fruit and Yogurt Bowl',
    ingredients: [
      {
        id: '1',
        name: 'Greek Yogurt',
        calories: 100,
        carbs: 6,
        fats: 0,
        protein: 18,
      },
      {
        id: '2',
        name: 'Strawberries',
        calories: 50,
        carbs: 12,
        fats: 0,
        protein: 1,
      },
      {
        id: '3',
        name: 'Blueberries',
        calories: 40,
        carbs: 10,
        fats: 0,
        protein: 0.5,
      },
      {
        id: '4',
        name: 'Honey',
        calories: 60,
        carbs: 17,
        fats: 0,
        protein: 0,
      },
    ],
    totalCalories: 250,
    totalCarbs: 45,
    totalFats: 0,
    totalProtein: 19.5,
  },
  {
    name: 'Salmon with Vegetables',
    ingredients: [
      {
        id: '1',
        name: 'Grilled Salmon',
        calories: 206,
        carbs: 0,
        fats: 12,
        protein: 22,
      },
      {
        id: '2',
        name: 'Broccoli',
        calories: 55,
        carbs: 11,
        fats: 0.5,
        protein: 3.7,
      },
      {
        id: '3',
        name: 'Sweet Potato',
        calories: 112,
        carbs: 26,
        fats: 0.1,
        protein: 2,
      },
      {
        id: '4',
        name: 'Olive Oil',
        calories: 40,
        carbs: 0,
        fats: 4.5,
        protein: 0,
      },
    ],
    totalCalories: 413,
    totalCarbs: 37,
    totalFats: 17.1,
    totalProtein: 27.7,
  },
];

export function MealDetectionResultsModal({
  isOpen,
  onClose,
  imageData,
}: MealDetectionResultsModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();

  // State for the detected meal
  const [isLoading, setIsLoading] = useState(true);
  const [detectedMeal, setDetectedMeal] = useState<DetectedMeal | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedMealName, setEditedMealName] = useState('');
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);

  // Simulate meal detection when the modal opens
  useEffect(() => {
    if (isOpen && imageData) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        // Randomly select one of the sample meals
        const randomMeal =
          sampleDetectedMeals[Math.floor(Math.random() * sampleDetectedMeals.length)];
        setDetectedMeal(randomMeal);
        setEditedMealName(randomMeal.name);
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, imageData]);

  // Calculate totals based on current ingredients
  const calculateTotals = (ingredients: Ingredient[]) => {
    return ingredients.reduce(
      (acc, ingredient) => {
        return {
          totalCalories: acc.totalCalories + ingredient.calories,
          totalCarbs: acc.totalCarbs + ingredient.carbs,
          totalFats: acc.totalFats + ingredient.fats,
          totalProtein: acc.totalProtein + ingredient.protein,
        };
      },
      { totalCalories: 0, totalCarbs: 0, totalFats: 0, totalProtein: 0 },
    );
  };

  // Handle editing an ingredient
  const handleEditIngredient = (id: string, field: keyof Ingredient, value: string) => {
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
  };

  // Handle adding a new ingredient
  const handleAddIngredient = () => {
    if (!detectedMeal) return;

    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: 'New Ingredient',
      calories: 0,
      carbs: 0,
      fats: 0,
      protein: 0,
    };

    const updatedIngredients = [...detectedMeal.ingredients, newIngredient];
    const totals = calculateTotals(updatedIngredients);

    setDetectedMeal({
      ...detectedMeal,
      ingredients: updatedIngredients,
      ...totals,
    });

    // Set this new ingredient to edit mode
    setEditingIngredientId(newIngredient.id);
  };

  // Handle removing an ingredient
  const handleRemoveIngredient = (id: string) => {
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
  };

  // Handle saving the meal
  const handleSaveMeal = () => {
    if (!detectedMeal) return;

    // Create a new meal with the current time
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });

    const newMeal = {
      name: editedMealName || detectedMeal.name,
      time: currentTime,
      calories: detectedMeal.totalCalories,
      carbs: detectedMeal.totalCarbs,
      fats: detectedMeal.totalFats,
      protein: detectedMeal.totalProtein,
    };

    // Dispatch action to add the meal
    dispatch(addMeal(newMeal))
      .unwrap()
      .then(() => {
        dispatch(
          showSuccessToast({
            title: 'Meal Added',
            description: 'Your meal has been added to your log',
          }),
        );
        onClose();
      })
      .catch((error) => {
        console.error('Failed to add meal:', error);
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`relative w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <h2 className="text-xl font-bold">Meal Detection Results</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 max-h-[calc(100vh-8rem)] sm:max-h-[70vh]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium">Analyzing your meal...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Our AI is identifying ingredients and calculating nutrition information
                  </p>
                </div>
              ) : detectedMeal ? (
                <div className="space-y-6">
                  {/* Meal Image */}
                  {imageData && (
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

                  {/* Meal Name */}
                  <div className="flex items-center justify-between">
                    {editMode ? (
                      <Input
                        value={editedMealName}
                        onChange={(e) => setEditedMealName(e.target.value)}
                        className="text-lg font-bold"
                        placeholder="Enter meal name"
                      />
                    ) : (
                      <h3 className="text-lg font-bold">{editedMealName || detectedMeal.name}</h3>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
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
                        onClick={handleAddIngredient}
                        className="text-blue-500 border-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {detectedMeal.ingredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className={`p-3 rounded-lg ${
                            isDark ? 'bg-gray-800' : 'bg-gray-100'
                          } transition-all duration-200 ${
                            editingIngredientId === ingredient.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {editingIngredientId === ingredient.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <Input
                                  value={ingredient.name}
                                  onChange={(e) =>
                                    handleEditIngredient(ingredient.id, 'name', e.target.value)
                                  }
                                  className="flex-1"
                                  placeholder="Ingredient name"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingIngredientId(null)}
                                  className="ml-2"
                                >
                                  <Save className="h-4 w-4" />
                                  <span className="sr-only">Save</span>
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Calories
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.calories}
                                    onChange={(e) =>
                                      handleEditIngredient(
                                        ingredient.id,
                                        'calories',
                                        e.target.value,
                                      )
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Carbs (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.carbs}
                                    onChange={(e) =>
                                      handleEditIngredient(ingredient.id, 'carbs', e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Fats (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.fats}
                                    onChange={(e) =>
                                      handleEditIngredient(ingredient.id, 'fats', e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 block">
                                    Protein (g)
                                  </label>
                                  <Input
                                    type="number"
                                    value={ingredient.protein}
                                    onChange={(e) =>
                                      handleEditIngredient(ingredient.id, 'protein', e.target.value)
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
                                    onClick={() => setEditingIngredientId(ingredient.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveIngredient(ingredient.id)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="text-center p-1 bg-blue-500/10 rounded">
                                  <div className="text-xs text-gray-500">Calories</div>
                                  <div className="font-medium">{ingredient.calories}</div>
                                </div>
                                <div className="text-center p-1 bg-blue-500/10 rounded">
                                  <div className="text-xs text-gray-500">Carbs</div>
                                  <div className="font-medium">{ingredient.carbs}g</div>
                                </div>
                                <div className="text-center p-1 bg-yellow-500/10 rounded">
                                  <div className="text-xs text-gray-500">Fats</div>
                                  <div className="font-medium">{ingredient.fats}g</div>
                                </div>
                                <div className="text-center p-1 bg-green-500/10 rounded">
                                  <div className="text-xs text-gray-500">Protein</div>
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
                          {Math.round(detectedMeal.totalCalories)}
                        </div>
                        <div className="text-xs text-gray-500">Calories</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(detectedMeal.totalCarbs)}
                        </div>
                        <div className="text-xs text-gray-500">Carbs (g)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(detectedMeal.totalFats)}
                        </div>
                        <div className="text-xs text-gray-500">Fats (g)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {Math.round(detectedMeal.totalProtein)}
                        </div>
                        <div className="text-xs text-gray-500">Protein (g)</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg font-medium text-red-500">Failed to detect meal</p>
                  <p className="text-sm text-gray-500 mt-2">
                    We couldn&apos;t analyze your meal. Please try taking another photo with better
                    lighting.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`sticky bottom-0 p-4 border-t ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
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

            {/* Mobile-only bottom padding for safe area */}
            <div className="h-8 sm:hidden"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
