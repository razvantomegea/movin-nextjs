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
      Analyze this meal description and provide detailed nutritional information: "${mealDescription}"

      Please extract and return ONLY a JSON object with the following structure:
      {
        "mealName": string (descriptive name of the meal/dish based on description),
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
      1. Interpret the description and identify all mentioned or implied ingredients
      2. Provide realistic nutritional estimates based on typical serving sizes and preparation methods
      3. Break down each ingredient's nutritional contribution
      4. Ensure ingredient nutritional values sum up to the total meal values
      5. Use common food names and descriptions
      6. If the description is too vague or not food-related, return an error structure with "error": "Invalid meal description"
      7. Make reasonable assumptions about cooking methods and portion sizes
      8. If specific quantities are mentioned, use those; otherwise assume standard serving sizes
      9. Return only the JSON object, no additional text or formatting
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
