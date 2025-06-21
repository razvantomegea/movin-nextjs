import { GoogleGenAI } from '@google/genai';

/**
 * Default MIME type to use when not specified
 */
export const DEFAULT_MIME_TYPE = 'image/jpeg';

/**
 * Interface for processed image data
 */
export interface ProcessedImageData {
  base64Data: string;
  mimeType: string;
}

/**
 * Process image data for Google AI API
 *
 * Handles both data URL format and raw base64 strings
 *
 * @param imageData - The image data as a data URL or base64 string
 * @returns Object containing base64Data and mimeType
 */
export function processImageForAI(imageData: string): ProcessedImageData {
  if (!imageData) {
    throw new Error('No image data provided');
  }

  let base64Data: string;
  let mimeType: string;

  // Handle data URL format (data:image/jpeg;base64,...)
  if (imageData.startsWith('data:')) {
    const [header, data] = imageData.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    mimeType = mimeMatch ? mimeMatch[1] : DEFAULT_MIME_TYPE;
    base64Data = data;
  } else {
    // Assume it's already base64 data
    base64Data = imageData;
    mimeType = DEFAULT_MIME_TYPE;
  }

  return { base64Data, mimeType };
}

/**
 * Initialize Google AI client
 *
 * @param apiKey - The Google AI API key
 * @returns The initialized GoogleGenAI client
 */
export function initGoogleAI(apiKey: string) {
  if (!apiKey) {
    throw new Error('Google AI API key is required');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Extract JSON from AI response text
 *
 * @param text - The response text from Google AI
 * @returns Parsed JSON object or null if no JSON found
 */
export function extractJsonFromAIResponse(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    return null;
  }
}

/**
 * Generate AI content with image
 *
 * @param ai - The initialized Google AI client
 * @param modelName - The model to use
 * @param prompt - The prompt to send to the model
 * @param imageData - Processed image data from processImageForAI
 * @returns The AI response text
 */
export async function generateAIContentWithImage(
  ai: GoogleGenAI,
  modelName: string,
  prompt: string,
  imageData: ProcessedImageData,
) {
  const result = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageData.base64Data,
              mimeType: imageData.mimeType,
            },
          },
        ],
      },
    ],
  });

  return result.text ?? '';
}
