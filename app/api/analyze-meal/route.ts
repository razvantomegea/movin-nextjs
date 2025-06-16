import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  initGoogleAIModel,
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

      // Initialize Google AI model
      const model = initGoogleAIModel(apiKey);

      const prompt = `
        Analyze this food image and provide detailed nutritional information. The image should show a meal, dish, or food item.

        Please extract and return ONLY a JSON object with the following structure:
        {
          "mealName": string (descriptive name of the meal/dish),
          "calories": number (total estimated calories),
          "protein": number (protein in grams),
          "carbohydrates": number (carbohydrates in grams),
          "fats": number (fats in grams),
          "ingredients": [
            {
              "name": string (ingredient name),
              "calories": number (calories from this ingredient),
              "protein": number (protein in grams from this ingredient),
              "carbohydrates": number (carbohydrates in grams from this ingredient),
              "fats": number (fats in grams from this ingredient)
            }
          ]
        }

        Rules:
        1. Identify all visible ingredients in the meal
        2. Provide realistic nutritional estimates based on typical serving sizes
        3. Break down each ingredient's nutritional contribution
        4. Ensure ingredient nutritional values sum up to the total meal values
        5. Use common food names and descriptions
        6. If the image is not clearly food, return an error structure with "error": "Not a food image"
        7. Be specific about cooking methods when relevant (grilled, fried, steamed, etc.)
        8. Return only the JSON object, no additional text or formatting
      `;

      // Call Google AI API
      const responseText = await generateAIContentWithImage(model, prompt, processedImage);

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
