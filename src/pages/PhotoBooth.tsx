import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Settings2, Image as ImageIcon, Upload, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebcamCapture from '../components/WebcamCapture';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePhotoStrip } from '../contexts/PhotoStripContext';
import { getTemplate } from '../data/templates';
import { Position, PhotoOverlay, defaultAspectRatios, PhotoStripSessionData } from '../contexts/PhotoStripContext';
import SEO from '../components/SEO'; 

// 定义本地存储的设置接口
interface LocalSettings {
  aspectRatio: string;
  filter: string;
  photoNum: number;
  countdown: number;
  playSound: boolean;
  lightColor: string;
}

// 默认设置
const defaultSettings: LocalSettings = {
  aspectRatio: '4:3',
  filter: 'Normal',
  photoNum: 4,
  countdown: 3,
  playSound: false,
  lightColor: '#FFD700'
};

// 本地存储键名
const LOCAL_STORAGE_KEY = 'photoBoothSettings';

// 本地存储工具函数
const settingsStorage = {
  // 保存设置到本地存储
  save: (settings: LocalSettings) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  },

  // 从本地存储加载设置
  load: (): LocalSettings => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 验证并合并设置，确保所有字段都存在
        return {
          aspectRatio: parsed.aspectRatio || defaultSettings.aspectRatio,
          filter: parsed.filter || defaultSettings.filter,
          photoNum: parsed.photoNum || defaultSettings.photoNum,
          countdown: parsed.countdown || defaultSettings.countdown,
          playSound: parsed.playSound !== undefined ? parsed.playSound : defaultSettings.playSound,
          lightColor: parsed.lightColor || defaultSettings.lightColor
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return defaultSettings;
  },

  // 清除本地存储的设置
  clear: () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error);
    }
  }
};

