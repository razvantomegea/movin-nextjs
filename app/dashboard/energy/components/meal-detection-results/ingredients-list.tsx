import React from 'react';
import { Edit2, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IngredientsListProps } from './types';

export function IngredientsList({
  detectedMeal,
  editingState,
  isEditingDisabled,
  isEditing,
  initialMealData,
  onEditIngredient,
  onSaveIngredientEdit,
  onAddIngredient,
  onRemoveIngredient,
  onEditIngredientName,
  onEditIngredientField,
  isDark,
}: IngredientsListProps) {
  const { editingIngredientId, isAnalyzingIngredient } = editingState;

  const isAddIngredientDisabled = Boolean(
    isEditing &&
      initialMealData &&
      detectedMeal.ingredients.length === 1 &&
      detectedMeal.ingredients[0].name === initialMealData.meal_name,
  );

  return (
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
            disabled={isAddIngredientDisabled}
            onClick={onAddIngredient}
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
          Camera-based meals are analyzed by AI and cannot be edited to ensure accuracy. The
          ingredients and nutrition information are automatically detected from your photo.
        </p>
      )}

      {isEditing &&
        initialMealData &&
        detectedMeal.ingredients.length === 1 &&
        detectedMeal.ingredients[0].name === initialMealData.meal_name && (
          <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Editing overall nutrition for &quot;{initialMealData.meal_name}&quot;. To edit
            individual ingredients, log this as a new meal for full analysis.
          </p>
        )}

      <div className="space-y-3">
        {detectedMeal.ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className={`p-3 rounded-lg transition-all duration-200 ${
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            } ${editingIngredientId === ingredient.id ? 'ring-2 ring-blue-500' : ''} ${
              isAnalyzingIngredient && editingIngredientId === ingredient.id ? 'opacity-75' : ''
            }`}
          >
            {editingIngredientId === ingredient.id ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => onEditIngredientName(ingredient.id, e.target.value)}
                    className="flex-1"
                    placeholder="Ingredient name"
                    disabled={isAnalyzingIngredient}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSaveIngredientEdit}
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
                    className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium`}
                  >
                    Analyzing ingredient and updating nutrition data...
                  </div>
                )}
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label
                      className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Calories
                    </label>
                    <Input
                      type="number"
                      value={ingredient.calories}
                      onChange={(e) =>
                        onEditIngredientField(ingredient.id, 'calories', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Carbs (g)
                    </label>
                    <Input
                      type="number"
                      value={ingredient.carbohydrates}
                      onChange={(e) =>
                        onEditIngredientField(ingredient.id, 'carbohydrates', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Fats (g)
                    </label>
                    <Input
                      type="number"
                      value={ingredient.fats}
                      onChange={(e) => onEditIngredientField(ingredient.id, 'fats', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Protein (g)
                    </label>
                    <Input
                      type="number"
                      value={ingredient.protein}
                      onChange={(e) =>
                        onEditIngredientField(ingredient.id, 'protein', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label
                      className={`text-xs mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Fiber (g)
                    </label>
                    <Input
                      type="number"
                      value={ingredient.fiber}
                      onChange={(e) =>
                        onEditIngredientField(ingredient.id, 'fiber', e.target.value)
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
                        onClick={() => onEditIngredient(ingredient.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveIngredient(ingredient.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  <div className="text-center p-1 bg-blue-500/10 rounded">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Calories
                    </div>
                    <div className="font-medium">{ingredient.calories}</div>
                  </div>
                  <div className="text-center p-1 bg-blue-500/10 rounded">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Carbs
                    </div>
                    <div className="font-medium">{ingredient.carbohydrates}g</div>
                  </div>
                  <div className="text-center p-1 bg-yellow-500/10 rounded">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Fats
                    </div>
                    <div className="font-medium">{ingredient.fats}g</div>
                  </div>
                  <div className="text-center p-1 bg-green-500/10 rounded">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Protein
                    </div>
                    <div className="font-medium">{ingredient.protein}g</div>
                  </div>
                  <div className="text-center p-1 bg-purple-500/10 rounded">
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
  );
}
