import * as Sentry from '@sentry/nextjs';
import { NextResponse, NextRequest } from 'next/server';
import {
  initGoogleAI,
  processImageForAI,
  generateAIContentWithImage,
  extractJsonFromAIResponse,
} from '@/utils/googleAi';

export async function POST(request: NextRequest) {
  try {
    // Access Google AI API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Google AI API key not configured' },
        { status: 500 },
      );
    }

    // Extract data from request
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 },
      );
    }

    try {
      // Process the image data
      const processedImage = processImageForAI(imageData);

      // Initialize Google AI client
      const ai = initGoogleAI(apiKey);
      const modelName = 'gemini-2.0-flash-001';

      // Prompt for the AI model to extract weight information
      const prompt = `
      You are a weight scale analysis system. Analyze this image of a weight scale or fitness app and extract the weight value.
      
      Focus ONLY on extracting:
      1. The main weight value displayed (ignore other metrics like body fat percentage, BMI, etc.)
      2. The unit of measurement (kg, lb, etc.)
      
      If the image clearly shows a weight scale or fitness app with a weight value, respond with:
      {
        "isValidScale": true,
        "weight": [NUMERIC_VALUE_ONLY],
        "unit": "[UNIT_OF_MEASUREMENT]"
      }
      
      If the image does not appear to be a weight scale or fitness app, or if you cannot reliably extract a weight value, respond with:
      {
        "isValidScale": false
      }
      
      Return ONLY valid JSON - no additional text, explanation, or commentary.
      `;

      // Generate content using Google AI
      const responseText = await generateAIContentWithImage(ai, modelName, prompt, processedImage);

      // Extract JSON from response
      const jsonResponse = extractJsonFromAIResponse(responseText);

      if (!jsonResponse) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to parse weight data from image',
            rawResponse: responseText,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data: jsonResponse });
    } catch (e) {
      console.error('Weight analysis processing error:', e);
      Sentry.captureException(e);
      return NextResponse.json(
        {
          success: false,
          error: e instanceof Error ? e.message : 'Failed to process weight data from image',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Weight analysis error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze weight image' },
      { status: 500 },
    );
  }
}
