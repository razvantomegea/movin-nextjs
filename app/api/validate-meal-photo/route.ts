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
    const { imageData, mealDescription } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Validate imageData format (must be a base64 data URL for supported image types)
    const imageDataUrlPattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    if (typeof imageData !== 'string' || !imageDataUrlPattern.test(imageData)) {
      return NextResponse.json(
        {
          error:
            'Invalid image format. Must be a base64-encoded image data URL (png, jpg, jpeg, gif, webp).',
        },
        { status: 400 },
      );
    }

    if (!mealDescription) {
      return NextResponse.json({ error: 'Meal description is required' }, { status: 400 });
    }

    try {
      // Process the image data
      const processedImage = processImageForAI(imageData);

      // Initialize Google AI client
      const ai = initGoogleAI(apiKey);
      const modelName = GOOGLE_AI_MODEL_NAME;

      const prompt = `
        You are tasked with validating whether a photo matches a meal description. Please analyze the provided image and compare it to the following meal description:

        **Meal Description:** "${mealDescription}"

        Please determine if the image accurately represents the described meal and return ONLY a JSON object with the following structure:
        {
          "isValid": boolean (true if the photo matches the meal description, false otherwise),
          "confidence": number (confidence score from 0-100, where 100 is completely certain),
          "reasoning": string (brief explanation of why the photo does or doesn't match),
          "detectedFood": string (what food/meal you see in the image),
          "matchScore": number (how well the photo matches the description, 0-100)
        }

        Validation Criteria:
        1. The image must clearly show food/meal items
        2. The food items in the image should correspond to the meal description
        3. Consider ingredients, cooking methods, presentation, and overall meal type
        4. Account for reasonable variations in preparation and presentation
        5. If the description mentions specific ingredients, they should be visible or reasonably inferred
        6. Consider portion sizes and meal composition

        Confidence Guidelines:
        - 90-100: Very confident match - food clearly matches description
        - 70-89: Good match - food generally matches with minor differences
        - 50-69: Moderate match - some similarities but notable differences
        - 30-49: Poor match - significant differences between photo and description
        - 10-29: Very poor match - little to no correlation
        - 0-9: No match - completely different food or not food at all

        Special Cases:
        - If the image doesn't show food at all, set isValid to false and confidence to 95-100
        - If the image is unclear or blurry, reduce confidence accordingly
        - If the description is very generic (like "meal" or "food"), be more lenient

        Return only the JSON object, no additional text or formatting.
      `;

      // Call Google AI API
      const responseText = await generateAIContentWithImage(ai, modelName, prompt, processedImage);

      // Extract JSON from response
      const extractedData = extractJsonFromAIResponse(responseText);

      if (!extractedData) {
        return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
      }

      // Validate the response structure
      if (
        typeof extractedData.isValid !== 'boolean' ||
        typeof extractedData.confidence !== 'number' ||
        typeof extractedData.reasoning !== 'string' ||
        typeof extractedData.detectedFood !== 'string' ||
        typeof extractedData.matchScore !== 'number'
      ) {
        return NextResponse.json({ error: 'Invalid response structure from AI' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        validation: extractedData,
      });
    } catch (parseError) {
      console.error('Failed to validate meal photo:', parseError);
      Sentry.captureException(parseError);
      return NextResponse.json(
        {
          error: parseError instanceof Error ? parseError.message : 'Failed to validate photo',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error validating meal photo:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error while validating meal photo' },
      { status: 500 },
    );
  }
}
