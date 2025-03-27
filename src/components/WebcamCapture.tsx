import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WebcamCaptureProps {
  onCapture: (images: string[]) => void;
}

type FilterType = 'Normal' | 'Warm' | 'Cool' | 'Vintage' | 'B&W' | 'Dramatic';

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
        
        onCapture(newCapturedImages);
        
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
      }
    }
  }, [capturedImages, onCapture]);

  useEffect(() => {
    if (photoCount === 4) {
      toast.success("Photo strip complete!");
      
      const resetTimer = setTimeout(() => {
        setPhotoCount(0);
        setCapturedImages([]);
      }, 3000);
      
      return () => clearTimeout(resetTimer);
    } else if (photoCount > 0 && photoCount < 4) {
      const timer = setTimeout(() => {
        startCountdown();
      }, 1500);
      
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
    setCapturedImages([]);
    setPhotoCount(0);
    onCapture([]);
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
      case 'Dramatic': return 'contrast-125 brightness-90';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="relative bg-black">
        {isCapturing && (
          <div className="absolute inset-0 bg-white z-10 animate-shutter-flash" />
        )}
        
        <div className="relative">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full aspect-[4/3] object-cover ${getFilterClassName()}`}
            style={{ maxHeight: '500px' }}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {countdownValue && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <span className="text-7xl font-bold text-white animate-pulse-slight">
                {countdownValue}
              </span>
            </div>
          )}
          
          {photoCount > 0 && photoCount < 4 && !countdownValue && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <span className="text-xl font-bold text-white">
                Photo {photoCount} of 4 taken
              </span>
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
          <div className="flex gap-4">
            <button 
              onClick={startPhotoSession}
              disabled={!isStreaming || countdownValue !== null || (photoCount > 0 && photoCount < 4)}
              className="w-16 h-16 bg-idol-gold flex items-center justify-center rounded-full transition-all 
                        hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6 text-black" />
            </button>
            
            <button 
              onClick={() => {
                stopWebcam();
                setTimeout(startWebcam, 300);
              }}
              className="w-10 h-10 bg-white/20 flex items-center justify-center rounded-full transition-all 
                        hover:bg-white/30 active:scale-95"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-transparent">
        <div className="flex justify-center">
          <ToggleGroup type="single" value={activeFilter} onValueChange={(value) => value && setActiveFilter(value as FilterType)}>
            <ToggleGroupItem value="Normal" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              Normal
            </ToggleGroupItem>
            <ToggleGroupItem value="Warm" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              Warm
            </ToggleGroupItem>
            <ToggleGroupItem value="Cool" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              Cool
            </ToggleGroupItem>
            <ToggleGroupItem value="Vintage" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              Vintage
            </ToggleGroupItem>
            <ToggleGroupItem value="B&W" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              B&W
            </ToggleGroupItem>
            <ToggleGroupItem value="Dramatic" className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
              Dramatic
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
