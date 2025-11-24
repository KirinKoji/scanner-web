'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const startScanningRef = useRef<((cameraId?: string) => Promise<void>) | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScannedRef = useRef<string>('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScannerInitializedRef = useRef<boolean>(false);

  // Check and request camera permissions
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Try to use Permissions API if available
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permissionStatus.state === 'granted') {
            return true;
          }
          
          if (permissionStatus.state === 'prompt') {

            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach(track => track.stop());
              return true;
            } catch (err) {
              return false;
            }
          }

          return false;
        } catch (err) {
          // Permissions API might not support 'camera' name, fall through to getUserMedia
        }
      }
      
      // Fallback: Try to access camera directly (will trigger permission prompt)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err) {
        return false;
      }
    } catch (err) {
      console.error('Error requesting camera permission:', err);
      return false;
    }
  };

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current || lastScannedRef.current === decodedText) {
      return;
    }

    isProcessingRef.current = true;
    lastScannedRef.current = decodedText;

    try {
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/scan`
        : '/api/scan';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: decodedText,
        }),
      });

      if (response.ok) {

        setError('');
        setSuccessMessage('✅ Successfully recorded attendance!');

        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          try {
            await html5QrCodeRef.current.stop();
            setIsScanning(false);
          } catch (stopError) {
            console.error('Error stopping scanner:', stopError);
          }
        }
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 1500);
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        processingTimeoutRef.current = setTimeout(() => {
          lastScannedRef.current = '';
          isProcessingRef.current = false;
        }, 1500);
      } else {
        let errorMessage = 'Failed to send scan to server.';
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details ? `\n${errorData.details}` : '';
        } catch (parseError) {

          const textResponse = await response.text();
          if (textResponse.includes('<!DOCTYPE html>') || textResponse.includes('<html')) {
            errorMessage = 'Backend endpoint not found (404).';
            errorDetails = '\nPlease check if POST /attendance endpoint exists in your NestJS backend.';
          } else {
            errorDetails = `\n${textResponse.substring(0, 200)}`;
          }
        }
        
        setError(`${errorMessage}${errorDetails}`);
        isProcessingRef.current = false;
        lastScannedRef.current = '';
      }
    } catch (err) {
      console.error('Error sending scan:', err);
      setError('Failed to send scan. Please try again.');
      isProcessingRef.current = false;
      lastScannedRef.current = '';
    }
  }, []);

  const getErrorMessage = (err: unknown): string => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
      return 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
    }
    if (errorMessage.includes('NotFoundError') || errorMessage.includes('No camera found')) {
      return 'No camera found. Please ensure your device has a camera and try again.';
    }
    if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
      return 'Camera is already in use by another application. Please close other apps using the camera and try again.';
    }
    if (errorMessage.includes('OverconstrainedError')) {
      return 'Camera constraints not supported. Trying alternative camera...';
    }
    
    return 'Failed to start camera. Please check your browser permissions and try again.';
  };

  const startScanning = async (cameraId?: string) => {
    if (!scannerRef.current) return;

    // Prevent duplicate scanner initialization
    if (isScannerInitializedRef.current && html5QrCodeRef.current?.isScanning) {
      console.log('Scanner already initialized and running, skipping');
      return;
    }

    try {
      // Stop and clear any existing scanner completely
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        const container = document.getElementById('scanner-container');
        if (container) {
          container.innerHTML = '';
        }
        html5QrCodeRef.current = null;
      }

      // Mark as initializing
      isScannerInitializedRef.current = true;

      const html5QrCode = new Html5Qrcode('scanner-container');
      html5QrCodeRef.current = html5QrCode;

      startScanningRef.current = startScanning;

      const cameraConfig = cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 100,
          qrbox: { width: 450, height: 450 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: cameraId ? undefined : 'environment',
            frameRate: { ideal: 60, max: 60 },
          },
        },
        (decodedText) => {
          // QR code scanned successfully
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );

      // Fix video display after starting
      setTimeout(() => {
        const videoElement = document.querySelector('#scanner-container video') as HTMLVideoElement;
        if (videoElement) {
          videoElement.style.width = '100%';
          videoElement.style.height = 'auto';
          videoElement.style.objectFit = 'cover';
          videoElement.style.transform = 'scaleX(1)';
        }
      }, 100);

      setIsScanning(true);
      setError('');
      setCameraPermissionDenied(false);
    } catch (err) {
      console.error('Error starting scanner:', err);
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      setIsScanning(false);

      // If back camera fails, try user-facing camera
      if (!cameraId && !errorMsg.includes('Permission denied')) {
        try {
          await startScanningWithUserCamera();
        } catch (userCameraErr) {
          // If user camera also fails, show the original error
          setError(errorMsg);
        }
      } else if (errorMsg.includes('Permission denied')) {
        setCameraPermissionDenied(true);
      }
    }
  };

  const startScanningWithUserCamera = async () => {
    if (!scannerRef.current) return;

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode('scanner-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'user' },
        {
          fps: 120,
          qrbox: { width: 500, height: 500 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 60, max: 60 },
          },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setError('');
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (isScannerInitializedRef.current) {
      return;
    }

    startScanningRef.current = startScanning;
    const initTimeout = setTimeout(() => {
      if (!isScannerInitializedRef.current) {
        startScanning();
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      isScannerInitializedRef.current = false;
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(console.error);
        }

        const container = document.getElementById('scanner-container');
        if (container) {
          container.innerHTML = '';
        }
        html5QrCodeRef.current = null;
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };

  }, []);

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleRetry = async () => {
    setError('');
    setCameraPermissionDenied(false);
    await startScanning();
  };

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    setError('');
    
    try {
      const granted = await requestCameraPermission();
      
      if (granted) {

        await startScanning();
      } else {

        setError('Camera permission denied. Please allow camera access in your browser settings.');
        setCameraPermissionDenied(true);
      }
    } catch (err) {
      setError('Failed to request camera permission. Please check your browser settings.');
      setCameraPermissionDenied(true);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-semibold text-black dark:text-zinc-50">
          Scan QR Code
        </h1>

        <div className="mb-4 w-full rounded-lg overflow-hidden bg-black">
          <div
            id="scanner-container"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: '500px', position: 'relative' }}
          />
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg border-2 border-green-500 bg-green-50 p-6 text-green-800 dark:bg-green-950 dark:text-green-100 dark:border-green-600">
            <div className="mb-3">
              <p className="font-bold text-lg mb-2">{successMessage}</p>
              <p className="text-sm">Attendance recorded successfully! The display page will update shortly.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 p-6 text-red-800 dark:bg-red-950 dark:text-red-100 dark:border-red-600">
            <div className="mb-3">
              <p className="font-bold text-lg mb-2">⚠️ Camera Error</p>
              <p className="text-sm">{error}</p>
            </div>
            {cameraPermissionDenied && (
              <div className="mt-4 p-3 bg-white dark:bg-red-900 rounded border border-red-200 dark:border-red-700">
                <p className="font-semibold mb-2 text-sm">How to enable camera access:</p>
                <ul className="text-xs list-disc list-inside space-y-1 text-left text-red-700 dark:text-red-200">
                  <li>Look for a camera icon (📷) in your browser's address bar</li>
                  <li>Click it and select "Allow" or "Always allow"</li>
                  <li>If you don't see the icon, check your browser settings:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>Chrome/Edge:</strong> Settings → Privacy → Site Settings → Camera</li>
                      <li><strong>Firefox:</strong> Click the lock icon → Permissions → Camera → Allow</li>
                      <li><strong>Safari:</strong> Safari → Settings → Websites → Camera</li>
                    </ul>
                  </li>
                  <li>Or click the "Request Camera Permission" button below to trigger the permission prompt</li>
                </ul>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {cameraPermissionDenied && (
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequestingPermission}
                  className="w-full rounded-lg bg-green-500 px-6 py-2 text-white font-medium transition-colors hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRequestingPermission ? 'Requesting Permission...' : 'Request Camera Permission'}
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  disabled={isRequestingPermission}
                  className="flex-1 rounded-lg bg-blue-500 px-6 py-2 text-white font-medium transition-colors hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="rounded-lg bg-gray-500 px-4 py-2 text-white font-medium transition-colors hover:bg-gray-600"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="text-center">
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              Point your camera at the QR code
            </p>
            <button
              onClick={stopScanning}
              className="rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
            >
              Stop Scanning
            </button>
          </div>
        )}

        {!isScanning && !error && (
          <button
            onClick={handleRetry}
            className="w-full rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Start Scanning
          </button>
        )}
      </div>
    </div>
  );
}
