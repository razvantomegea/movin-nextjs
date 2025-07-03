import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    // Parse the request body
    const { mealDescription } = await request.json();

    if (
      !mealDescription ||
      typeof mealDescription !== 'string' ||
      mealDescription.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Meal description is required' }, { status: 400 });
    }

    // Initialize Google AI
    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a nutrition analyst. Analyze this meal description and provide detailed nutritional information: "${mealDescription}"

      Please extract and return ONLY a JSON object with the following structure:
      {
        "mealName": string (descriptive name of the meal/dish based on description),
        "mealScore": number (nutritional quality score from 0-100, where 100 is extremely healthy),
        "calories": number (total estimated calories),
        "protein": number (protein in grams),
        "carbohydrates": number (carbohydrates in grams),
        "fats": number (fats in grams),
        "fiber": number (fiber in grams),
        "ingredients": [
          {
            "name": string (ingredient name),
            "calories": number (calories from this ingredient),
            "protein": number (protein in grams from this ingredient),
            "carbohydrates": number (carbohydrates in grams from this ingredient),
            "fats": number (fats in grams from this ingredient),
            "fiber": number (fiber in grams from this ingredient)
          }
        ]
      }

      Rules:
      1. Interpret the description and identify all mentioned ingredients
      2. Provide realistic nutritional estimates based on the provided serving size
      3. Use standard food database values when possible.
      4. Break down each ingredient's nutritional contribution
      5. Ensure ingredient nutritional values sum up to the total meal values
      6. Use common food names and descriptions
      7. If the description is too vague or not food-related, return an error structure with "error": "Invalid meal description"
      8. Return only the JSON object, no additional text or formatting

      Meal Score Guidelines (0-100):
      - 90-100: Exceptional - High in nutrients, lean proteins, complex carbs, healthy fats, plenty of vegetables/fruits, minimal processing
      - 80-89: Very Good - Well-balanced with good nutrition, some vegetables, lean proteins, moderate processing
      - 70-79: Good - Decent nutrition but may lack vegetables or have some processed ingredients
      - 60-69: Fair - Basic nutrition, limited vegetables, some processed foods, moderate calories
      - 50-59: Average - Mixed nutritional value, possibly high in calories or lacking essential nutrients
      - 40-49: Below Average - High in calories/sugar/fat, minimal nutritional value, heavily processed
      - 30-39: Poor - Junk food, high calories, low nutrients, mostly processed ingredients
      - 20-29: Very Poor - Fast food, fried foods, high sugar/fat, minimal nutritional benefits
      - 10-19: Extremely Poor - Deep fried, candy, desserts, very high calories with no nutritional value
      - 0-9: Terrible - Pure junk, candy bars, sodas, chips with zero nutritional benefits

      Consider these factors for scoring:
      - Presence of vegetables and fruits (higher score)
      - Lean proteins vs fatty/processed meats
      - Whole grains vs refined carbohydrates
      - Cooking method (grilled/steamed vs fried)
      - Processing level (fresh vs packaged/processed)
      - Portion size appropriateness
      - Overall caloric density vs nutritional density
    `;

    // Call Google AI API
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = result.text ?? '';

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
    }

    try {
      const extractedData = JSON.parse(jsonMatch[0]);

      // Check if AI detected an error (invalid description)
      if (extractedData.error) {
        return NextResponse.json({ error: extractedData.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: extractedData,
      });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error analyzing meal description:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing meal description' },
      { status: 500 },
    );
  }
}
