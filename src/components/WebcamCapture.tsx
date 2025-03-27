import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WebcamCaptureProps {
  onCapture: (image: string) => void;
}

type FilterType = 'Normal' | 'Warm' | 'Cool' | 'Vintage' | 'B&W' | 'Dramatic';

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Normal');

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
        onCapture(imageDataURL);
        
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
        
        toast.success("Photo captured!");
      }
    }
  }, [onCapture]);

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
    <div className="relative overflow-hidden bg-black">
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-7xl font-bold text-white animate-pulse-slight">
              {countdownValue}
            </span>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-20 left-0 right-0 p-2 flex justify-center">
        <div className="bg-black/50 backdrop-blur-sm p-2">
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
      
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
        <div className="flex gap-4">
          <button 
            onClick={startCountdown}
            disabled={!isStreaming || countdownValue !== null}
            className="w-16 h-16 bg-idol-gold flex items-center justify-center transition-all 
                      hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-6 h-6 text-black" />
          </button>
          
          <button 
            onClick={() => {
              stopWebcam();
              setTimeout(startWebcam, 300);
            }}
            className="w-10 h-10 bg-white/20 flex items-center justify-center transition-all 
                      hover:bg-white/30 active:scale-95"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
