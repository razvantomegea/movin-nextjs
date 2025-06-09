'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { IActivity } from '@/lib/supabase/activities';
import {
  mapScreenshotToActivity,
  type ExtractedActivityData,
} from '@/utils/movin/mapScreenshotToActivity';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveActivity: (activityData: Partial<IActivity>) => void;
  userAddress: string;
}

export function ScreenshotImportModal({
  isOpen,
  onClose,
  onSaveActivity,
  userAddress,
}: ScreenshotImportModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedActivityData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setExtractedData(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    },
    [handleFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect],
  );

  const processScreenshot = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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
          "isValidTiming": boolean (true if activity time is from today and earlier than device time, or "Today" for Steps/Walking)
        }

        Rules:
        1. Set isValidScreenshot to false if this is not a fitness/health app screenshot
        2. Extract all visible numeric values for duration, distance, calories, steps
        3. Convert duration to seconds (e.g., "30:45" = 1845 seconds)
        4. Convert distance to meters (e.g., "5.2 km" = 5200 meters)
        5. Look for time stamps to determine deviceTime and activityTime
        6. Validate that activityTime is earlier than deviceTime and from today, OR set activityTime to "Today" for Steps/Walking activities that show cumulative daily data
        7. If any critical data is missing or unclear, make reasonable estimates based on activity type
        8. Return only the JSON object, no additional text or formatting
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      try {
        // Clean the response to extract just the JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        console.log('jsonMatch', jsonMatch);

        const extractedData: ExtractedActivityData = JSON.parse(jsonMatch[0]);

        console.log('extractedData', extractedData);

        if (!extractedData.isValidScreenshot) {
          setError(
            'This image does not appear to be a valid fitness app or smartwatch screenshot.',
          );
          return;
        }

        if (!extractedData.isValidTiming) {
          // Allow "Today" for Steps or Walking activities
          const isStepsOrWalking =
            extractedData.name.toLowerCase().includes('steps') ||
            extractedData.name.toLowerCase().includes('walking');
          const isTodayTime = extractedData.activityTime.toLowerCase() === 'today';

          if (!(isStepsOrWalking && isTodayTime)) {
            setError(
              'The activity time in the screenshot is invalid. Please ensure the activity was completed today and the timestamp is visible, or shows "Today" for steps/walking activities.',
            );
            return;
          }
        }

        setExtractedData(extractedData);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        setError(
          'Failed to analyze the screenshot. Please ensure the image clearly shows activity data.',
        );
      }
    } catch (error) {
      console.error('Error processing screenshot:', error);
      setError('Failed to process the screenshot. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!extractedData) return;

    const activityData = mapScreenshotToActivity(extractedData, userAddress);

    onSaveActivity(activityData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setExtractedData(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <div>
                <h2 className="text-xl font-bold">Import Activity from Screenshot</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Upload a screenshot of your fitness app or smartwatch
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Instructions */}
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>For best results, ensure your screenshot clearly shows:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Device time at the top of the screen</li>
                    <li>Activity completion time</li>
                    <li>Activity name</li>
                    <li>Calories burned</li>
                    <li>Steps count and distance (if available)</li>
                    <li>Heart rate data (if available)</li>
                  </ul>
                  <p className="mt-2 text-sm font-medium">
                    The activity must be from today and completed before the current device time.
                  </p>
                </AlertDescription>
              </Alert>

              {/* File Upload Area */}
              {!file && (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    isDark
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-300 hover:border-gray-400',
                  )}
                  tabIndex={0}
                  onPaste={handlePaste}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Upload Screenshot</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    Click to browse or paste from clipboard (Ctrl+V / Cmd+V)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}

              {/* Preview and Processing */}
              {file && (
                <div className="space-y-4">
                  <Card className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Selected Image</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                            setExtractedData(null);
                            setError(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {preview && (
                        <div className="flex justify-center mb-4">
                          <Image
                            src={preview}
                            alt="Screenshot preview"
                            width={400}
                            height={256}
                            className="max-h-64 w-auto rounded-lg shadow-sm"
                            unoptimized
                          />
                        </div>
                      )}

                      <div className="flex justify-center">
                        <Button
                          onClick={processScreenshot}
                          disabled={isProcessing}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Analyze Screenshot
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Extracted Data Display */}
                  {extractedData && (
                    <Card className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-3">Extracted Activity Data</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Activity:</span>
                            <span className="ml-2">{extractedData.name}</span>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">
                              {Math.floor(extractedData.duration / 60)}m{' '}
                              {extractedData.duration % 60}s
                            </span>
                          </div>
                          {extractedData.distance && (
                            <div>
                              <span className="font-medium">Distance:</span>
                              <span className="ml-2">
                                {(extractedData.distance / 1000).toFixed(2)} km
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Calories:</span>
                            <span className="ml-2">{extractedData.calories} kcal</span>
                          </div>
                          {extractedData.steps && (
                            <div>
                              <span className="font-medium">Steps:</span>
                              <span className="ml-2">{extractedData.steps.toLocaleString()}</span>
                            </div>
                          )}
                          {extractedData.heartRate?.average && (
                            <div>
                              <span className="font-medium">Avg HR:</span>
                              <span className="ml-2">{extractedData.heartRate.average} bpm</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end mt-4">
                          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
                            Save Activity
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
