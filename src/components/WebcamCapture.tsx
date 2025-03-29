import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Maximize, Minimize, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { defaultAspectRatios, IdolOverlay } from "@/contexts/PhotoStripContext";

interface WebcamCaptureProps {
  onCapture: (images: string[], aspectRatio?: string) => void;
  aspectRatio?: string;
  photoLimit?: number;
  countdownTime?: number;
  defaultFilter?: string;
  lightColor?: string;
  playSound?: boolean;
  idolOverlay?: IdolOverlay;
}

type FilterType = 'Normal' | 'Warm' | 'Cool' | 'Vintage' | 'B&W' | 'Dramatic';
type AspectRatioType = '4:3' | '1:1' | '3:2' | '4:5';

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ 
  onCapture,
  aspectRatio = '4:3',
  photoLimit = 4,
  countdownTime = 3,
  defaultFilter = 'Normal',
  lightColor = '#FFD700',
  playSound = false,
  idolOverlay
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter as FilterType || 'Normal');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [mirrored, setMirrored] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<AspectRatioType>(aspectRatio as AspectRatioType);
  const [showGrid, setShowGrid] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idolOverlayRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (playSound) {
      audioRef.current = new Audio('/audio/camera-shutter.mp3');
    } else {
      audioRef.current = null;
    }
  }, [playSound]);

  useEffect(() => {
    if (idolOverlay && idolOverlay.url) {
      const img = new Image();
      img.src = idolOverlay.url;
      img.onload = () => {
        idolOverlayRef.current = img;
      };
    } else {
      idolOverlayRef.current = null;
    }
  }, [idolOverlay]);

  useEffect(() => {
    setCurrentAspectRatio(aspectRatio as AspectRatioType);
  }, [aspectRatio]);

  useEffect(() => {
    setActiveFilter(defaultFilter as FilterType || 'Normal');
  }, [defaultFilter]);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", 
          width: { ideal: defaultAspectRatios[currentAspectRatio].width }, 
          height: { ideal: defaultAspectRatios[currentAspectRatio].height } 
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      toast.error("Could not access webcam. Please allow camera access and try again.");
    }
  }, [currentAspectRatio]);

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
      
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }
      
      let width = video.videoWidth;
      let height = video.videoHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (currentAspectRatio === '1:1') {
        const size = Math.min(width, height);
        offsetX = (width - size) / 2;
        offsetY = (height - size) / 2;
        width = size;
        height = size;
      } else if (currentAspectRatio === '3:2') {
        const newWidth = (height * 3) / 2;
        offsetX = (width - newWidth) / 2;
        width = newWidth;
      } else if (currentAspectRatio === '4:5') {
        const newWidth = (height * 4) / 5;
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
        
        if (idolOverlayRef.current && idolOverlay) {
          ctx.resetTransform();
          
          const scale = idolOverlay.scale || 1;
          const posX = idolOverlay.position?.x || 0;
          const posY = idolOverlay.position?.y || 0;
          
          const overlayWidth = idolOverlayRef.current.width * scale;
          const overlayHeight = idolOverlayRef.current.height * scale;
          
          ctx.drawImage(
            idolOverlayRef.current,
            posX, posY, overlayWidth, overlayHeight
          );
        }
        
        const imageDataURL = canvas.toDataURL('image/jpeg');
        const newCapturedImages = [...capturedImages, imageDataURL];
        
        setCapturedImages(newCapturedImages);
        setPhotoCount(prevCount => prevCount + 1);
        
        onCapture(newCapturedImages, currentAspectRatio);
        
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
      }
    }
  }, [capturedImages, onCapture, mirrored, activeFilter, currentAspectRatio, idolOverlay]);

  useEffect(() => {
    if (photoCount === photoLimit) {
      toast.success("Photo strip complete!");
    } else if (photoCount > 0 && photoCount < photoLimit) {
      const timer = setTimeout(() => {
        startCountdown();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [photoCount, photoLimit]);

  const startCountdown = useCallback(() => {
    setCountdownValue(countdownTime);
    
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
  }, [captureImage, countdownTime]);

  const startPhotoSession = useCallback(() => {
    setCapturedImages([]);
    setPhotoCount(0);
    onCapture([], currentAspectRatio);
    startCountdown();
  }, [startCountdown, onCapture, currentAspectRatio]);

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

  const cycleAspectRatio = useCallback(() => {
    setCurrentAspectRatio(prev => {
      switch (prev) {
        case '4:3': return '1:1';
        case '1:1': return '3:2';
        case '3:2': return '4:5';
        case '4:5': return '4:3';
        default: return '4:3';
      }
    });
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const getContainerStyle = () => {
    let containerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: isFullscreen ? '100vh' : 'auto',
      backgroundColor: 'black',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };

    if (!isFullscreen) {
      if (currentAspectRatio === '4:3') {
        containerStyle.aspectRatio = '4/3';
      } else if (currentAspectRatio === '1:1') {
        containerStyle.aspectRatio = '1/1';
      } else if (currentAspectRatio === '3:2') {
        containerStyle.aspectRatio = '3/2';
      } else if (currentAspectRatio === '4:5') {
        containerStyle.aspectRatio = '4/5';
      }
    }

    return containerStyle;
  };

  const getVideoStyle = () => {
    let videoStyle: React.CSSProperties = {
      transform: mirrored ? 'scaleX(-1)' : 'none',
      objectFit: 'cover',
    };

    if (isFullscreen) {
      if (currentAspectRatio === '4:3') {
        videoStyle.width = 'auto';
        videoStyle.height = '100%';
        videoStyle.maxWidth = 'calc(100vh * 4 / 3)';
        videoStyle.objectFit = 'contain';
      } else if (currentAspectRatio === '1:1') {
        const size = Math.min(window.innerWidth, window.innerHeight);
        videoStyle.width = `${size}px`;
        videoStyle.height = `${size}px`;
        videoStyle.maxWidth = '100vw';
        videoStyle.objectFit = 'cover';
      } else if (currentAspectRatio === '3:2') {
        videoStyle.width = 'auto';
        videoStyle.height = '100%';
        videoStyle.maxWidth = 'calc(100vh * 3 / 2)';
        videoStyle.objectFit = 'contain';
      } else if (currentAspectRatio === '4:5') {
        videoStyle.width = 'auto';
        videoStyle.height = '100%';
        videoStyle.maxWidth = 'calc(100vh * 4 / 5)';
        videoStyle.objectFit = 'contain';
      }
    } else {
      videoStyle.width = '100%';
      videoStyle.height = '100%';
    }

    return videoStyle;
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

  const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < photoLimit);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg shadow-lg" ref={containerRef}>
      <div className="relative bg-black mb-4">
        {isCapturing && (
          <div 
            className="absolute inset-0 bg-white opacity-30 z-10 animate-flash" 
            style={{ backgroundColor: lightColor }}
          />
        )}
        
        <div style={getContainerStyle()}>
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`${getFilterClassName()}`}
            style={getVideoStyle()}
          />
          
          <div 
            className="absolute pointer-events-none"
            style={{ 
              boxShadow: `0 0 0 2000px rgba(0, 0, 0, 0.3)`,
              aspectRatio: currentAspectRatio === '4:3' ? '4/3' : 
                          currentAspectRatio === '1:1' ? '1/1' : 
                          currentAspectRatio === '3:2' ? '3/2' : '4/5',
              width: isFullscreen ? 
                (currentAspectRatio === '1:1' ? 
                  `${Math.min(window.innerWidth, window.innerHeight)}px` : 'auto') 
                : '100%',
              height: isFullscreen ? 
                (currentAspectRatio === '1:1' ? 
                  `${Math.min(window.innerWidth, window.innerHeight)}px` : '100vh') 
                : 'auto',
              maxWidth: isFullscreen ? (
                currentAspectRatio === '4:3' ? 'calc(100vh * 4 / 3)' : 
                currentAspectRatio === '3:2' ? 'calc(100vh * 3 / 2)' :
                currentAspectRatio === '4:5' ? 'calc(100vh * 4 / 5)' : '100vh'
              ) : '100%',
              margin: 'auto',
              inset: 0,
            }}
          />
          
          {showGrid && (
            <div 
              className="absolute pointer-events-none"
              style={{ 
                aspectRatio: currentAspectRatio === '4:3' ? '4/3' : 
                            currentAspectRatio === '1:1' ? '1/1' : 
                            currentAspectRatio === '3:2' ? '3/2' : '4/5',
                width: isFullscreen ? 
                  (currentAspectRatio === '1:1' ? 
                    `${Math.min(window.innerWidth, window.innerHeight)}px` : 'auto') 
                  : '100%',
                height: isFullscreen ? 
                  (currentAspectRatio === '1:1' ? 
                    `${Math.min(window.innerWidth, window.innerHeight)}px` : '100vh') 
                  : 'auto',
                maxWidth: isFullscreen ? (
                  currentAspectRatio === '4:3' ? 'calc(100vh * 4 / 3)' : 
                  currentAspectRatio === '3:2' ? 'calc(100vh * 3 / 2)' :
                  currentAspectRatio === '4:5' ? 'calc(100vh * 4 / 5)' : '100vh'
                ) : '100%',
                margin: 'auto',
                inset: 0,
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.3) 2px, transparent 2px), linear-gradient(to bottom, rgba(255,255,255,0.3) 2px, transparent 2px)',
                backgroundSize: '33.33% 33.33%',
                backgroundPosition: 'center',
              }}
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          {countdownValue && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-7xl font-bold text-white animate-pulse-slight">
                {countdownValue}
              </span>
            </div>
          )}
          
          {photoCount > 0 && photoCount < photoLimit && !countdownValue && (
            <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full z-10">
              <span className="text-sm font-bold text-white">
                Photo {photoCount} of {photoLimit}
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
              
              <button
                onClick={cycleAspectRatio}
                className="absolute top-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"
              >
                <span className="text-xs font-bold text-white">{currentAspectRatio}</span>
              </button>
              
              <button 
                onClick={toggleGrid}
                className="absolute bottom-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"
              >
                <Grid3X3 className={`w-5 h-5 ${showGrid ? 'text-idol-gold' : 'text-white'}`} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={`py-4 flex justify-center ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm' : ''}`}>
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
      
      {!isFullscreen && (
        <div className="p-3 bg-transparent mt-2 mb-4">
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
      )}
    </div>
  );
};

export default WebcamCapture;
