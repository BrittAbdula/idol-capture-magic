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
import { Position, PhotoOverlay, defaultAspectRatios } from '../contexts/PhotoStripContext';
import SEO from '../components/SEO'; 

const PhotoBooth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateFromQuery = searchParams.get('template');
  
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [filter, setFilter] = useState('Normal');
  const [photoNum, setPhotoNum] = useState(4);
  const [countdown, setCountdown] = useState(3);
  const [playSound, setPlaySound] = useState(false);
  const [lightColor, setLightColor] = useState('#FFD700');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  
  const [currentPhotoOverlays, setCurrentPhotoOverlays] = useState<PhotoOverlay[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverlayIndex, setDraggedOverlayIndex] = useState<number | null>(null);
  const [overlayPreviews, setOverlayPreviews] = useState<{ [key: number]: string }>({});
  const overlayPreviewRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { photoStripData, setPhotoStripData, updatePhotos, updatePhotoOverlays, currentTemplate, setCurrentTemplate } = usePhotoStrip();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadTemplateSettings = () => {
      if (templateFromQuery) {
        const template = getTemplate(templateFromQuery);
        console.log('template', template);
        
        if (template) {
          setCurrentTemplate(template);
          
          const settings = template.photoBoothSettings;
          setAspectRatio(settings.aspectRatio);
          setPhotoNum(settings.photoNum);
          setCountdown(settings.countdown);
          if (settings.filter) setFilter(settings.filter);
          if (settings.lightColor) setLightColor(settings.lightColor);
          setPlaySound(settings.sound);
          
          if (template.photoOverlays && template.photoOverlays.length > 0) {
            const enhancedOverlays = template.photoOverlays.map((overlay, index) => {
              return {
                ...overlay,
                canvasSize: template.canvasSize,
                photoPosition: template.photoPositions[index] || null
              };
            });
            setCurrentPhotoOverlays(enhancedOverlays);
          }
          
          const newPhotoStripData = {
            photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            templateId: template.templateId,
            category: template.category,
            idol: template.idol,
            canvasSize: template.canvasSize,
            background: template.background,
            photoPositions: template.photoPositions,
            photoOverlays: template.photoOverlays,
            decoration: template.decoration,
            photos: [],
            photoBoothSettings: {
              ...settings,
              filter,
              lightColor,
              sound: playSound
            }
          };
          
          setPhotoStripData(newPhotoStripData);
        } else {
          toast.error("Template not found");
        }
      }
    };
    
    loadTemplateSettings();
  }, [templateFromQuery, setCurrentTemplate, setPhotoStripData, filter, lightColor, playSound]);
  
  // Ensure photoNum is synced with photoStripData and overlays are properly initialized
  useEffect(() => {
    if (photoStripData) {
      // Only update state if the values are different to avoid infinite loops
      if (photoStripData.photoBoothSettings.photoNum !== photoNum) {
        setPhotoNum(photoStripData.photoBoothSettings.photoNum);
      }
      
      // Ensure we have the right number of overlays
      if (photoNum > 0) {
        const updatedOverlays = [...currentPhotoOverlays];
        
        // Add or remove overlays as needed to match photoNum
        while (updatedOverlays.length < photoNum) {
          const index = updatedOverlays.length;
          if (index < currentPhotoOverlays.length) {
            updatedOverlays.push(currentPhotoOverlays[index]);
          } else {
            updatedOverlays.push({
              url: "/placeholder.svg",
              position: { x: 50, y: 50 },
              scale: 1.0,
              canvasSize: photoStripData.canvasSize,
              photoPosition: photoStripData.photoPositions[index] || null
            });
          }
        }
        
        // Trim to photoNum if we have too many
        const finalOverlays = updatedOverlays.slice(0, photoNum);
        
        // Only update if the overlays have actually changed
        if (JSON.stringify(finalOverlays) !== JSON.stringify(currentPhotoOverlays)) {
          setCurrentPhotoOverlays(finalOverlays);
        }
      }
    }
  }, [photoNum, photoStripData, currentPhotoOverlays]);
  
  // Handle photoNum changes from UI
  const handlePhotoNumChange = (value: string) => {
    const newPhotoNum = Number(value);
    setPhotoNum(newPhotoNum);
    
    // Update photoStripData with the new photoNum
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoBoothSettings: {
          ...photoStripData.photoBoothSettings,
          photoNum: newPhotoNum
        }
      });
    }
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
    // Update local state with the new images
    setPhotoStripImages(images);
    
    // Update the photos in the PhotoStripContext
    updatePhotos(images);
    
    // Update overlays if we have them
    if (photoStripData && currentPhotoOverlays.length > 0) {
      updatePhotoOverlays(currentPhotoOverlays);
    }
    
    if (selectedAspectRatio) {
      setAspectRatio(selectedAspectRatio);
    }
    
    // Only navigate when we have the expected number of photos
    if (images.length >= photoNum) {
      navigate('/photo-strip');
    }
  };
  
  const renderPolaroidPhotos = () => {
    if (photoStripImages.length === 0) {
      return (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see them here</p>
        </div>
      );
    }
    
    return (
      <div className="flex justify-center mt-6 overflow-x-auto py-4">
        <div className={`flex justify-center gap-4 transition-all duration-300`}>
          {photoStripImages.map((image, index) => (
            <div 
              key={index} 
              className="polaroid-frame bg-white shadow-lg p-2 pb-6 transform transition-transform hover:rotate-1"
              style={{ 
                maxWidth: '180px',
                order: photoStripImages.length - index
              }}
            >
              <div className="mb-2 overflow-hidden">
                <img 
                  src={image} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-auto" 
                />
              </div>
              <div className="text-center text-xs text-gray-600">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const handlePhotoOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewContainer = overlayPreviewRefs.current[index];
        const position = { x: 50, y: 50 };
        
        const newOverlay: PhotoOverlay = {
          url: e.target.result as string,
          position: position,
          scale: 1.0,
          canvasSize: photoStripData?.canvasSize,
          photoPosition: photoStripData?.photoPositions[index] || null
        };
        
        setOverlayPreviews({
          ...overlayPreviews,
          [index]: e.target.result as string
        });
        
        const updatedOverlays = [...currentPhotoOverlays];
        updatedOverlays[index] = newOverlay;
        setCurrentPhotoOverlays(updatedOverlays);
        
        if (photoStripData) {
          setPhotoStripData({
            ...photoStripData,
            photoOverlays: updatedOverlays
          });
        }
        
        toast.success(`Photo overlay ${index + 1} updated`);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleOverlayMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedOverlayIndex(index);
  };
  
  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedOverlayIndex === null) return;
    
    const containerRef = overlayPreviewRefs.current[draggedOverlayIndex];
    if (!containerRef) return;
    
    const rect = containerRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let absoluteX = x;
    let absoluteY = y;
    
    if (photoStripData && photoStripData.photoPositions[draggedOverlayIndex]) {
      const photoPosition = photoStripData.photoPositions[draggedOverlayIndex];
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      const widthRatio = photoPosition.width / containerWidth;
      const heightRatio = photoPosition.height / containerHeight;
      
      absoluteX = x * widthRatio;
      absoluteY = y * heightRatio;
    }
    
    const updatedOverlays = [...currentPhotoOverlays];
    if (!updatedOverlays[draggedOverlayIndex]) {
      updatedOverlays[draggedOverlayIndex] = {
        url: overlayPreviews[draggedOverlayIndex] || "/placeholder.svg",
        position: { x: absoluteX, y: absoluteY },
        scale: 1.0,
        canvasSize: photoStripData?.canvasSize,
        photoPosition: photoStripData?.photoPositions[draggedOverlayIndex] || null
      };
    } else {
      updatedOverlays[draggedOverlayIndex] = {
        ...updatedOverlays[draggedOverlayIndex],
        position: { x: absoluteX, y: absoluteY }
      };
    }
    
    setCurrentPhotoOverlays(updatedOverlays);
    
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: updatedOverlays
      });
    }
  };
  
  const handleOverlayMouseUp = () => {
    setIsDragging(false);
    setDraggedOverlayIndex(null);
  };
  
  const handleOverlayMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedOverlayIndex(null);
    }
  };
  
  const handleScaleChange = (index: number, newScale: number) => {
    const updatedOverlays = [...currentPhotoOverlays];
    if (!updatedOverlays[index]) {
      updatedOverlays[index] = {
        url: overlayPreviews[index] || "/placeholder.svg",
        position: { x: 50, y: 50 },
        scale: newScale
      };
    } else {
      updatedOverlays[index] = {
        ...updatedOverlays[index],
        scale: newScale
      };
    }
    
    setCurrentPhotoOverlays(updatedOverlays);
    
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: updatedOverlays
      });
    }
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
              aspectRatio:`${aspectRatio.split(':')[0]}/${aspectRatio.split(':')[1]}`,
              maxHeight: '250px'
            }}
            ref={el => overlayPreviewRefs.current[i] = el}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
            onMouseLeave={handleOverlayMouseLeave}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white opacity-30">
              Camera Preview
            </div>
            
            {currentPhotoOverlays[i] && currentPhotoOverlays[i].url && currentPhotoOverlays[i].url !== "/placeholder.svg" && (
              <div 
                className="absolute cursor-move"
                style={{
                  left: `${currentPhotoOverlays[i].position.x}px`,
                  top: `${currentPhotoOverlays[i].position.y}px`,
                  transform: `translate(-50%, -50%) scale(${currentPhotoOverlays[i].scale})`,
                  transformOrigin: 'center',
                  zIndex: draggedOverlayIndex === i ? 100 : 10
                }}
                onMouseDown={(e) => handleOverlayMouseDown(e, i)}
              >
                <img 
                  src={currentPhotoOverlays[i].url} 
                  alt={`Overlay ${i + 1}`} 
                  className="max-w-[150px] max-h-[150px] object-contain pointer-events-none"
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
            </div>
            
            <div>
              <Label className="mb-1 block">Scale</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={currentPhotoOverlays[i]?.scale || 1.0}
                  onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-10 text-center">{(currentPhotoOverlays[i]?.scale || 1.0).toFixed(1)}x</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Position: {Math.round(currentPhotoOverlays[i]?.position.x || 0)}px, {Math.round(currentPhotoOverlays[i]?.position.y || 0)}px</p>
              <p className="italic mt-1 text-xs">Drag image above to position</p>
            </div>
          </div>
        </div>
      );
    }
    
    return previews;
  };
  
  useEffect(() => {
    if (!photoStripData) {
      // 创建默认photoStripData
      const defaultData = {
        templateId: "default",
        category: "general",
        photoBoothSettings: {
          aspectRatio: aspectRatio,
          countdown: countdown,
          photoNum: photoNum,
          filter: filter,
          lightColor: lightColor,
          sound: playSound
        },
        canvasSize: { width: 480, height: 1390 },
        background: { type: "color" as const, color: "#FFFFFF" },
        photoPositions: [
          // 生成默认位置
        ],
        photos: [] // 空数组，稍后会填充
      };
      setPhotoStripData(defaultData);
    }
  }, []);
  
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
                    Customize your photo booth experience
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
                          onValueChange={setAspectRatio}
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
                          onValueChange={(value) => setCountdown(Number(value))}
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
                          onValueChange={setFilter}
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
                          onCheckedChange={setPlaySound}
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="light-color">Flash Light Color</Label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            id="light-color"
                            value={lightColor}
                            onChange={(e) => setLightColor(e.target.value)}
                            className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer"
                          />
                          <input
                            type="text"
                            value={lightColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                                setLightColor(color);
                              }
                            }}
                            placeholder="#RRGGBB"
                            className="w-24 px-2 py-1 border rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="overlays" className="py-4">
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500">
                        Upload and position overlay images for each photo. These will appear over your photos when captured.
                      </p>
                      
                      {renderOverlayPreviews()}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogClose asChild>
                  <Button className="w-full mt-4">Save Settings</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xl mx-auto mb-6">
              <WebcamCapture 
                onCapture={handlePhotoStripCapture}
                aspectRatio={currentTemplate?.photoBoothSettings?.aspectRatio || aspectRatio}
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
