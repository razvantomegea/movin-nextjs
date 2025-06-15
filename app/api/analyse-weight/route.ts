import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Access Google AI API key
const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error('Missing GOOGLE_AI_API_KEY');
}

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(request: NextRequest) {
  try {
    // Extract data from request
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 },
      );
    }

    // Convert base64 to appropriate format for Google AI
    const base64Image = imageData;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
    ];

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
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonResponse = JSON.parse(text);
      return NextResponse.json({ success: true, data: jsonResponse });
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', text);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse weight data from image',
          rawResponse: text,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Weight analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze weight image' },
      { status: 500 },
    );
  }
}
