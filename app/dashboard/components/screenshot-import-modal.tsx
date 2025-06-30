'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/cn';
import { IActivity } from '@/lib/supabase/activities';
import { doesActivityOverlap } from '@/utils';
import { extractDateFromText, isToday, isTodayMonthDay } from '@/utils';
import {
  mapScreenshotToActivity,
  type ExtractedActivityData,
} from '@/utils/movin/mapScreenshotToActivity';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveActivity: (activityData: Partial<IActivity>) => Promise<void>;
  userAddress: string;
  activities: IActivity[];
}

interface FileData {
  file: File;
  preview: string;
  extractedData?: ExtractedActivityData;
  error?: string;
  isProcessing?: boolean;
}

export function ScreenshotImportModal({
  isOpen,
  onClose,
  onSaveActivity,
  userAddress,
  activities,
}: ScreenshotImportModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { toast } = useToast();

  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFileData = useCallback((file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file,
          preview: e.target?.result as string,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file.';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB.';
    }
    return null;
  }, []);

  const handleFilesSelect = useCallback(
    async (selectedFiles: File[]) => {
      const newFiles: FileData[] = [];

      for (const file of selectedFiles) {
        const error = validateFile(file);
        if (error) {
          setGlobalError(`${file.name}: ${error}`);
          continue;
        }

        try {
          const fileData = await createFileData(file);
          newFiles.push(fileData);
        } catch (error) {
          console.error('Error creating file data:', error);
          setGlobalError(`Failed to process ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        setGlobalError(null);
      }
    },
    [validateFile, createFileData],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        await handleFilesSelect(imageFiles);
      }
    },
    [handleFilesSelect],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        await handleFilesSelect(filesArray);
      }
    },
    [handleFilesSelect],
  );

  const handleChooseFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveAllFiles = useCallback(() => {
    setFiles([]);
    setGlobalError(null);
  }, []);

  const processScreenshot = async (fileData: FileData): Promise<FileData> => {
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileData.file);
      });

      // Call the server API endpoint
      const response = await fetch('/api/analyse-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: fileData.file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze screenshot');
      }

      const { data: extractedData } = await response.json();

      if (!extractedData.isValidScreenshot) {
        throw new Error(
          'This image does not appear to be a valid fitness app or smartwatch screenshot.',
        );
      }

      const fileNameDate = extractDateFromText(fileData.file.name);
      const imageDate = extractedData.activityDate; // This is already expected to be YYYY-MM-DD

      let finalActivityDate: string | null = null;

      if (fileNameDate && imageDate) {
        if (fileNameDate !== imageDate) {
          throw new Error(
            `Date mismatch: File name suggests ${fileNameDate}, but screenshot says ${imageDate}.`,
          );
        }
        finalActivityDate = fileNameDate; // or imageDate, they are the same
      } else if (fileNameDate) {
        finalActivityDate = fileNameDate;
      } else if (imageDate) {
        finalActivityDate = imageDate;
      } else {
        throw new Error(
          'Could not determine the activity date from the file name or screenshot content.',
        );
      }

      if (!finalActivityDate) {
        // This case should ideally be caught by the block above, but as a safeguard:
        throw new Error('Activity date could not be verified.');
      }

      if (!isTodayMonthDay(finalActivityDate)) {
        throw new Error(
          `The activity date (${finalActivityDate}) must correspond to the current day and month. Only such activities can be imported.`,
        );
      }

      // Assign the validated date to extractedData to be used later
      // This ensures that if only fileNameDate was present, it's now part of extractedData for mapScreenshotToActivity
      extractedData.activityDate = finalActivityDate;

      if (!extractedData.isValidTiming) {
        throw new Error(
          'The activity time in the screenshot is invalid. Please ensure the activity was completed today.',
        );
      }

      return {
        ...fileData,
        extractedData,
        error: undefined,
      };
    } catch (error) {
      console.error('Error processing screenshot:', error);
      return {
        ...fileData,
        error: error instanceof Error ? error.message : 'Failed to process the screenshot.',
      };
    }
  };

  const processAllScreenshots = async () => {
    setIsProcessing(true);
    setGlobalError(null);

    // Update files to show processing state
    setFiles((prev) => prev.map((file) => ({ ...file, isProcessing: true, error: undefined })));

    try {
      const processedFiles = await Promise.all(
        files.map((fileData) => processScreenshot(fileData)),
      );

      setFiles(processedFiles.map((file) => ({ ...file, isProcessing: false })));
    } catch (error) {
      console.error('Error processing screenshots:', error);
      setGlobalError('Failed to process some screenshots. Please try again.');
      setFiles((prev) => prev.map((file) => ({ ...file, isProcessing: false })));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    const validFiles = files.filter((file) => file.extractedData && !file.error);

    if (validFiles.length === 0) {
      setGlobalError('No valid activities to save. Please process the screenshots first.');
      return;
    }

    setIsSaving(true);
    setGlobalError(null);

    const savedActivities: string[] = [];
    const failedActivities: string[] = [];

    for (const fileData of validFiles) {
      try {
        const todayData = {
          ...fileData.extractedData!,
          activityDate: new Date().toISOString().split('T')[0],
        };

        const activityData = mapScreenshotToActivity(todayData, userAddress);

        // Check for overlap
        const overlap = doesActivityOverlap(
          {
            start_date: activityData.start_date!,
            end_date: activityData.end_date!,
          },
          activities,
        );

        if (overlap) {
          failedActivities.push(`${activityData.name} (time overlap)`);
          continue;
        }

        await onSaveActivity(activityData);
        savedActivities.push(activityData.name || 'Unknown activity');
      } catch (error) {
        console.error('Failed to save activity:', error);
        failedActivities.push(fileData.extractedData?.name || 'Unknown activity');
      }
    }

    // Show results
    if (savedActivities.length > 0) {
      toast({
        title: 'Workouts Imported',
        description: `Successfully imported ${savedActivities.length} workout${
          savedActivities.length > 1 ? 's' : ''
        }: ${savedActivities.join(', ')}`,
      });
    }

    if (failedActivities.length > 0) {
      toast({
        title: 'Some Imports Failed',
        description: `Failed to import: ${failedActivities.join(', ')}`,
        variant: 'destructive',
      });
    }

    if (savedActivities.length > 0 && failedActivities.length === 0) {
      handleClose();
    } else {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setGlobalError(null);
    setIsProcessing(false);
    setIsSaving(false);
    onClose();
  };

  const hasValidActivities = files.some((file) => file.extractedData && !file.error);
  const hasUnprocessedFiles = files.some((file) => !file.extractedData && !file.error);

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
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } flex flex-col`}
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
                <h2 className="text-xl font-bold">Import Workouts from Screenshots</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Upload multiple screenshots of your fitness apps or smartwatch
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {/* Instructions */}
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>For best results, ensure your screenshots clearly show:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Activity date (must be today)</li>
                    <li>Device time at the top of the screen</li>
                    <li>Completion time</li>
                    <li>Workout name</li>
                    <li>Calories burned (if available)</li>
                    <li>Steps count and distance (if available)</li>
                    <li>Heart rate data (if available)</li>
                  </ul>
                  <p className="mt-2 text-sm font-medium">
                    Only activities from today will be accepted. The workout must be completed
                    before the current device time.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Global Error Display */}
              {globalError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              {/* File Upload Area */}
              {files.length === 0 && (
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
                  <h3 className="text-lg font-medium mb-2">Upload Screenshots</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    Click to browse, select multiple files, or paste from clipboard (Ctrl+V / Cmd+V)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleChooseFileClick}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              )}

              {/* Files List */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Selected Images ({files.length})</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleChooseFileClick}>
                        Add More
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRemoveAllFiles}>
                        Remove All
                      </Button>
                    </div>
                  </div>

                  {files.map((fileData, index) => (
                    <Card key={index} className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          {/* Preview */}
                          <div className="flex-shrink-0">
                            <Image
                              src={fileData.preview}
                              alt={`Screenshot ${index + 1}`}
                              width={120}
                              height={120}
                              className="rounded-lg object-cover"
                              unoptimized
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium truncate">
                                {fileData.file.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Processing State */}
                            {fileData.isProcessing && (
                              <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Processing...</span>
                              </div>
                            )}

                            {/* Error */}
                            {fileData.error && (
                              <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  {fileData.error}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Extracted Data */}
                            {fileData.extractedData && !fileData.error && (
                              <div className="mt-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Successfully Processed
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Activity:</span>
                                    <span className="ml-2">{fileData.extractedData.name}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Duration:</span>
                                    <span className="ml-2">
                                      {Math.floor(fileData.extractedData.duration / 60)}m{' '}
                                      {fileData.extractedData.duration % 60}s
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Calories:</span>
                                    <span className="ml-2">
                                      {fileData.extractedData.calories} kcal
                                    </span>
                                  </div>
                                  {fileData.extractedData.distance && (
                                    <div>
                                      <span className="font-medium">Distance:</span>
                                      <span className="ml-2">
                                        {(fileData.extractedData.distance / 1000).toFixed(2)} km
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Hidden file input for adding more files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`flex-shrink-0 p-6 border-t ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <div className="flex space-x-3">
                  {hasUnprocessedFiles && (
                    <Button
                      onClick={processAllScreenshots}
                      disabled={isProcessing || files.length === 0}
                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Analyze All ({files.length})
                        </>
                      )}
                    </Button>
                  )}
                  {hasValidActivities && (
                    <Button
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        `Save All Activities (${
                          files.filter((f) => f.extractedData && !f.error).length
                        })`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
