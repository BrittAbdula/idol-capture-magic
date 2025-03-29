
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Maximize, Minimize, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { defaultAspectRatios, PhotoOverlay } from "@/contexts/PhotoStripContext";

interface WebcamCaptureProps {
  onCapture: (images: string[], aspectRatio?: string) => void;
  aspectRatio?: string;
  photoLimit?: number;
  countdownTime?: number;
  defaultFilter?: string;
  lightColor?: string;
  playSound?: boolean;
  photoOverlays?: PhotoOverlay[];
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
  photoOverlays
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
  const photoOverlayRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [videoDisplaySize, setVideoDisplaySize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [templateDimensions, setTemplateDimensions] = useState({
    width: 0,
    height: 0
  });
  const [overlayImages, setOverlayImages] = useState<HTMLImageElement[]>([]);
  const sessionCompleteRef = useRef(false);

  // Log photoLimit updates to help with debugging
  useEffect(() => {
    console.log("PhotoLimit updated:", photoLimit);
  }, [photoLimit]);

  // Handle window resize and container changes
  useEffect(() => {
    const updateSizes = () => {
      if (videoContainerRef.current && videoRef.current) {
        const containerRect = videoContainerRef.current.getBoundingClientRect();
        const videoRect = videoRef.current.getBoundingClientRect();
        
        setContainerSize({
          width: containerRect.width,
          height: containerRect.height
        });
        
        setVideoDisplaySize({
          width: videoRect.width,
          height: videoRect.height
        });
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    
    const observer = new MutationObserver(updateSizes);
    if (containerRef.current) {
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => {
      window.removeEventListener('resize', updateSizes);
      observer.disconnect();
    };
  }, [isStreaming, currentAspectRatio, isFullscreen]);

  // Load overlay images when they change
  useEffect(() => {
    if (photoOverlays && photoOverlays.length > 0) {
      const loadImages = photoOverlays.map((overlay, index) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") {
            resolve(null);
            return;
          }
          
          const img = new Image();
          img.src = overlay.url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      });
      
      Promise.all(loadImages).then((loadedImages) => {
        setOverlayImages(loadedImages.filter(Boolean) as HTMLImageElement[]);
      });
    }
  }, [photoOverlays]);

  // Initialize audio for camera shutter sound
  useEffect(() => {
    if (playSound) {
      audioRef.current = new Audio('/audio/camera-shutter.mp3');
    } else {
      audioRef.current = null;
    }
  }, [playSound]);

  // Initialize overlay refs
  useEffect(() => {
    if (photoOverlays && photoOverlays.length > 0) {
      photoOverlayRefs.current = Array(photoOverlays.length).fill(null);
      
      photoOverlays.forEach((overlay, index) => {
        if (overlay && overlay.url) {
          const img = new Image();
          img.src = overlay.url;
          img.onload = () => {
            photoOverlayRefs.current[index] = img;
          };
        }
      });
    } else {
      photoOverlayRefs.current = [];
    }
  }, [photoOverlays]);

  // Update aspect ratio when prop changes
  useEffect(() => {
    setCurrentAspectRatio(aspectRatio as AspectRatioType);
  }, [aspectRatio]);

  // Update filter when prop changes
  useEffect(() => {
    setActiveFilter(defaultFilter as FilterType || 'Normal');
  }, [defaultFilter]);

  // Start webcam
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
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setVideoSize({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            });
          }
        };
        
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      toast.error("Could not access webcam. Please allow camera access and try again.");
    }
  }, [currentAspectRatio]);

  // Stop webcam
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

  // Get current overlay for the photo being taken
  const getCurrentOverlay = useCallback(() => {
    if (!photoOverlays || photoOverlays.length === 0) return null;
    
    // Make sure we don't go out of bounds
    const overlayIndex = Math.min(photoCount, photoOverlays.length - 1);
    return photoOverlays[overlayIndex];
  }, [photoOverlays, photoCount]);

  // Calculate position for the overlay
  const calculateOverlayPosition = useCallback((overlay: PhotoOverlay, index: number) => {
    if (!overlay || !overlay.position) return { x: 0, y: 0 };
    
    const videoEl = videoRef.current;
    const containerEl = videoContainerRef.current;
    if (!videoEl || !containerEl) return overlay.position;
    
    const videoRect = videoEl.getBoundingClientRect();
    
    const photoPosition = overlay.photoPosition;
    if (!photoPosition) {
      return overlay.position;
    }
    
    const videoViewportWidth = videoRect.width;
    const videoViewportHeight = videoRect.height;
    
    const widthRatio = videoViewportWidth / photoPosition.width;
    const heightRatio = videoViewportHeight / photoPosition.height;
    
    const absoluteX = overlay.position.x;
    const absoluteY = overlay.position.y;
    
    const scaledX = absoluteX * widthRatio;
    const scaledY = absoluteY * heightRatio;
    
    return { x: scaledX, y: scaledY };
  }, []);

  // Capture an image from the webcam
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
        
        // Get the correct overlay for the current photo
        const currentOverlay = photoOverlays && photoOverlays[photoCount];
        const currentOverlayImg = overlayImages[photoCount];
        
        if (currentOverlay && currentOverlayImg && currentOverlay.url && currentOverlay.url !== "/placeholder.svg") {
          ctx.resetTransform();
          
          const scale = currentOverlay.scale || 1;
          
          const photoPosition = currentOverlay.photoPosition;
          if (photoPosition) {
            const widthRatio = canvas.width / photoPosition.width;
            const heightRatio = canvas.height / photoPosition.height;
            
            const posX = currentOverlay.position.x * widthRatio;
            const posY = currentOverlay.position.y * heightRatio;
            
            const overlayWidth = currentOverlayImg.width * scale;
            const overlayHeight = currentOverlayImg.height * scale;
            
            ctx.drawImage(
              currentOverlayImg,
              posX - (overlayWidth / 2),
              posY - (overlayHeight / 2),
              overlayWidth,
              overlayHeight
            );
          } else {
            const posX = (currentOverlay.position.x / 100) * canvas.width;
            const posY = (currentOverlay.position.y / 100) * canvas.height;
            
            const overlayWidth = currentOverlayImg.width * scale;
            const overlayHeight = currentOverlayImg.height * scale;
            
            ctx.drawImage(
              currentOverlayImg,
              posX - (overlayWidth / 2),
              posY - (overlayHeight / 2),
              overlayWidth,
              overlayHeight
            );
          }
        }
        
        const imageDataURL = canvas.toDataURL('image/jpeg');
        const newCapturedImages = [...capturedImages, imageDataURL];
        
        setCapturedImages(newCapturedImages);
        
        // Update photoCount separately from updating capturedImages to avoid timing issues
        const nextPhotoCount = photoCount + 1;
        setPhotoCount(nextPhotoCount);
        
        // Update parent component with new images
        onCapture(newCapturedImages, currentAspectRatio);
        
        // Flash effect
        setIsCapturing(true);
        setTimeout(() => setIsCapturing(false), 300);
      }
    }
  }, [capturedImages, onCapture, mirrored, activeFilter, currentAspectRatio, photoCount, photoOverlays, overlayImages]);

  // Handle photo count logic and session completion
  useEffect(() => {
    // Reset session complete flag when starting a new session
    if (photoCount === 0) {
      sessionCompleteRef.current = false;
    }
    
    // Check if we've completed the session (exactly at the limit)
    if (photoCount === photoLimit && !sessionCompleteRef.current) {
      console.log(`Photo strip complete! Took ${photoCount} of ${photoLimit} photos`);
      toast.success("Photo strip complete!");
      sessionCompleteRef.current = true; // Mark session as complete to avoid duplicate messages
    } 
    // Continue with more photos if we're not at the limit yet
    else if (photoCount > 0 && photoCount < photoLimit) {
      console.log(`Preparing for next photo: ${photoCount + 1} of ${photoLimit}`);
      const timer = setTimeout(() => {
        startCountdown();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [photoCount, photoLimit]);

  // Start countdown timer before capturing
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
    
    // Cleanup interval if component unmounts during countdown
    return () => clearInterval(countdownInterval);
  }, [captureImage, countdownTime]);

  // Start a new photo session
  const startPhotoSession = useCallback(() => {
    // Reset state for a new session
    setCapturedImages([]);
    setPhotoCount(0);
    
    // Reset in parent component
    onCapture([], currentAspectRatio);
    
    // Start the countdown for the first photo
    startCountdown();
  }, [startCountdown, onCapture, currentAspectRatio]);

  // Toggle mirror effect
  const toggleMirror = useCallback(() => {
    setMirrored(prev => !prev);
  }, []);

  // Toggle fullscreen mode
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

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Initialize webcam on component mount
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, [startWebcam, stopWebcam]);

  // Cycle through aspect ratios
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

  // Toggle composition grid overlay
  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  // Create CSS styles for container based on aspect ratio and fullscreen state
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

  // Create CSS styles for video element
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

  // CSS class for applying filter effects
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

  // Style for overlay container
  const getCroppedOverlayContainerStyle = () => {
    const aspectRatioRect = getAspectRatioRect();
    
    return {
      position: 'absolute' as const,
      pointerEvents: 'none' as const,
      ...aspectRatioRect,
      margin: 'auto',
      inset: 0,
    };
  };

  // Calculate aspect ratio rectangle dimensions
  const getAspectRatioRect = () => {
    let width, height;
    
    if (isFullscreen) {
      if (currentAspectRatio === '1:1') {
        const size = Math.min(window.innerWidth, window.innerHeight);
        width = `${size}px`;
        height = `${size}px`;
      } else if (currentAspectRatio === '4:3') {
        height = '100vh';
        width = 'calc(100vh * 4 / 3)';
      } else if (currentAspectRatio === '3:2') {
        height = '100vh';
        width = 'calc(100vh * 3 / 2)';
      } else if (currentAspectRatio === '4:5') {
        height = '100vh';
        width = 'calc(100vh * 4 / 5)';
      }
    } else {
      width = '100%';
      height = '100%';
    }
    
    return {
      width,
      height,
    };
  };

  // Convert overlay position to percentage values
  const getOverlayPositionInPercentages = (overlay: PhotoOverlay) => {
    if (!overlay || !overlay.position) return { x: 50, y: 50 };
    
    const position = {
      x: (overlay.position.x / (videoDisplaySize.width || 1)) * 100,
      y: (overlay.position.y / (videoDisplaySize.height || 1)) * 100,
    };
    
    return position;
  };

  // Style for positioning overlay images
  const getOverlayPositionStyle = (overlay: PhotoOverlay) => {
    if (!overlay || !overlay.position) return {};
    
    const photoPosition = overlay.photoPosition;
    if (photoPosition && videoDisplaySize.width && videoDisplaySize.height) {
      const widthRatio = videoDisplaySize.width / photoPosition.width;
      const heightRatio = videoDisplaySize.height / photoPosition.height;
      
      return {
        position: 'absolute' as const,
        left: `${overlay.position.x * widthRatio}px`,
        top: `${overlay.position.y * heightRatio}px`,
        transform: `translate(-50%, -50%) scale(${overlay.scale})`,
        transformOrigin: 'center',
        pointerEvents: 'none' as const,
        maxWidth: '60%',
        maxHeight: '60%',
      };
    }
    
    return {
      position: 'absolute' as const,
      left: `${overlay.position.x}%`,
      top: `${overlay.position.y}%`,
      transform: `translate(-50%, -50%) scale(${overlay.scale})`,
      transformOrigin: 'center',
      pointerEvents: 'none' as const,
      maxWidth: '60%',
      maxHeight: '60%',
    };
  };

  // Flag to check if we're in capture mode
  const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < photoLimit);

  // Get the current overlay based on photoCount
  const currentOverlay = photoOverlays && photoCount < photoLimit ? photoOverlays[photoCount] : null;

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
          <div className="relative w-full h-full" ref={videoContainerRef}>
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
                ...getAspectRatioRect(),
                aspectRatio: currentAspectRatio === '4:3' ? '4/3' : 
                            currentAspectRatio === '1:1' ? '1/1' : 
                            currentAspectRatio === '3:2' ? '3/2' : '4/5',
                margin: 'auto',
                inset: 0,
              }}
            />
            
            {showGrid && (
              <div 
                className="absolute pointer-events-none"
                style={{ 
                  ...getAspectRatioRect(),
                  aspectRatio: currentAspectRatio === '4:3' ? '4/3' : 
                              currentAspectRatio === '1:1' ? '1/1' : 
                              currentAspectRatio === '3:2' ? '3/2' : '4/5',
                  margin: 'auto',
                  inset: 0,
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.3) 2px, transparent 2px), linear-gradient(to bottom, rgba(255,255,255,0.3) 2px, transparent 2px)',
                  backgroundSize: '33.33% 33.33%',
                  backgroundPosition: 'center',
                }}
              />
            )}
            
            {/* Always display the current overlay regardless of capture mode */}
            {currentOverlay && 
             currentOverlay.url && 
             currentOverlay.url !== "/placeholder.svg" && (
              <div style={getCroppedOverlayContainerStyle()}>
                <img 
                  src={currentOverlay.url} 
                  alt="Photo overlay"
                  style={getOverlayPositionStyle(currentOverlay)}
                />
              </div>
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
