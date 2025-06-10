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
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Handle data URL format (data:image/jpeg;base64,...)
    let base64Data: string;
    let mimeType: string;

    if (imageData.startsWith('data:')) {
      const [header, data] = imageData.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      base64Data = data;
    } else {
      // Assume it's already base64 data
      base64Data = imageData;
      mimeType = 'image/jpeg';
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean the response to extract just the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
    }

    try {
      const extractedData = JSON.parse(jsonMatch[0]);

      // Check if AI detected an error (not a food image)
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
    console.error('Error analyzing meal:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing meal' },
      { status: 500 },
    );
  }
}
