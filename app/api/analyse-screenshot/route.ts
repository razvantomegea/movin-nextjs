import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  initGoogleAI,
  processImageForAI,
  generateAIContentWithImage,
  extractJsonFromAIResponse,
} from '@/utils/googleAi';

export async function POST(req: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured' }, { status: 500 });
    }

    // Parse the request body
    const { imageData, mimeType } = await req.json();

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    try {
      // Process the image data - use provided mimeType if available
      const processedImage = processImageForAI(imageData);
      if (mimeType) {
        processedImage.mimeType = mimeType;
      }

      // Initialize Google AI client
      const ai = initGoogleAI(apiKey);
      const modelName = 'gemini-2.0-flash-001';

      const prompt = `
        Analyze this screenshot and extract fitness activity data. The image should be from a mobile fitness app or smartwatch showing workout statistics.

        CRITICAL: Extract ONLY the exact values you see displayed in the image. Do NOT perform any unit conversions or mathematical operations.

        Look for these specific metrics in the screenshot:
        - Distance: Look for values with "m", "meters", "km", "kilometers", "mi", "miles", "mil" 
        - Steps: Look for step counts (usually large numbers like 8,234 steps)
        - Calories: Look for "kcal", "cal", "calories" - extract the EXACT number shown
        - Heart Rate: Look for "bpm", "HR", heart rate values
        - Duration: Look for time formats like "30:45", "1h 15m", "45 min"
        - Date: Look for dates in any format (MM/DD, DD/MM/YYYY, "Today", etc.)

        Please extract and return ONLY a JSON object with the following structure:
        {
          "isValidScreenshot": boolean (true if this is clearly a fitness app/smartwatch screenshot),
          "name": string (type of activity like "Running", "Walking", "Cycling", "Steps", etc.),
          "duration": number (total duration in seconds - convert time formats to seconds),
          "distance": number (distance in meters - convert km to meters by multiplying by 1000, miles to meters by multiplying by 1609),
          "calories": number (calories burned - extract EXACT number shown, do NOT multiply by 1000),
          "steps": number (step count if available - extract exact number shown),
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

        EXTRACTION RULES:
        1. Set isValidScreenshot to false if this is not a fitness/health app screenshot
        2. For calories: Extract the EXACT number you see. If you see "805 kcal", return 805. Do NOT multiply by 1000.
        3. For distance: If you see "5.2 km", convert to meters (5200). If you see "500 m", use 500.
        4. For steps: Extract the exact number shown (e.g., "8,234 steps" = 8234)
        5. For duration: Convert to seconds (e.g., "30:45" = 1845 seconds, "1h 15m" = 4500 seconds)
        6. For heart rate: Extract BPM values exactly as shown
        7. Look for time stamps to determine deviceTime and activityTime
        8. Extract the activity date from the screenshot. It MUST be today's date in YYYY-MM-DD format
        9. Validate that activityTime is earlier than deviceTime and from today, OR set activityTime to "Today" for Steps/Walking activities that show cumulative daily data
        10. If any critical data is missing or unclear, make reasonable estimates based on activity type
        11. Pay attention to unit labels: "kcal" means kilocalories, "cal" means calories, "km" means kilometers, "m" means meters
        12. Return only the JSON object, no additional text or formatting
      `;

      // Call Google AI API
      const responseText = await generateAIContentWithImage(ai, modelName, prompt, processedImage);

      // Extract JSON from response
      const extractedData = extractJsonFromAIResponse(responseText);

      if (!extractedData) {
        return NextResponse.json({ error: 'No valid JSON found in AI response' }, { status: 500 });
      }

      // Ensure activity date is set to today if missing
      if (!extractedData.activityDate) {
        extractedData.activityDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      return NextResponse.json({ data: extractedData });
    } catch (parseError) {
      console.error('Failed to process screenshot:', parseError);
      Sentry.captureException(parseError);
      return NextResponse.json(
        {
          error: parseError instanceof Error ? parseError.message : 'Failed to parse AI response',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Failed to analyze screenshot' }, { status: 500 });
  }
}
