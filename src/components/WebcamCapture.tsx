import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, FlipHorizontal, Maximize, Minimize, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { PhotoOverlay } from "@/contexts/PhotoStripContext";


// MediaPipe Imports
import {
  GestureRecognizer,
  FilesetResolver,
  NormalizedLandmark,
  // DrawingUtils
} from '@mediapipe/tasks-vision';

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

const gestureEmojiMap: Record<string, string> = {
  "Unknown": "❓",
  "Closed_Fist": "✊",
  "Open_Palm": "✋",
  "Pointing_Up": "☝️",
  "Thumb_Down": "👎",
  "Thumb_Up": "👍",
  "Victory": "✌️",
  "ILoveYou": "💗"
};

// Hand landmark indices (approximate, refer to MediaPipe docs for exact definitions)
const WRIST = 0;
const MIDDLE_FINGER_TIP = 12;
const INDEX_FINGER_TIP = 8;


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
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [videoDisplaySize, setVideoDisplaySize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [overlayImages, setOverlayImages] = useState<HTMLImageElement[]>([]);
  const sessionCompleteRef = useRef(false);

  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameIdRef = useRef<number | null>(null);

  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);
  const [emojiPosition, setEmojiPosition] = useState<{ x: number; y: number } | null>(null);
  const emojiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const componentDefaultAspectRatios: Record<string, { width: number, height: number }> = {
    '1:1': { width: 1, height: 1 },
    '4:3': { width: 4, height: 3 },
    '3:2': { width: 3, height: 2 },
    '4:5': { width: 4, height: 5 }
  };

  useEffect(() => {
    const initializeGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "/gesture_recognizer.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        gestureRecognizerRef.current = recognizer;
        console.log("Gesture recognizer initialized.");
      } catch (error) {
        console.error("Failed to initialize gesture recognizer:", error);
        toast.error("Gesture recognizer failed to load. Please refresh.");
      }
    };
    initializeGestureRecognizer();
    return () => {
      gestureRecognizerRef.current?.close();
      gestureRecognizerRef.current = null;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (emojiTimeoutRef.current) clearTimeout(emojiTimeoutRef.current);
    };
  }, []);

  const handleDetectedGestureOrNoHand = useCallback((
    gestureName: string | null, // Can be null if no hand detected
    landmarks: NormalizedLandmark[][] | undefined
  ) => {
    if (emojiTimeoutRef.current) {
      clearTimeout(emojiTimeoutRef.current);
    }

    const emojiToDisplay = gestureName ? gestureEmojiMap[gestureName] : null;

    if (emojiToDisplay && landmarks && landmarks.length > 0 && landmarks[0].length > MIDDLE_FINGER_TIP) {
      setCurrentEmoji(emojiToDisplay);

      // Use MIDDLE_FINGER_TIP for positioning
      const fingerTipLandmark = landmarks[0][MIDDLE_FINGER_TIP];

      if (videoRef.current && videoContainerRef.current) {
        const videoElemRect = videoRef.current.getBoundingClientRect();
        const containerRect = videoContainerRef.current.getBoundingClientRect();

        const normalizedX = mirrored ? (1 - fingerTipLandmark.x) : fingerTipLandmark.x;

        const newX = normalizedX * videoElemRect.width + (videoElemRect.left - containerRect.left);
        const newY = fingerTipLandmark.y * videoElemRect.height + (videoElemRect.top - containerRect.top);

        // newY -= 50; // Increased offset to be clearly above the finger tip. Adjust as needed.

        setEmojiPosition({ x: newX, y: newY });
      }

      // Refresh timeout if a valid gesture is shown
      emojiTimeoutRef.current = setTimeout(() => {
        setCurrentEmoji(null);
        setEmojiPosition(null);
      }, 2000); // Keep emoji for 2s if it's a recognized one

    } else {
      // No valid emoji to display OR no landmarks (no hand)
      // Set a 2-second timeout to hide any existing emoji
      emojiTimeoutRef.current = setTimeout(() => {
        setCurrentEmoji(null);
        setEmojiPosition(null);
      }, 2000); // Auto-hide after 2 seconds if no hand or no valid gesture
    }
  }, [mirrored]);


  const predictWebcam = useCallback(async () => {
    if (!isStreaming || !videoRef.current || !gestureRecognizerRef.current || !videoRef.current.videoWidth || videoRef.current.readyState < 2) {
      if (isStreaming) animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const video = videoRef.current;
    if (video.currentTime === lastVideoTimeRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;

    const startTimeMs = performance.now();
    try {
      if (gestureRecognizerRef.current) {
        const results = gestureRecognizerRef.current.recognizeForVideo(video, startTimeMs);

        if (results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0 && results.landmarks && results.landmarks.length > 0) {
          // Hand and gesture detected
          const topGesture = results.gestures[0][0];
          if (topGesture.score > 0.60) { // Confidence threshold
            handleDetectedGestureOrNoHand(topGesture.categoryName, results.landmarks);
          } else {
            // Low confidence gesture, treat as "hand present but no specific gesture"
            handleDetectedGestureOrNoHand(null, results.landmarks); // Pass landmarks for potential "hand still there" logic
          }
        } else {
          // No hand detected (results.landmarks is empty or no gestures)
          handleDetectedGestureOrNoHand(null, undefined);
        }
      }
    } catch (error) {
      console.error("Error during gesture recognition:", error);
      setCurrentEmoji(null); // Clear emoji on error
      setEmojiPosition(null);
    }
    if (isStreaming) {
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isStreaming, handleDetectedGestureOrNoHand]);

  useEffect(() => {
    if (isStreaming && gestureRecognizerRef.current) {
      console.log("Starting gesture prediction loop");
      lastVideoTimeRef.current = -1;
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
    } else {
      if (animationFrameIdRef.current) {
        console.log("Stopping gesture prediction loop");
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isStreaming, predictWebcam]);

  useEffect(() => { /* PhotoLimit updated log */ }, [photoLimit]);

  useEffect(() => {
    const updateSizes = () => {
      if (videoContainerRef.current && videoRef.current) {
        const containerRectData = videoContainerRef.current.getBoundingClientRect();
        const videoRectData = videoRef.current.getBoundingClientRect();
        setContainerSize({ width: containerRectData.width, height: containerRectData.height });
        setVideoDisplaySize({ width: videoRectData.width, height: videoRectData.height });
      }
    };
    updateSizes();
    window.addEventListener('resize', updateSizes);
    const observer = new MutationObserver(updateSizes);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }
    return () => {
      window.removeEventListener('resize', updateSizes);
      observer.disconnect();
    };
  }, [isStreaming, currentAspectRatio, isFullscreen]);

  useEffect(() => {
    if (photoOverlays && photoOverlays.length > 0) {
      const loadImages = photoOverlays.map((overlay) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") { resolve(null); return; }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = overlay.url;
          img.onload = () => resolve(img);
          img.onerror = () => { console.error("Error loading overlay image:", overlay.url); resolve(null); };
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
    if (playSound) { audioRef.current = new Audio('/audio/camera-shutter.mp3'); }
    else { audioRef.current = null; }
  }, [playSound]);

  useEffect(() => { setCurrentAspectRatio(aspectRatio as AspectRatioType); }, [aspectRatio]);
  useEffect(() => { setActiveFilter(defaultFilter as FilterType || 'Normal'); }, [defaultFilter]);

  const captureImage = useCallback(() => {
    // ... (Identical captureImage logic as before) ...
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) { console.error("Canvas context not available"); toast.error("Failed to capture image: canvas error"); return; }
      if (audioRef.current) { audioRef.current.play().catch(e => console.log("Audio play failed", e)); }

      const videoRect = video.getBoundingClientRect();
      const displayWidth = videoRect.width;
      const displayHeight = videoRect.height;
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      const videoSourceAspectRatio = video.videoWidth / video.videoHeight;
      const displayCanvasAspectRatio = displayWidth / displayHeight;
      let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;

      if (videoSourceAspectRatio > displayCanvasAspectRatio) {
        sourceWidth = video.videoHeight * displayCanvasAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        sourceHeight = video.videoWidth / displayCanvasAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }

      ctx.save();
      if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      switch (activeFilter) {
        case 'Warm': ctx.filter = 'sepia(0.3) brightness(1.05)'; break;
        case 'Cool': ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)'; break;
        case 'Vintage': ctx.filter = 'sepia(0.5) brightness(0.9) contrast(1.1)'; break;
        case 'B&W': ctx.filter = 'grayscale(1)'; break;
        case 'Dramatic': ctx.filter = 'contrast(1.25) brightness(0.9)'; break;
        default: ctx.filter = 'none'; break;
      }
      ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const currentOverlayForCapture = photoOverlays && photoCount < photoOverlays.length ? photoOverlays[photoCount] : null;
      const currentOverlayImgElement = overlayImages[photoCount];
      if (currentOverlayForCapture && currentOverlayImgElement && currentOverlayForCapture.url && currentOverlayForCapture.url !== "/placeholder.svg") {
        const overlayAR = currentOverlayImgElement.width / currentOverlayImgElement.height;
        const canvasAR = canvas.width / canvas.height;
        let overlayDestX = 0, overlayDestY = 0, overlayDestWidth = canvas.width, overlayDestHeight = canvas.height;
        if (overlayAR > canvasAR) {
          overlayDestWidth = canvas.width;
          overlayDestHeight = canvas.width / overlayAR;
          overlayDestY = (canvas.height - overlayDestHeight) / 2;
        } else {
          overlayDestHeight = canvas.height;
          overlayDestWidth = canvas.height * overlayAR;
          overlayDestX = (canvas.width - overlayDestWidth) / 2;
        }
        ctx.drawImage(currentOverlayImgElement, overlayDestX, overlayDestY, overlayDestWidth, overlayDestHeight);
      }

      // 添加这段代码：将表情符号绘制到画布上
      if (currentEmoji && emojiPosition) {
        ctx.save();
        // 设置表情符号的字体大小
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 计算在canvas中的位置，考虑镜像效果
        let emojiX = emojiPosition.x;
        if (mirrored) {
          emojiX = canvas.width - emojiPosition.x;
        }

        // 绘制表情符号
        ctx.fillText(currentEmoji, emojiX, emojiPosition.y);
        ctx.restore();
      }

      const imageDataURL = canvas.toDataURL('image/jpeg');
      const newCapturedImages = [...capturedImages, imageDataURL];
      setCapturedImages(newCapturedImages);
      const nextPhotoCount = photoCount + 1;
      setPhotoCount(nextPhotoCount);
      onCapture(newCapturedImages, currentAspectRatio);
      setIsCapturing(true);
      setTimeout(() => setIsCapturing(false), 300);
    }
  }, [capturedImages, onCapture, mirrored, activeFilter, currentAspectRatio, photoCount, photoOverlays, overlayImages, audioRef, currentEmoji, emojiPosition]);

  const startCountdown = useCallback(() => {
    // ... (Identical startCountdown logic) ...
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

  useEffect(() => {
    // ... (Identical photo session effect) ...
    if (photoCount === 0) sessionCompleteRef.current = false;
    if (photoCount === photoLimit && !sessionCompleteRef.current && photoLimit > 0) {
      console.log(`Photo strip complete! Took ${photoCount} of ${photoLimit} photos`);
      toast.success("Photo strip complete!");
      sessionCompleteRef.current = true;
      setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 500);
    } else if (photoCount > 0 && photoCount < photoLimit) {
      console.log(`Preparing for next photo: ${photoCount + 1} of ${photoLimit}`);
      const timer = setTimeout(() => {
        startCountdown();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [photoCount, photoLimit, startCountdown]);

  const startWebcam = useCallback(async () => {
    // ... (Identical startWebcam logic) ...
    try {
      const aspectRatioValues = componentDefaultAspectRatios[currentAspectRatio];
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
            setVideoSize({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
            videoRef.current.play().catch(err => console.error("Video play failed", err));
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
    // ... (Identical stopWebcam logic, with emoji clearing) ...
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
    setCurrentEmoji(null);
    setEmojiPosition(null);
  }, []);

  const startPhotoSession = useCallback(() => {
    // ... (Identical startPhotoSession logic) ...
    setCapturedImages([]);
    setPhotoCount(0);
    sessionCompleteRef.current = false;
    onCapture([], currentAspectRatio);
    startCountdown();
  }, [startCountdown, onCapture, currentAspectRatio]);

  const clearEmoji = () => {
    setCurrentEmoji(null);
    setEmojiPosition(null);
  }

  const toggleMirror = useCallback(() => { setMirrored(prev => !prev); clearEmoji(); }, []);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error('Error entering fullscreen:', err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error('Error exiting fullscreen:', err));
    }
    clearEmoji();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => { startWebcam(); return () => stopWebcam(); }, [startWebcam, stopWebcam]);

  const cycleAspectRatio = useCallback(() => {
    setCurrentAspectRatio(prev => {
      const ratios: AspectRatioType[] = ['4:3', '1:1', '3:2', '4:5'];
      const currentIndex = ratios.indexOf(prev);
      return ratios[(currentIndex + 1) % ratios.length];
    });
    clearEmoji();
  }, []);

  const toggleGrid = useCallback(() => { setShowGrid(prev => !prev); }, []);

  const getContainerStyle = (): React.CSSProperties => { /* ... (Identical) ... */
    const style: React.CSSProperties = {
      position: 'relative', width: '100%',
      height: isFullscreen ? '100vh' : 'auto',
      backgroundColor: 'black', overflow: 'hidden',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    };
    if (!isFullscreen) {
      const ar = componentDefaultAspectRatios[currentAspectRatio];
      if (ar) style.aspectRatio = `${ar.width}/${ar.height}`;
    }
    return style;
  };
  const getVideoStyle = (): React.CSSProperties => { /* ... (Identical) ... */
    const style: React.CSSProperties = {
      transform: mirrored ? 'scaleX(-1)' : 'none',
      objectFit: 'cover',
      width: '100%', height: '100%',
    };
    if (isFullscreen) {
      const arValues = componentDefaultAspectRatios[currentAspectRatio];
      const windowAr = window.innerWidth / window.innerHeight;
      const videoContentAr = arValues.width / arValues.height;
      if (windowAr > videoContentAr) {
        style.height = '100vh';
        style.width = `calc(100vh * ${videoContentAr})`;
      } else {
        style.width = '100vw';
        style.height = `calc(100vw / ${videoContentAr})`;
      }
      style.objectFit = 'contain';
    }
    return style;
  };
  const getFilterClassName = () => { /* ... (Identical) ... */
    switch (activeFilter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast-125 brightness-90';
      default: return '';
    }
  };
  const getAspectRatioRect = (): React.CSSProperties => { /* ... (Identical) ... */
    let width: string | number = '100%', height: string | number = '100%';
    const arValues = componentDefaultAspectRatios[currentAspectRatio];
    const currentVideoAr = arValues.width / arValues.height;
    if (isFullscreen) {
      const windowAr = window.innerWidth / window.innerHeight;
      if (windowAr > currentVideoAr) {
        height = '100vh';
        width = `calc(100vh * ${currentVideoAr})`;
      } else {
        width = '100vw';
        height = `calc(100vw / ${currentVideoAr})`;
      }
    }
    return { width, height, aspectRatio: `${arValues.width}/${arValues.height}` };
  };
  const getCroppedOverlayContainerStyle = (): React.CSSProperties => { /* ... (Identical) ... */
    return {
      position: 'absolute', pointerEvents: 'none',
      ...getAspectRatioRect(),
      margin: 'auto', inset: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    };
  };
  const getOverlayPositionStyle = (overlay: PhotoOverlay): React.CSSProperties => { /* ... (Identical) ... */
    return {
      maxWidth: '100%', maxHeight: '100%',
      objectFit: 'contain', pointerEvents: 'none',
    };
  };

  const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < photoLimit);
  const currentOverlayForDisplay = photoOverlays && photoCount < photoOverlays.length ? photoOverlays[photoCount] : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg shadow-lg" ref={containerRef}>
      <div className="relative bg-black mb-4">
        {isCapturing && <div className="absolute inset-0 bg-white opacity-30 z-10 animate-flash" style={{ backgroundColor: lightColor }} />}
        <div style={getContainerStyle()}>
          <div className="relative w-full h-full" ref={videoContainerRef}>
            <video ref={videoRef} autoPlay playsInline muted className={`${getFilterClassName()}`} style={getVideoStyle()} />
            <div className="absolute pointer-events-none" style={{ boxShadow: `0 0 0 2000px rgba(0, 0, 0, 0.3)`, ...getAspectRatioRect(), margin: 'auto', inset: 0 }} />
            {showGrid && <div className="absolute pointer-events-none" style={{ ...getAspectRatioRect(), margin: 'auto', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.3) 2px, transparent 2px), linear-gradient(to bottom, rgba(255,255,255,0.3) 2px, transparent 2px)', backgroundSize: '33.33% 33.33%', backgroundPosition: 'center' }} />}
            {currentOverlayForDisplay && currentOverlayForDisplay.url && currentOverlayForDisplay.url !== "/placeholder.svg" && (
              <div style={getCroppedOverlayContainerStyle()}>
                <img src={currentOverlayForDisplay.url} alt="Photo overlay" style={getOverlayPositionStyle(currentOverlayForDisplay)} />
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            {countdownValue && <div className="absolute inset-0 flex items-center justify-center z-10"><span className="text-7xl font-bold text-white animate-pulse-slight">{countdownValue}</span></div>}
            {photoCount > 0 && photoCount < photoLimit && !countdownValue && <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full z-10"><span className="text-sm font-bold text-white">Photo {photoCount} of {photoLimit}</span></div>}
            {!inCaptureMode && (
              <>
                <button onClick={toggleMirror} className="absolute top-3 right-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"><FlipHorizontal className="w-5 h-5 text-white" /></button>
                <button onClick={toggleFullscreen} className="absolute bottom-3 right-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20">{isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}</button>
                <button onClick={cycleAspectRatio} className="absolute top-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"><span className="text-xs font-bold text-white">{currentAspectRatio}</span></button>
                <button onClick={toggleGrid} className="absolute bottom-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"><Grid3X3 className={`w-5 h-5 ${showGrid ? 'text-idol-gold' : 'text-white'}`} /></button>
              </>
            )}
            {currentEmoji && emojiPosition && (
              <div
                className="absolute text-5xl z-30 pointer-events-none" // text-5xl for bigger emoji
                style={{
                  left: `${emojiPosition.x}px`,
                  top: `${emojiPosition.y}px`,
                  transform: 'translate(-50%, -50%)', // Center emoji on the point, and also vertically
                }}
              >
                {currentEmoji}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`py-4 flex justify-center ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm' : ''}`}>
        {!inCaptureMode && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={startPhotoSession}
              disabled={!isStreaming || !gestureRecognizerRef.current}
              className="w-16 h-16 bg-idol-gold flex items-center justify-center rounded-full transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Camera className="w-6 h-6 text-black" />
            </button>

            <div className="px-5 py-3 rounded-2xl text-center max-w-xs relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
              <p className="text-sm font-medium text-yellow-400 mb-1">
                ✨ Magic Hand Gestures Detected! ✨<span className="inline-block animate-bounce">✌️</span>
              </p>
            </div>
          </div>
        )}
      </div>
      {!isFullscreen && (
        <div className="p-3 bg-transparent mt-2 mb-4">
          <div className="flex justify-center">
            <ToggleGroup type="single" value={activeFilter} onValueChange={(value) => !inCaptureMode && value && setActiveFilter(value as FilterType)} className={inCaptureMode ? "opacity-50 pointer-events-none" : ""}>
              {(['Normal', 'Warm', 'Cool', 'Vintage', 'B&W', 'Dramatic'] as FilterType[]).map(filter => (
                <ToggleGroupItem key={filter} value={filter} className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black">
                  {filter}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;