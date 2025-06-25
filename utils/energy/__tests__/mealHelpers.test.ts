import {
  mapApiResponseToDetectedMeal,
  calculateTotals,
  generateUniqueIngredientId,
  mapIMealToDetectedMeal,
  ApiMealData,
  Ingredient,
} from '../mealHelpers';

describe('mapApiResponseToDetectedMeal', () => {
  it('maps API meal data to DetectedMeal format', () => {
    const apiData: ApiMealData = {
      mealName: 'Test Meal',
      ingredients: [
        { name: 'Chicken', calories: 200, carbohydrates: 0, fats: 5, protein: 30, fiber: 0 },
        { name: 'Rice', calories: 150, carbohydrates: 35, fats: 1, protein: 3, fiber: 1 },
      ],
      calories: 350,
      carbohydrates: 35,
      fats: 6,
      protein: 33,
      fiber: 1,
    };
    const result = mapApiResponseToDetectedMeal(apiData);
    expect(result.mealName).toBe('Test Meal');
    expect(result.ingredients.length).toBe(2);
    expect(result.calories).toBe(350);
    expect(result.carbohydrates).toBe(35);
    expect(result.fats).toBe(6);
    expect(result.protein).toBe(33);
    expect(result.fiber).toBe(1);
    result.ingredients.forEach((ingredient) => {
      expect(ingredient.id).toMatch(/^ingredient_/);
    });
  });
});

describe('calculateTotals', () => {
  it('calculates totals for a list of ingredients', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'A', calories: 100, carbohydrates: 10, fats: 2, protein: 5, fiber: 1 },
      { id: '2', name: 'B', calories: 200, carbohydrates: 20, fats: 3, protein: 10, fiber: 2 },
    ];
    const totals = calculateTotals(ingredients);
    expect(totals).toEqual({ calories: 300, carbohydrates: 30, fats: 5, protein: 15, fiber: 3 });
  });

  it('returns zeros for empty ingredient list', () => {
    expect(calculateTotals([])).toEqual({
      calories: 0,
      carbohydrates: 0,
      fats: 0,
      protein: 0,
      fiber: 0,
    });
  });
});

describe('generateUniqueIngredientId', () => {
  it('generates unique IDs', () => {
    const id1 = generateUniqueIngredientId();
    const id2 = generateUniqueIngredientId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^ingredient_/);
    expect(id2).toMatch(/^ingredient_/);
  });
});

describe('mapIMealToDetectedMeal', () => {
  it('maps IMeal to DetectedMeal with a single ingredient', () => {
    const meal = {
      meal_name: 'Omelette',
      calories: 250,
      protein: 15,
      carbohydrates: 2,
      fats: 20,
      fiber: 1,
    };
    const detected = mapIMealToDetectedMeal(meal as any);
    expect(detected.mealName).toBe('Omelette');
    expect(detected.calories).toBe(250);
    expect(detected.protein).toBe(15);
    expect(detected.carbohydrates).toBe(2);
    expect(detected.fats).toBe(20);
    expect(detected.fiber).toBe(1);
    expect(detected.ingredients.length).toBe(1);
    expect(detected.ingredients[0].name).toBe('Omelette');
    expect(detected.ingredients[0].calories).toBe(250);
  });
});
