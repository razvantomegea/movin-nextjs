import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    // Parse the request body
    const { ingredientName } = await request.json();

    if (
      !ingredientName ||
      typeof ingredientName !== 'string' ||
      ingredientName.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Ingredient name is required' }, { status: 400 });
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze this single ingredient and provide detailed nutritional information: "${ingredientName}"

      Please extract and return ONLY a JSON object with the following structure:
      {
        "name": string (cleaned/standardized ingredient name),
        "calories": number (estimated calories for a typical serving),
        "protein": number (protein in grams),
        "carbohydrates": number (carbohydrates in grams),
        "fats": number (fats in grams)
      }

      Rules:
      1. Provide realistic nutritional estimates based on typical serving sizes for this ingredient
      2. Use standard food database values when possible
      3. If the ingredient name is unclear or not food-related, return an error structure with "error": "Invalid ingredient name"
      4. Make reasonable assumptions about preparation (raw vs cooked) based on the ingredient type
      5. Assume a standard single serving size appropriate for the ingredient type
      6. Return only the JSON object, no additional text or formatting
      7. Use clean, standardized ingredient names (e.g., "Chicken Breast" instead of "chicken breast meat")
    `;

    // Call Google AI API
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    const text = response.text();

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
    }

    try {
      const extractedData = JSON.parse(jsonMatch[0]);

      // Check if AI detected an error (invalid ingredient)
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
    console.error('Error analyzing ingredient:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing ingredient' },
      { status: 500 },
    );
  }
}
