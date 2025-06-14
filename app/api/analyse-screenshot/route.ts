import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    // Parse the request body
    const { imageData, mimeType } = await req.json();

    if (!imageData || !mimeType) {
      return NextResponse.json({ error: 'Image data and mime type are required' }, { status: 400 });
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Analyze this screenshot and extract fitness activity data. The image should be from a mobile fitness app or smartwatch showing workout statistics.

      Please extract and return ONLY a JSON object with the following structure:
      {
        "isValidScreenshot": boolean (true if this is clearly a fitness app/smartwatch screenshot),
        "name": string (type of activity like "Running", "Walking", "Cycling", etc.),
        "duration": number (total duration in seconds),
        "distance": number (distance in meters, if available),
        "calories": number (calories burned),
        "steps": number (step count, if available),
        "heartRate": {
          "average": number (if available),
          "maximum": number (if available),
          "minimum": number (if available)
        },
        "deviceTime": string (current time shown on device in format "HH:MM"),
        "activityTime": string (when the activity was completed in format "HH:MM" or "Today" for cumulative activities),
        "activityDate": string (the date of the activity in ISO format "YYYY-MM-DD"),
        "isValidTiming": boolean (true if activity time is from today and earlier than device time, or "Today" for Steps/Walking)
      }

      Rules:
      1. Set isValidScreenshot to false if this is not a fitness/health app screenshot
      2. Extract all visible numeric values for duration, distance, calories, steps
      3. Convert duration to seconds (e.g., "30:45" = 1845 seconds)
      4. Convert distance to meters (e.g., "5.2 km" = 5200 meters)
      5. Look for time stamps to determine deviceTime and activityTime
      6. Extract the activity date from the screenshot. It MUST be today's date in YYYY-MM-DD format
      7. Validate that activityTime is earlier than deviceTime and from today, OR set activityTime to "Today" for Steps/Walking activities that show cumulative daily data
      8. If any critical data is missing or unclear, make reasonable estimates based on activity type
      9. Return only the JSON object, no additional text or formatting
    `;

    // Call Google AI API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageData,
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

      // Ensure activity date is set to today if missing
      if (!extractedData.activityDate) {
        extractedData.activityDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      return NextResponse.json({ data: extractedData });
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    return NextResponse.json({ error: 'Failed to analyze screenshot' }, { status: 500 });
  }
}
