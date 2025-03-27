import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface WebcamCaptureProps {
  onCapture: (images: string[], aspectRatio?: string) => void;
}

type FilterType = 'Normal' | 'Warm' | 'Cool' | 'Vintage' | 'B&W' | 'Dramatic';
type AspectRatioType = '4:3' | '1:1' | '9:16';

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Normal');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [mirrored, setMirrored] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('4:3');

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
      
      let width = video.videoWidth;
      let height = video.videoHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (aspectRatio === '1:1') {
        const size = Math.min(width, height);
        offsetX = (width - size) / 2;
        offsetY = (height - size) / 2;
        width = size;
        height = size;
      } else if (aspectRatio === '9:16') {
        const newWidth = (height * 9) / 16;
        offsetX = (width - newWidth) / 2;
        width = newWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (mirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(
          video, 
          offsetX, offsetY, width, height, 
          0, 0, width, height
        );
        
        if (activeFilter !== 'Normal') {
          switch (activeFilter) {
            case 'Warm':
              ctx.filter = 'sepia(0.3) brightness(1.05)';
              break;
            case 'Cool':
              ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)';
              break;
            case 'Vintage':
              ctx.filter = 'sepia(0.5) brightness(0.9) contrast(1.1)';
              break;
            case 'B&W':
              ctx.filter = 'grayscale(1)';
              break;
            case 'Dramatic':
              ctx.filter = 'contrast(1.25) brightness(0.9)';
              break;
          }
          if (mirrored) {
            ctx.resetTransform();
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          } else {
            ctx.resetTransform();
          }
          ctx.drawImage(
            video, 
            offsetX, offsetY, width, height, 
            0, 0, width, height
          );
        }
        
        const imageDataURL = canvas.toDataURL('image/jpeg');
        const newCapturedImages = [...capturedImages, imageDataURL];
        
        setCapturedImages(newCapturedImages);
        setPhotoCount(prevCount => prevCount + 1);
        
        onCapture(newCapturedImages, aspectRatio);
        
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
      }
    }
  }, [capturedImages, onCapture, mirrored, activeFilter, aspectRatio]);

  useEffect(() => {
    if (photoCount === 4) {
      toast.success("Photo strip complete!");
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
    onCapture([], aspectRatio);
    startCountdown();
  }, [startCountdown, onCapture, aspectRatio]);

  const toggleMirror = useCallback(() => {
    setMirrored(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('Error attempting to enable fullscreen:', err));
      }
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Error attempting to exit fullscreen:', err));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  const getContainerStyle = () => {
    let containerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      backgroundColor: 'black',
      overflow: 'hidden',
    };

    if (aspectRatio === '4:3') {
      containerStyle.maxHeight = '560px';
    } else if (aspectRatio === '1:1') {
      containerStyle.maxHeight = '100%';
      containerStyle.aspectRatio = '1/1';
    } else if (aspectRatio === '9:16') {
      containerStyle.maxHeight = '90vh';
      containerStyle.aspectRatio = '9/16';
    }

    return containerStyle;
  };

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

  const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < 4);

  return (
    <div className="flex flex-col overflow-hidden" ref={containerRef}>
      <div className="relative bg-black">
        {isCapturing && (
          <div className="absolute inset-0 bg-white opacity-30 z-10 animate-flash" />
        )}
        
        <div style={getContainerStyle()}>
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${getFilterClassName()}`}
            style={{ 
              transform: mirrored ? 'scaleX(-1)' : 'none',
            }}
          />
          
          <div 
            className="absolute inset-0 pointer-events-none m-auto"
            style={{ 
              boxShadow: `0 0 0 2000px rgba(0, 0, 0, 0.3)`,
              aspectRatio: aspectRatio === '4:3' ? '4/3' : aspectRatio === '1:1' ? '1/1' : '9/16',
              width: aspectRatio === '9:16' ? 'auto' : '100%',
              height: aspectRatio === '9:16' ? '100%' : 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          {countdownValue && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-7xl font-bold text-white animate-pulse-slight">
                {countdownValue}
              </span>
            </div>
          )}
          
          {photoCount > 0 && photoCount < 4 && !countdownValue && (
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full z-10">
              <span className="text-sm font-bold text-white">
                Photo {photoCount} of 4
              </span>
            </div>
          )}
          
          {!inCaptureMode && (
            <>
              <button 
                onClick={toggleMirror}
                className="absolute top-3 right-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"
              >
                <FlipHorizontal className="w-5 h-5 text-white" />
              </button>
              
              <button 
                onClick={toggleFullscreen}
                className="absolute bottom-3 right-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
              >
                {isFullscreen ? 
                  <Minimize className="w-5 h-5 text-white" /> : 
                  <Maximize className="w-5 h-5 text-white" />
                }
              </button>
              
              <div className="absolute top-3 left-3 bg-black/30 rounded-full p-1 z-20">
                <ToggleGroup 
                  type="single" 
                  value={aspectRatio} 
                  onValueChange={(value) => value && setAspectRatio(value as AspectRatioType)}
                  className="bg-transparent"
                >
                  <ToggleGroupItem value="4:3" className="text-xs px-2 py-1 rounded-l-full data-[state=on]:bg-idol-gold data-[state=on]:text-black text-white">
                    4:3
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1:1" className="text-xs px-2 py-1 data-[state=on]:bg-idol-gold data-[state=on]:text-black text-white">
                    1:1
                  </ToggleGroupItem>
                  <ToggleGroupItem value="9:16" className="text-xs px-2 py-1 rounded-r-full data-[state=on]:bg-idol-gold data-[state=on]:text-black text-white">
                    9:16
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
          {!inCaptureMode && (
            <div className="flex gap-4">
              <button 
                onClick={startPhotoSession}
                disabled={!isStreaming}
                className="w-16 h-16 bg-idol-gold flex items-center justify-center rounded-full transition-all 
                          hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-6 h-6 text-black" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 bg-transparent">
        <div className="flex justify-center">
          <ToggleGroup 
            type="single" 
            value={activeFilter} 
            onValueChange={(value) => !inCaptureMode && value && setActiveFilter(value as FilterType)}
            className={inCaptureMode ? "opacity-50 pointer-events-none" : ""}
          >
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
