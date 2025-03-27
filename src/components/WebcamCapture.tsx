
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WebcamCaptureProps {
  onCapture: (images: string[]) => void;
}

type FilterType = 'Normal' | 'Warm' | 'Cool' | 'Vintage' | 'B&W' | 'Soft' | 'Instax' | 'DV';

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Normal');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(0);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      toast.error("Could not access webcam. Please allow camera access and try again.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach((track) => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataURL = canvas.toDataURL('image/jpeg');
        const newCapturedImages = [...capturedImages, imageDataURL];
        
        setCapturedImages(newCapturedImages);
        setPhotoCount(prevCount => prevCount + 1);
        
        // Update the parent component with the images taken so far
        onCapture(newCapturedImages);
        
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
      }
    }
  }, [capturedImages, onCapture]);

  // Effect to handle completing the photo strip
  useEffect(() => {
    if (photoCount === 4) {
      toast.success("Photo strip complete!");
      
      // Wait before resetting for next session
      const resetTimer = setTimeout(() => {
        setPhotoCount(0);
        setCapturedImages([]);
      }, 3000);
      
      return () => clearTimeout(resetTimer);
    } else if (photoCount > 0 && photoCount < 4) {
      // Continue taking photos for the strip
      const timer = setTimeout(() => {
        startCountdown();
      }, 1500); // 1.5 second pause between photos
      
      return () => clearTimeout(timer);
    }
  }, [photoCount]);

  const startCountdown = useCallback(() => {
    setCountdownValue(3);
    
    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          captureImage();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  }, [captureImage]);

  const startPhotoSession = useCallback(() => {
    // Reset any existing photos
    setCapturedImages([]);
    setPhotoCount(0);
    
    // Reset parent component photo strip
    onCapture([]);
    
    // Start the first countdown
    startCountdown();
  }, [startCountdown, onCapture]);

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  const getFilterClassName = () => {
    switch (activeFilter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Soft': return 'brightness-105 contrast-95 saturate-95';
      case 'Instax': return 'brightness-110 contrast-105 saturate-115 hue-rotate-[5deg]';
      case 'DV': return 'contrast-120 saturate-80 brightness-95 hue-rotate-[-5deg]';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Main Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4 w-full">
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-10 animate-shutter-flash" />
        )}
        
        <div className="relative">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${getFilterClassName()}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {countdownValue && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
              <div className="bg-white/90 rounded-xl w-16 h-16 flex items-center justify-center">
                <span className="text-5xl font-bold text-pink-500">
                  {countdownValue}
                </span>
              </div>
            </div>
          )}
          
          {photoCount > 0 && photoCount < 4 && !countdownValue && (
            <div className="absolute top-3 right-3 bg-white/80 px-2 py-1 rounded-md z-10">
              <span className="text-xs font-medium text-gray-700">
                {photoCount}/4
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Filter Selection */}
      <div className="mb-4 w-full">
        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Choose a filter</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <ToggleGroup type="single" value={activeFilter} onValueChange={(value) => value && setActiveFilter(value as FilterType)}>
            <ToggleGroupItem value="Normal" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              Normal
            </ToggleGroupItem>
            <ToggleGroupItem value="B&W" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              BW
            </ToggleGroupItem>
            <ToggleGroupItem value="Vintage" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              Vintage
            </ToggleGroupItem>
            <ToggleGroupItem value="Soft" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              Soft
            </ToggleGroupItem>
            <ToggleGroupItem value="Instax" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              Instax
            </ToggleGroupItem>
            <ToggleGroupItem value="DV" className="rounded-full text-xs px-4 py-2 data-[state=on]:bg-pink-400 data-[state=on]:text-white">
              DV
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Capture Button */}
      <button 
        onClick={startPhotoSession}
        disabled={!isStreaming || countdownValue !== null || (photoCount > 0 && photoCount < 4)}
        className="w-full bg-pink-400 text-white font-medium py-3 px-8 rounded-full transition-all 
                 hover:bg-pink-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Camera className="w-5 h-5 mr-2" />
        {photoCount === 0 ? 'Capturing...' : 'Continue'}
      </button>
      
      {/* Refresh Camera */}
      <button 
        onClick={() => {
          stopWebcam();
          setTimeout(startWebcam, 300);
        }}
        className="mt-2 text-xs text-gray-500 flex items-center justify-center"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Refresh camera
      </button>
    </div>
  );
};

export default WebcamCapture;