const PhotoBooth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateFromQuery = searchParams.get('template');
  
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  
  // 从本地存储加载初始设置
  const [localSettings, setLocalSettings] = useState<LocalSettings>(() => settingsStorage.load());
  
  // 使用本地设置初始化状态
  const [aspectRatio, setAspectRatio] = useState<string>(localSettings.aspectRatio);
  const [filter, setFilter] = useState(localSettings.filter);
  const [photoNum, setPhotoNum] = useState(localSettings.photoNum);
  const [countdown, setCountdown] = useState(localSettings.countdown);
  const [playSound, setPlaySound] = useState(localSettings.playSound);
  const [lightColor, setLightColor] = useState(localSettings.lightColor);
  
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  
  // State for fullscreen photo viewing
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  
  const [currentPhotoOverlays, setCurrentPhotoOverlays] = useState<PhotoOverlay[]>([]);
  const [overlayPreviews, setOverlayPreviews] = useState<{ [key: number]: string }>({});
  const overlayPreviewRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // For gentle animation of photos
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Toggle animation state every few seconds for subtle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const { photoStripData, setPhotoStripData, updatePhotos, updatePhotoOverlays, currentTemplate, setCurrentTemplate } = usePhotoStrip();
  const navigate = useNavigate();

  // 保存设置到本地存储的函数
  const saveSettingsToLocal = (newSettings: Partial<LocalSettings>) => {
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);
    settingsStorage.save(updatedSettings);
  };

  // 包装设置更新函数，自动保存到本地存储
  const updateAspectRatio = (value: string) => {
    setAspectRatio(value);
    saveSettingsToLocal({ aspectRatio: value });
  };

  const updateFilter = (value: string) => {
    setFilter(value);
    saveSettingsToLocal({ filter: value });
  };

  const updatePhotoNum = (value: number) => {
    setPhotoNum(value);
    saveSettingsToLocal({ photoNum: value });
  };

  const updateCountdown = (value: number) => {
    setCountdown(value);
    saveSettingsToLocal({ countdown: value });
  };

  const updatePlaySound = (value: boolean) => {
    setPlaySound(value);
    saveSettingsToLocal({ playSound: value });
  };

  const updateLightColor = (value: string) => {
    setLightColor(value);
    saveSettingsToLocal({ lightColor: value });
  };
  
  useEffect(() => {
    const loadInitialData = () => {
      let initialPhotoStripData: PhotoStripSessionData | null = null;
      let initialOverlays: PhotoOverlay[] = [];

      if (templateFromQuery) {
        const template = getTemplate(templateFromQuery);

        if (template) {
          setCurrentTemplate(template);

          // Initialize photoStripData from template, but use local settings for photoBoothSettings
          initialPhotoStripData = {
            photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            templateId: template.templateId,
            category: template.category,
            idol: template.idol,
            canvasSize: template.canvasSize,
            background: template.background,
            photoPositions: template.photoPositions,
            photoOverlays: template.photoOverlays || [], // Use template overlays, default to empty array
            decoration: template.decoration,
            photos: [], // Start with empty photos array
            text: template.text, // Use template text config
            photoBoothSettings: {
              // 使用本地保存的设置，而不是模板设置
              aspectRatio: localSettings.aspectRatio,
              countdown: localSettings.countdown,
              photoNum: localSettings.photoNum,
              filter: localSettings.filter,
              lightColor: localSettings.lightColor,
              sound: localSettings.playSound
            },
          };

          // Initialize currentPhotoOverlays state from template overlays
          initialOverlays = initialPhotoStripData.photoOverlays.map((overlay, index) => ({
            ...overlay,
            // Ensure canvasSize and photoPosition are included
            canvasSize: initialPhotoStripData!.canvasSize, // Use data from the initialized object
            photoPosition: initialPhotoStripData!.photoPositions?.[index] || null,
          }));

        } else {
          toast.error("Template not found");
          // Proceed with default settings if template not found
        }
      }

      // If photoStripData is still null (no template or template not found), create default data
      if (!initialPhotoStripData) {
        const defaultCanvasSize = { width: 1200, height: 1600 }; // Default canvas size
        const defaultPhotoPositions = [
          { x: 100, y: 100, width: 400, height: 500 },
          { x: 600, y: 100, width: 400, height: 500 },
          { x: 100, y: 700, width: 400, height: 500 },
          { x: 600, y: 700, width: 400, height: 500 },
        ];

        initialPhotoStripData = {
          photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          templateId: "default",
          category: "general",
          canvasSize: defaultCanvasSize,
          background: { type: "color", color: "#F7DC6F" },
          photoPositions: defaultPhotoPositions,
          photoOverlays: [], // Start with empty overlays for default
          decoration: [],
          photos: [],
          text: { // Default text config
            content: "IdolBooth moment",
            font: "Arial",
            size: 24,
            color: "#000000",
            position: { x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height - 100 },
          },
          photoBoothSettings: {
            // 使用本地保存的设置
            aspectRatio: localSettings.aspectRatio,
            countdown: localSettings.countdown,
            photoNum: localSettings.photoNum,
            filter: localSettings.filter,
            lightColor: localSettings.lightColor,
            sound: localSettings.playSound
          },
        };
        
        // Initialize currentPhotoOverlays state with default empty overlays based on local photoNum
        initialOverlays = Array(localSettings.photoNum).fill(null).map((_, index) => ({
          url: "/placeholder.svg",
          position: { x: defaultCanvasSize.width / 2, y: defaultCanvasSize.height / (localSettings.photoNum + 1) * (index + 1) },
          scale: 1.0,
          canvasSize: defaultCanvasSize,
          photoPosition: defaultPhotoPositions?.[index] || null,
        }));
      }

      // Set the initialized data to context and local state
      setPhotoStripData(initialPhotoStripData);
      setCurrentPhotoOverlays(initialOverlays);
      
      // 确保组件状态与本地设置保持同步
      setPhotoNum(localSettings.photoNum);
      setAspectRatio(localSettings.aspectRatio);
      setFilter(localSettings.filter);
      setCountdown(localSettings.countdown);
      setPlaySound(localSettings.playSound);
      setLightColor(localSettings.lightColor);
    };

    // Load data only once on mount or when templateFromQuery changes
    if (!photoStripData || photoStripData.templateId !== templateFromQuery) {
       loadInitialData();
    }

  }, [templateFromQuery, localSettings]); // 添加 localSettings 依赖

  // Sync local settings state back to photoStripData in context whenever local state changes
  useEffect(() => {
    if (!photoStripData) return;
    
    // Skip the update if we're already in sync to prevent infinite loops
    const currentSettings = photoStripData.photoBoothSettings;
    if (
      currentSettings.aspectRatio === aspectRatio &&
      currentSettings.countdown === countdown &&
      currentSettings.photoNum === photoNum &&
      currentSettings.filter === filter &&
      currentSettings.lightColor === lightColor &&
      currentSettings.sound === playSound
    ) {
      return;
    }

    setPhotoStripData((prevData: PhotoStripSessionData | null) => {
      if (!prevData) return null;
      return {
        ...prevData,
        photoBoothSettings: {
          ...prevData.photoBoothSettings,
          aspectRatio: aspectRatio,
          countdown: countdown,
          photoNum: photoNum,
          filter: filter,
          lightColor: lightColor,
          sound: playSound
        },
      };
    });
  }, [aspectRatio, countdown, photoNum, filter, lightColor, playSound, photoStripData]);

  // Ensure currentPhotoOverlays is synced with photoStripData and photoNum
  // This useEffect is separated to break the circular dependency
  useEffect(() => {
    if (!photoStripData) return;
    
    // Only update if photoNum doesn't match or we don't have enough overlays
    if (photoStripData.photoBoothSettings.photoNum === photoNum && 
        currentPhotoOverlays.length === photoNum) {
      return;
    }
    
    // Ensure we have the right number of overlays and update their associated data
    const updatedOverlays = Array(photoNum).fill(null).map((_, index) => {
      const existingOverlay = currentPhotoOverlays[index];
      const photoPos = photoStripData.photoPositions?.[index] || null;

      return {
        url: existingOverlay?.url || photoStripData.photoOverlays?.[index]?.url || "/placeholder.svg",
        position: existingOverlay?.position || photoStripData.photoOverlays?.[index]?.position || { x: photoStripData.canvasSize.width / 2, y: photoStripData.canvasSize.height / (photoNum + 1) * (index + 1) },
        scale: existingOverlay?.scale || photoStripData.photoOverlays?.[index]?.scale || 1.0,
        canvasSize: photoStripData.canvasSize,
        photoPosition: photoPos,
      };
    });

    // Update local state first
    setCurrentPhotoOverlays(updatedOverlays);
    
  }, [photoNum, photoStripData]);
  
  // Separate effect to update photoStripData.photoOverlays when currentPhotoOverlays changes
  useEffect(() => {
    if (!photoStripData || currentPhotoOverlays.length === 0) return;
    
    // Skip if photoOverlays in context are already the same
    if (JSON.stringify(photoStripData.photoOverlays) === JSON.stringify(currentPhotoOverlays)) {
      return;
    }
    
    setPhotoStripData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        photoOverlays: currentPhotoOverlays
      };
    });
  }, [currentPhotoOverlays, photoStripData]);

  const handlePhotoNumChange = (value: string) => {
    const newPhotoNum = Number(value);
    updatePhotoNum(newPhotoNum); // 使用新的更新函数
    // The useEffect above will sync this change to photoStripData and currentPhotoOverlays
  };
  
  // 添加重置设置到默认值的函数
  const resetSettingsToDefault = () => {
    setAspectRatio(defaultSettings.aspectRatio);
    setFilter(defaultSettings.filter);
    setPhotoNum(defaultSettings.photoNum);
    setCountdown(defaultSettings.countdown);
    setPlaySound(defaultSettings.playSound);
    setLightColor(defaultSettings.lightColor);
    
    // 保存默认设置到本地存储
    settingsStorage.save(defaultSettings);
    setLocalSettings(defaultSettings);
    
    toast.success("Settings reset to default");
  };
  
  useEffect(() => {
    return () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(err => console.log('No camera to stop'));
      }
    };
  }, []);
  
  useEffect(() => {
    overlayPreviewRefs.current = Array(photoNum).fill(null);
  }, [photoNum]);
  
  const handlePhotoStripCapture = (images: string[], selectedAspectRatio?: string) => {
    setPhotoStripImages(images);
    
    if (photoStripData) {
      // 创建更新后的photoStripData对象
      const updatedData = {
        ...photoStripData,
        photos: images,
        photoOverlays: currentPhotoOverlays,
        photoBoothSettings: {
          ...photoStripData.photoBoothSettings,
          aspectRatio: aspectRatio,
          filter: filter,
          lightColor: lightColor,
          sound: playSound
        }
      };
      
      // 直接使用新对象更新，而不是使用updater函数
      setPhotoStripData(updatedData);
    }
    
    if (selectedAspectRatio) {
      updateAspectRatio(selectedAspectRatio); // 使用新的更新函数
    }
    
    // If all photos have been taken, scroll to the photo results section
    if (images.length === photoNum) {
      setTimeout(() => {
        // Scroll to the photos section
        const photoSection = document.querySelector('.polaroid-frame');
        if (photoSection) {
          photoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to scrolling to bottom
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 800); // Slightly longer delay to ensure photos are rendered
    }
  };
  
  const handleNavigateToPhotoStrip = () => {
    if (!photoStripData) return;
    
    // 确保照片数据是最新的
    const updatedData = {
      ...photoStripData,
      photos: photoStripImages,
      photoOverlays: currentPhotoOverlays
    };
    
    // 更新上下文数据
    setPhotoStripData(updatedData);
    
    // 导航到photo-strip页面，并传递必要数据
    navigate('/photo-strip', {
      state: {
        photoStripData: updatedData
      }
    });
  };
  
  const handleRetakePhotos = () => {
    // Clear all photos from state
    setPhotoStripImages([]);
    setPhotoCount(0);
    
    // Also clear photos from context to ensure complete reset
    if (photoStripData) {
      const updatedData = {
        ...photoStripData,
        photos: []
      };
      setPhotoStripData(updatedData);
    }
    
    toast.info("Ready to take new photos");
  };
  
  // Function to open fullscreen photo with index
  const openFullscreenPhoto = (image: string, index: number) => {
    setFullscreenPhoto(image);
    setCurrentPhotoIndex(index);
  };

  // Function to navigate to next photo in fullscreen view
  const navigateToNextPhoto = () => {
    if (photoStripImages.length === 0) return;
    
    const nextIndex = (currentPhotoIndex + 1) % photoStripImages.length;
    setFullscreenPhoto(photoStripImages[nextIndex]);
    setCurrentPhotoIndex(nextIndex);
  };

  // Function to navigate to previous photo in fullscreen view
  const navigateToPrevPhoto = () => {
    if (photoStripImages.length === 0) return;
    
    const prevIndex = (currentPhotoIndex - 1 + photoStripImages.length) % photoStripImages.length;
    setFullscreenPhoto(photoStripImages[prevIndex]);
    setCurrentPhotoIndex(prevIndex);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenPhoto === null) return;
      
      if (e.key === 'ArrowRight') {
        navigateToNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        navigateToPrevPhoto();
      } else if (e.key === 'Escape') {
        setFullscreenPhoto(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenPhoto, currentPhotoIndex, photoStripImages.length]);

  // Function to delete the current photo in fullscreen view
  const deleteCurrentPhoto = () => {
    if (photoStripImages.length === 0 || fullscreenPhoto === null) return;
    
    // Create a new array without the current photo
    const newPhotos = photoStripImages.filter((_, index) => index !== currentPhotoIndex);
    setPhotoStripImages(newPhotos);
    
    // Update the context data
    if (photoStripData) {
      const updatedData = {
        ...photoStripData,
        photos: newPhotos
      };
      setPhotoStripData(updatedData);
    }
    
    // Handle UI updates after deletion
    if (newPhotos.length === 0) {
      // If no more photos, close the dialog
      setFullscreenPhoto(null);
    } else {
      // Navigate to the next available photo or the last one if we deleted the last photo
      const nextIndex = currentPhotoIndex >= newPhotos.length ? newPhotos.length - 1 : currentPhotoIndex;
      setFullscreenPhoto(newPhotos[nextIndex]);
      setCurrentPhotoIndex(nextIndex);
    }
    
    toast.success("Photo deleted");
  };
  
  // Added a photoCount state to track the current photo count for the camera
  const [photoCount, setPhotoCount] = useState(0);

  const renderPolaroidPhotos = () => {
    if (photoStripImages.length === 0) {
      return (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see them here</p>
        </div>
      );
    }
    
    return (
      <>
        <div className="relative mt-14 mb-8 overflow-x-auto py-16">
          {/* Enhanced clothesline - multiple texture layers for realism */}
          <div className="absolute top-0 left-0 right-0 mx-4" style={{ height: '3px' }}>
            {/* Base rope texture */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 rounded-full"></div>
            
            {/* Rope fiber texture */}
            <div className="absolute inset-0 opacity-30" 
              style={{ 
                backgroundImage: `repeating-linear-gradient(
                  45deg, 
                  transparent, 
                  transparent 2px, 
                  #f59e0b 2px, 
                  #f59e0b 4px
                )`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}>
            </div>
            
            {/* Rope highlight */}
            <div className="absolute inset-0 top-0 h-[1px] bg-amber-400 opacity-40 rounded-full"></div>
            
            {/* Rope shadow */}
            <div className="absolute top-full left-0 right-0 h-1 bg-black opacity-30 blur-[1px]"></div>
          </div>
          
          <div className="flex justify-center gap-6 md:gap-8 transition-all duration-300 mt-4">
            {photoStripImages.map((image, index) => {
              // Create unique rotation and animation values for each photo
              const isEven = index % 2 === 0;
              const baseRotation = isEven ? -2 - (index % 3) : 2 + (index % 3);
              
              // Alternating rotation for gentle swaying effect
              const rotation = isAnimating 
                ? baseRotation + (isEven ? -0.5 : 0.5)
                : baseRotation;
              
              // Different transition duration for each photo
              const transitionDuration = 2 + (index % 3);
              
              return (
                <div 
                  key={index} 
                  className="polaroid-frame bg-white shadow-lg p-2 pb-6 flex flex-col items-center hover:shadow-xl"
                  style={{ 
                    maxWidth: '180px',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'top center',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
                    position: 'relative',
                    transition: `transform ${transitionDuration}s ease-in-out`,
                  }}
                >
                  {/* Enhanced string connecting to clothesline - with texture and sway */}
                  <div className="absolute -top-10 left-1/2 w-[2px] h-10" style={{ transform: 'translateX(-50%)' }}>
                    {/* String base */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-400 to-gray-500"></div>
                    
                    {/* String fiber texture */}
                    <div className="absolute inset-0 opacity-20"
                      style={{ 
                        backgroundImage: `repeating-linear-gradient(
                          to bottom,
                          transparent,
                          transparent 2px,
                          #f8fafc 2px,
                          #f8fafc 3px
                        )`,
                      }}>
                    </div>
                    
                    {/* String highlight */}
                    <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-white opacity-20"></div>
                    
                    {/* String shadow */}
                    <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-black opacity-20"></div>
                  </div>
                  
                  {/* Enhanced clothespin with more detail and depth */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 z-10">
                    {/* Main clothespin body */}
                    <div className="absolute inset-0">
                      {/* Top part */}
                      <div className="absolute top-0 inset-x-0 h-3/5 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-t-sm"
                        style={{
                          clipPath: 'polygon(0% 0%, 100% 0%, 90% 40%, 50% 45%, 10% 40%)',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                        }}></div>
                      
                      {/* Bottom part */}
                      <div className="absolute bottom-0 inset-x-0 h-3/5 bg-gradient-to-b from-yellow-700 to-yellow-900 rounded-b-sm"
                        style={{
                          clipPath: 'polygon(10% 0%, 90% 0%, 85% 100%, 15% 100%)',
                          boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)'
                        }}></div>
                    </div>
                    
                    {/* Clothespin details */}
                    <div className="absolute inset-x-0 top-[30%] h-[2px] bg-yellow-950 opacity-30"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-2/3 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full opacity-50"></div>
                    </div>
                    
                    {/* Clothespin shadows */}
                    <div className="absolute -bottom-1 inset-x-[15%] h-1 bg-black opacity-20 blur-[1px]"></div>
                    
                    {/* Wood grain texture */}
                    <div className="absolute inset-0 opacity-10"
                      style={{ 
                        backgroundImage: `repeating-linear-gradient(
                          90deg,
                          transparent,
                          transparent 2px,
                          #7c2d12 2px,
                          #7c2d12 4px
                        )`,
                      }}>
                    </div>
                  </div>
                  
                  {/* Photo with subtle border and shadow */}
                  <div 
                    className="mb-2 overflow-hidden border border-gray-100 cursor-pointer transition-transform hover:scale-105" 
                    style={{ 
                      maxHeight: '220px',
                      boxShadow: 'inset 0 0 3px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => openFullscreenPhoto(image, index)}
                  >
                    <img 
                      src={image} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-auto" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Navigation buttons */}
          {photoStripImages.length >= photoNum && (
            <div className="flex justify-center mt-10 gap-4">
              <Button 
                variant="outline" 
                onClick={handleRetakePhotos}
                className="px-6"
              >
                Retake Photos
              </Button>
              <Button 
                onClick={handleNavigateToPhotoStrip}
                className="px-6 bg-amber-500 hover:bg-amber-600"
              >
                Make Photo Strip
              </Button>
            </div>
          )}
        </div>
        
        {/* Fullscreen photo dialog with navigation */}
        <Dialog open={fullscreenPhoto !== null} onOpenChange={(open) => !open && setFullscreenPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-1 bg-black">
            <div className="relative flex items-center justify-center h-full">
              {fullscreenPhoto && (
                <img 
                  src={fullscreenPhoto} 
                  alt={`Photo ${currentPhotoIndex + 1}`} 
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
              
              {/* Navigation controls */}
              {photoStripImages.length > 1 && (
                <>
                  {/* Left arrow */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={navigateToPrevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </Button>
                  
                  {/* Right arrow */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={navigateToNextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full h-10 w-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </Button>
                </>
              )}
              
              {/* Control buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                {/* Delete button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={deleteCurrentPhoto}
                  className="text-white bg-red-500/70 hover:bg-red-600/90 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </Button>
                
                {/* Close button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setFullscreenPhoto(null)}
                  className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Photo counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-2 py-1 rounded-full">
                {currentPhotoIndex + 1} / {photoStripImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };
  
  const handlePhotoOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!photoStripData) return;
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        // Simplified overlay - no position or scale needed since it's displayed full-screen
        const newOverlay: PhotoOverlay = {
          url: e.target.result as string,
          position: { x: 0, y: 0 }, // Position doesn't matter for full-screen display
          scale: 1.0, // Scale doesn't matter for full-screen display
          canvasSize: photoStripData.canvasSize,
          photoPosition: photoStripData.photoPositions[index] || null
        };
        
        setOverlayPreviews({
          ...overlayPreviews,
          [index]: e.target.result as string
        });
        
        const updatedOverlays = [...currentPhotoOverlays];
        updatedOverlays[index] = newOverlay;
        setCurrentPhotoOverlays(updatedOverlays);
        
        // 使用新对象更新
        const updatedData = {
          ...photoStripData,
          photoOverlays: updatedOverlays
        };
        setPhotoStripData(updatedData);
        
        toast.success(`Photo overlay ${index + 1} updated`);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const renderOverlayPreviews = () => {
    const previews = [];
    
    for (let i = 0; i < photoNum; i++) {
      previews.push(
        <div key={i} className="mb-6 border rounded-lg bg-gray-50 p-4">
          <h3 className="font-medium mb-3">Photo {i + 1} Overlay</h3>
          
          <div 
            className="relative bg-black mb-4 overflow-hidden"
            style={{ 
              aspectRatio: '4/3', // Always use 4:3 aspect ratio for preview
              maxHeight: '250px'
            }}
            ref={el => overlayPreviewRefs.current[i] = el}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white opacity-30">
              Camera Preview
            </div>
            
            {currentPhotoOverlays[i] && currentPhotoOverlays[i].url && currentPhotoOverlays[i].url !== "/placeholder.svg" && (
              <div 
                className="absolute inset-0"
                style={{
                  width: '100%',
                  height: '100%',
                  zIndex: 10
                }}
              >
                <img 
                  src={currentPhotoOverlays[i].url} 
                  alt={`Overlay ${i + 1}`} 
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}
            
            {(!currentPhotoOverlays[i] || !currentPhotoOverlays[i].url || currentPhotoOverlays[i].url === "/placeholder.svg") && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <p className="text-sm">No overlay image</p>
                  <p className="text-xs mt-1">Upload an image below</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Upload Image</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoOverlayUpload(e, i)}
                  className="text-sm w-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For best results, upload images with a 4:3 aspect ratio. The image will be displayed at full size.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return previews;
  };
  
  return (
    <div className="min-h-screen">
    <SEO 
      title="Take Photos with Your Favorite Idols | Free Online Photo Booth | IdolBooth.com"
      description="Our free online Kpop photo booth lets you take virtual photos with your favorite idols. Easy to use, instant results. Try now at IdolBooth.com!"
    />
      <Navbar />
      
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-montserrat">
              {currentTemplate 
                ? `${currentTemplate.templateId.replace(/-/g, ' ')} Template` 
                : "Photo Booth"}
            </h1>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="ml-2">
                  <Settings2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Photo Booth Settings</DialogTitle>
                  <DialogDescription>
                    Customize your photo booth experience. Settings are automatically saved locally.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="general" value={settingsTab} onValueChange={setSettingsTab}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="general">General Settings</TabsTrigger>
                    <TabsTrigger value="overlays">Photo Overlays</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                        <Select 
                          value={aspectRatio}
                          onValueChange={updateAspectRatio} // 使用新的更新函数
                        >
                          <SelectTrigger id="aspect-ratio">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                            <SelectItem value="3:2">3:2 (Classic)</SelectItem>
                            <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="photo-count">Number of Photos</Label>
                        <Select 
                          value={photoNum.toString()}
                          onValueChange={handlePhotoNumChange}
                        >
                          <SelectTrigger id="photo-count">
                            <SelectValue placeholder="Select number of photos" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="1">1 Photo</SelectItem>
                            <SelectItem value="2">2 Photos</SelectItem>
                            <SelectItem value="3">3 Photos</SelectItem>
                            <SelectItem value="4">4 Photos</SelectItem>
                            <SelectItem value="6">6 Photos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="countdown">Countdown Timer</Label>
                        <Select 
                          value={countdown.toString()}
                          onValueChange={(value) => updateCountdown(Number(value))} // 使用新的更新函数
                        >
                          <SelectTrigger id="countdown">
                            <SelectValue placeholder="Select countdown time" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="1">1 Second</SelectItem>
                            <SelectItem value="3">3 Seconds</SelectItem>
                            <SelectItem value="5">5 Seconds</SelectItem>
                            <SelectItem value="10">10 Seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="filter">Default Filter</Label>
                        <Select 
                          value={filter}
                          onValueChange={updateFilter} // 使用新的更新函数
                        >
                          <SelectTrigger id="filter">
                            <SelectValue placeholder="Select filter" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Warm">Warm</SelectItem>
                            <SelectItem value="Cool">Cool</SelectItem>
                            <SelectItem value="Vintage">Vintage</SelectItem>
                            <SelectItem value="B&W">Black & White</SelectItem>
                            <SelectItem value="Dramatic">Dramatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound">Camera Sound</Label>
                        <Switch
                          id="sound"
                          checked={playSound}
                          onCheckedChange={updatePlaySound} // 使用新的更新函数
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="light-color">Flash Light Color</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="light-color"
                            value={lightColor}
                            onChange={(e) => updateLightColor(e.target.value)} // 使用新的更新函数
                            className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer"
                          />
                          <input
                            type="text"
                            value={lightColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                                updateLightColor(color); // 使用新的更新函数
                              }
                            }}
                            placeholder="#RRGGBB"
                            className="w-24 px-2 py-1 border rounded-md text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* 添加重置按钮 */}
                      <div className="pt-4 border-t border-gray-200">
                        <Button 
                          variant="outline" 
                          onClick={resetSettingsToDefault}
                          className="w-full"
                        >
                          Reset to Default Settings
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          This will reset all settings to default values and clear saved preferences.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="overlays" className="py-4">
                      {renderOverlayPreviews()}
                  </TabsContent>
                </Tabs>
                
                <DialogClose asChild>
                  <Button className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600">
                    Save Settings
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xl mx-auto mb-6" ref={videoContainerRef}>
              <WebcamCapture 
                onCapture={handlePhotoStripCapture}
                aspectRatio={aspectRatio}
                photoLimit={photoNum}
                countdownTime={countdown}
                defaultFilter={filter}
                lightColor={lightColor}
                playSound={playSound}
                photoOverlays={currentPhotoOverlays}
              />
            </div>
            
            <div className="w-full max-w-4xl">
              {renderPolaroidPhotos()}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoBooth;