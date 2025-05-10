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

  const defaultAspectRatios: Record<string, { width: number, height: number }> = {
    '1:1': { width: 1, height: 1 },
    '4:3': { width: 4, height: 3 },
    '3:2': { width: 3, height: 2 },
    '4:5': { width: 4, height: 5 }
  };

  useEffect(() => {
    console.log("PhotoLimit updated:", photoLimit);
  }, [photoLimit]);

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

  useEffect(() => {
    if (photoOverlays && photoOverlays.length > 0) {
      const loadImages = photoOverlays.map((overlay, index) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") {
            resolve(null);
            return;
          }
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = overlay.url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error("Error loading overlay image:", overlay.url);
            resolve(null);
          };
        });
      });
      
      Promise.all(loadImages).then((loadedImages) => {
        setOverlayImages(loadedImages.filter(Boolean) as HTMLImageElement[]);
      });
    } else {
      setOverlayImages([]);
    }
  }, [photoOverlays]);

  useEffect(() => {
    if (playSound) {
      audioRef.current = new Audio('/audio/camera-shutter.mp3');
    } else {
      audioRef.current = null;
    }
  }, [playSound]);

  useEffect(() => {
    if (photoOverlays && photoOverlays.length > 0) {
      photoOverlayRefs.current = Array(photoOverlays.length).fill(null);
      
      photoOverlays.forEach((overlay, index) => {
        if (overlay && overlay.url) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
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

  useEffect(() => {
    setCurrentAspectRatio(aspectRatio as AspectRatioType);
  }, [aspectRatio]);

  useEffect(() => {
    setActiveFilter(defaultFilter as FilterType || 'Normal');
  }, [defaultFilter]);

  const startWebcam = useCallback(async () => {
    try {
      const aspectRatioValues = defaultAspectRatios[currentAspectRatio];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", 
          width: { ideal: aspectRatioValues.width * 640 }, 
          height: { ideal: aspectRatioValues.height * 480 } 
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

  const getCurrentOverlay = useCallback(() => {
    if (!photoOverlays || photoOverlays.length === 0) return null;
    
    const overlayIndex = Math.min(photoCount, photoOverlays.length - 1);
    return photoOverlays[overlayIndex];
  }, [photoOverlays, photoCount]);

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

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error("Canvas context not available");
        toast.error("Failed to capture image: canvas error");
        return;
      }

      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }

      // Get the actual displayed size and position of the video element
      const videoRect = video.getBoundingClientRect();
      const displayWidth = videoRect.width;
      const displayHeight = videoRect.height;

      // Set canvas dimensions to match the displayed size
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Calculate the source rectangle from the video based on object-fit 'cover' logic
      // This ensures we capture the same area that is visible
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const displayAspectRatio = displayWidth / displayHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;

      if (videoAspectRatio > displayAspectRatio) {
        // Video is wider than display area, crop sides
        sourceWidth = video.videoHeight * displayAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller than display area, crop top/bottom
        sourceHeight = video.videoWidth / displayAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }

      ctx.save(); // Save the context state before applying transforms and filters

      if (mirrored) {
        // Apply mirroring transformation to the canvas
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      // Apply filter to the context *before* drawing the image
      switch (activeFilter) {
        case 'Warm': ctx.filter = 'sepia(0.3) brightness(1.05)'; break;
        case 'Cool': ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)'; break;
        case 'Vintage': ctx.filter = 'sepia(0.5) brightness(0.9) contrast(1.1)'; break;
        case 'B&W': ctx.filter = 'grayscale(1)'; break;
        case 'Dramatic': ctx.filter = 'contrast(1.25) brightness(0.9)'; break;
        default: ctx.filter = 'none'; break; // Explicitly set filter to none for Normal
      }

      // Draw the visible portion of the video onto the canvas
      ctx.drawImage(
        video,
        sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle from video
        0, 0, canvas.width, canvas.height             // Destination rectangle on canvas
      );

      // Draw the overlay onto the canvas if active *before* restoring context
      const currentOverlay = photoOverlays && photoCount < photoOverlays.length ? photoOverlays[photoCount] : null;
      const currentOverlayImgElement = overlayImages[photoCount]; // Use preloaded image

      if (
        currentOverlay &&
        currentOverlayImgElement &&
        currentOverlay.url &&
        currentOverlay.url !== "/placeholder.svg"
      ) {
        // Calculate overlay position and size to fit proportionally in the center of the canvas
        const overlayAspectRatio = currentOverlayImgElement.width / currentOverlayImgElement.height;
        const canvasAspectRatio = canvas.width / canvas.height;

        let overlayDestX = 0;
        let overlayDestY = 0;
        let overlayDestWidth = canvas.width;
        let overlayDestHeight = canvas.height;

        if (overlayAspectRatio > canvasAspectRatio) {
          // Overlay is wider than canvas aspect ratio, fit to width
          overlayDestWidth = canvas.width;
          overlayDestHeight = canvas.width / overlayAspectRatio;
          overlayDestX = 0;
          overlayDestY = (canvas.height - overlayDestHeight) / 2;
        } else {
          // Overlay is taller or square compared to canvas aspect ratio, fit to height
          overlayDestHeight = canvas.height;
          overlayDestWidth = canvas.height * overlayAspectRatio;
          overlayDestX = (canvas.width - overlayDestWidth) / 2;
          overlayDestY = 0;
        }

        // Adjust overlay position if mirroring is active
        if (mirrored) {
            overlayDestX = canvas.width - (overlayDestX + overlayDestWidth);
        }

        // Draw overlay onto the canvas using calculated dimensions
        ctx.drawImage(
          currentOverlayImgElement,
          overlayDestX, overlayDestY, overlayDestWidth, overlayDestHeight
        );
      }

      ctx.restore(); // Restore context state (removes filter and mirroring)

      const imageDataURL = canvas.toDataURL('image/jpeg');
      const newCapturedImages = [...capturedImages, imageDataURL];

      setCapturedImages(newCapturedImages);

      const nextPhotoCount = photoCount + 1;
      setPhotoCount(nextPhotoCount);

      // Pass the captured images and current aspect ratio up
      onCapture(newCapturedImages, currentAspectRatio);

      setIsCapturing(true);
      setTimeout(() => setIsCapturing(false), 300);
    }
  }, [capturedImages, onCapture, mirrored, activeFilter, currentAspectRatio, photoCount, photoOverlays, overlayImages, audioRef]); // Added audioRef to dependencies

  useEffect(() => {
    if (photoCount === 0) {
      sessionCompleteRef.current = false;
    }
    
    if (photoCount === photoLimit && !sessionCompleteRef.current) {
      console.log(`Photo strip complete! Took ${photoCount} of ${photoLimit} photos`);
      toast.success("Photo strip complete!");
      sessionCompleteRef.current = true;
      
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 500);
    } else if (photoCount > 0 && photoCount < photoLimit) {
      console.log(`Preparing for next photo: ${photoCount + 1} of ${photoLimit}`);
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
    
    return () => clearInterval(countdownInterval);
  }, [captureImage, countdownTime]);

  const startPhotoSession = useCallback(() => {
    setCapturedImages([]);
    setPhotoCount(0);
    sessionCompleteRef.current = false;
    
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
    const containerStyle: React.CSSProperties = {
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
    const videoStyle: React.CSSProperties = {
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

  const getCroppedOverlayContainerStyle = () => {
    const isOverlayActiveForCapture = photoOverlays && photoCount < photoOverlays.length &&
                                       photoOverlays[photoCount]?.url && photoOverlays[photoCount]?.url !== "/placeholder.svg";

    const aspectRatioRect = isOverlayActiveForCapture ? { aspectRatio: '4/3' } : getAspectRatioRect();
    
    return {
      position: 'absolute' as const,
      pointerEvents: 'none' as const,
      ...aspectRatioRect,
      margin: 'auto',
      inset: 0,
    };
  };

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

  const getOverlayPositionInPercentages = (overlay: PhotoOverlay) => {
    if (!overlay || !overlay.position) return { x: 50, y: 50 };
    
    const position = {
      x: (overlay.position.x / (videoDisplaySize.width || 1)) * 100,
      y: (overlay.position.y / (videoDisplaySize.height || 1)) * 100,
    };
    
    return position;
  };

  const getOverlayPositionStyle = (overlay: PhotoOverlay) => {
    const isOverlayActiveForCapture = photoOverlays && photoCount < photoOverlays.length &&
                                       photoOverlays[photoCount]?.url && photoOverlays[photoCount]?.url !== "/placeholder.svg";

    // Simplified logic: Always center and contain the overlay
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      pointerEvents: 'none' as const,
    };
  };

  const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < photoLimit);

  const currentOverlay = photoOverlays && photoCount < photoOverlays.length ? photoOverlays[photoCount] : null;

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
