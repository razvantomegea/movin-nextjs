'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';

// Helper to detect iOS PWA standalone mode
function isIosStandalone() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isStandalone = (window.navigator as unknown as { standalone: boolean }).standalone === true;
  return isIOS && isStandalone;
}

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
  const [isInitializing, setIsInitializing] = useState(false);
  const [showIosPwaWarning, setShowIosPwaWarning] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
  }, [stream]);

  const checkCameraSupport = () => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported on this device or browser');
    }

    // Check if we're in a secure context (required for camera access)
    if (
      !window.isSecureContext &&
      location.protocol !== 'https:' &&
      location.hostname !== 'localhost'
    ) {
      throw new Error('Camera requires HTTPS connection');
    }
  };

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);
      setIsCameraReady(false);
      setIsInitializing(true);
      setShowIosPwaWarning(false);
      checkCameraSupport();
      console.log('PWA Camera: Requesting camera access...');
      const constraints = [
        // Preferred: Rear camera with high quality
        {
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          },
          audio: false,
        },
        // Fallback 1: Rear camera with lower quality
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 800, max: 1280 },
            height: { ideal: 600, max: 720 },
          },
          audio: false,
        },
        // Fallback 2: Any camera with basic constraints
        {
          video: {
            width: { ideal: 640, max: 800 },
            height: { ideal: 480, max: 600 },
          },
          audio: false,
        },
        // Final fallback: Basic video only
        {
          video: true,
          audio: false,
        },
      ];
      let mediaStream: MediaStream | null = null;
      let lastError: Error | null = null;
      for (const constraint of constraints) {
        try {
          console.log('PWA Camera: Trying constraint:', constraint);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('PWA Camera: Success with constraint:', constraint);
          break;
        } catch (err) {
          console.warn('PWA Camera: Failed with constraint:', constraint, err);
          Sentry.captureException(err);
          lastError = err as Error;
          continue;
        }
      }
      if (!mediaStream) {
        throw lastError || new Error('Could not access camera with any configuration');
      }
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Retry mechanism for video.play() (iOS PWA workaround)
        let playResolved = false;
        for (let i = 0; i < 5; i++) {
          try {
            await new Promise((res) => setTimeout(res, 300 * i));
            await videoRef.current.play();
            playResolved = true;
            break;
          } catch (e) {
            // Try again
          }
        }
        if (!playResolved) {
          // iOS PWA bug likely
          if (isIosStandalone()) {
            setShowIosPwaWarning(true);
            setError(
              'Camera preview failed to start. This is a known iOS PWA limitation. For best results, open this page in Safari.',
            );
          } else {
            setError('Camera preview failed to start. Please check permissions and try again.');
          }
          setIsInitializing(false);
          return;
        }
      }
    } catch (err) {
      console.error('PWA Camera: Error accessing camera:', err);
      Sentry.captureException(err);
      setIsInitializing(false);

      const error = err as Error;
      let errorMessage = 'Could not access camera. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please grant camera permission and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the required settings.';
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Camera access is not allowed in this context.';
      } else {
        errorMessage += error.message || 'Please check permissions and try again.';
      }

      setError(errorMessage);
    }
  }, []);

  // Add useEffect for video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const handleLoadedMetadata = () => {
      console.log('PWA Camera: Video metadata loaded');
      setTimeout(() => {
        setIsCameraReady(true);
        setIsInitializing(false);
      }, 500);
    };
    const handleCanPlay = () => {
      console.log('PWA Camera: Video can play');
    };
    const handleError = (e: Event) => {
      console.error('PWA Camera: Video error:', e);
      setError('Failed to display camera feed');
      setIsInitializing(false);
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [stream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      initializeCamera();
    }
  }, [isOpen, capturedImage, initializeCamera]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
      setIsInitializing(false);
    }
  }, [isOpen, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to data URL with good quality
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        console.log('PWA Camera: Image captured successfully');

        // Stop camera after capture to prevent flicker
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
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

  const handleTryAgain = () => {
    setError(null);
    initializeCamera();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={undefined}
      preventBackdropClose={false}
      contentClassName="p-0"
      footer={
        <div
          className={`p-4 border-t safe-bottom ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
        >
          {!capturedImage ? (
            <div className="flex justify-center">
              <Button
                disabled={!isCameraReady || !!error || isInitializing}
                onClick={handleCapture}
                size="lg"
                className="rounded-full h-16 w-16 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
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
      }
    >
      {/* Camera View / Captured Image */}
      <div className="relative w-full bg-black h-[65vh] sm:h-auto sm:aspect-[4/3]">
        {showIosPwaWarning && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-yellow-200 text-yellow-900 p-3 text-center text-sm font-semibold">
            <span>
              Camera preview may not work in iOS PWA mode. For best results, open this page in
              Safari.{' '}
              <a
                href="https://bugs.webkit.org/show_bug.cgi?id=252465"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Learn more
              </a>
            </span>
          </div>
        )}
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
            {(isInitializing || (!isCameraReady && !error)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RefreshCw className="h-10 w-10 text-white animate-spin mb-4" />
                <p className="text-white text-sm">Starting camera...</p>
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center p-6 max-w-sm">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4 text-sm leading-relaxed">{error}</p>
              <div className="space-y-2">
                <Button onClick={handleTryAgain} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
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
    </BaseModal>
  );
}
