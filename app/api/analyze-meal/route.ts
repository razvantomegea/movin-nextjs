import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_AI_MODEL_NAME } from '@/constants';
import {
  initGoogleAI,
  processImageForAI,
  generateAIContentWithImage,
  extractJsonFromAIResponse,
} from '@/utils/googleAi';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    // Parse the request body
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    try {
      // Process the image data
      const processedImage = processImageForAI(imageData);

      // Initialize Google AI client
      const ai = initGoogleAI(apiKey);
      const modelName = GOOGLE_AI_MODEL_NAME;

      const prompt = `
        Analyze this food image and provide detailed nutritional information. The image should show a meal, dish, or food item. Include only the food(s) in the image.

        Please extract and return ONLY a JSON object with the following structure:
        {
          "mealName": string (descriptive name of the meal/dish),
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
        1. Identify all visible ingredients in the meal
        2. Provide realistic nutritional estimates based on the serving size of the food(s) in the image
        3. Break down each ingredient's nutritional contribution
        4. Ensure ingredient nutritional values sum up to the total meal values
        5. Use common food names and descriptions
        6. If the image is not clearly food, return an error structure with "error": "Not a food image"
        7. Be specific about cooking methods when relevant (grilled, fried, steamed, etc.)
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
      const responseText = await generateAIContentWithImage(ai, modelName, prompt, processedImage);

      // Extract JSON from response
      const extractedData = extractJsonFromAIResponse(responseText);

      if (!extractedData) {
        return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
      }

      // Check if AI detected an error (not a food image)
      if (extractedData.error) {
        return NextResponse.json({ error: extractedData.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: extractedData,
      });
    } catch (parseError) {
      console.error('Failed to process meal image:', parseError);
      Sentry.captureException(parseError);
      return NextResponse.json(
        {
          error: parseError instanceof Error ? parseError.message : 'Failed to parse AI response',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error analyzing meal:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing meal' },
      { status: 500 },
    );
  }
}
