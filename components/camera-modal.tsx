'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw, Check } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
  instruction?: string;
  confirmText?: string;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Photo',
  instruction = 'Position your subject in the frame and tap the capture button',
  confirmText = 'Confirm & Continue',
}: CameraModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  }, [stream]);

  const initializeCamera = useCallback(async () => {
    try {
      // Reset states
      setError(null);
      setCapturedImage(null);
      setIsCameraReady(false);

      // Request camera access with rear camera preference
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be loaded before showing it
        const handleLoadedMetadata = () => {
          setIsCameraReady(true);
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

        // Cleanup function for the event listener
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          }
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions and try again.');
    }
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      const cleanup = initializeCamera();
      return () => {
        if (cleanup) {
          cleanup.then((cleanupFn) => cleanupFn?.());
        }
      };
    }
  }, [isOpen, capturedImage, initializeCamera]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
  }, [isOpen, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        // Stop camera after capture to prevent flicker
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Reinitialize camera when retaking
    initializeCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`relative w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <h2 className="text-xl font-bold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Camera View / Captured Image */}
            <div className="relative aspect-[4/3] w-full bg-black">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                      isCameraReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {!isCameraReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-10 w-10 text-white animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 h-full w-full">
                  <Image
                    src={capturedImage}
                    alt="Captured photo"
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              )}

              {/* Hidden canvas for capturing images */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Error message */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center p-4">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={initializeCamera}>Try Again</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 text-center">
              {!capturedImage ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{instruction}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Is this photo clear? Review before continuing.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              {!capturedImage ? (
                <div className="flex justify-center">
                  <Button
                    disabled={!isCameraReady || !!error}
                    onClick={handleCapture}
                    size="lg"
                    className="rounded-full h-16 w-16 bg-blue-500 hover:bg-blue-600"
                  >
                    <Camera className="h-8 w-8" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleRetake}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button onClick={handleConfirm} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    {confirmText}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile-only bottom padding for safe area */}
            <div className="h-8 sm:hidden"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
