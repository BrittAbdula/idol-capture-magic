
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
import { Position, PhotoOverlay } from '../contexts/PhotoStripContext';

const PhotoBooth: React.FC = () => {
  // Get template parameter from URL query
  const [searchParams] = useSearchParams();
  const templateFromQuery = searchParams.get('template');
  
  // State for photo booth
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [filter, setFilter] = useState('Normal');
  const [photoNum, setPhotoNum] = useState(4);
  const [countdown, setCountdown] = useState(3);
  const [playSound, setPlaySound] = useState(false);
  const [lightColor, setLightColor] = useState('#FFD700');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  
  // State for photoOverlays
  const [currentPhotoOverlays, setCurrentPhotoOverlays] = useState<PhotoOverlay[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverlayIndex, setDraggedOverlayIndex] = useState<number | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);
  
  const { photoStripData, setPhotoStripData, updatePhotos, currentTemplate, setCurrentTemplate } = usePhotoStrip();
  const navigate = useNavigate();
  
  // Load template settings on mount
  useEffect(() => {
    const loadTemplateSettings = () => {
      if (templateFromQuery) {
        const template = getTemplate(templateFromQuery);
        
        if (template) {
          setCurrentTemplate(template);
          
          // Apply template photo booth settings
          const settings = template.photoBoothSettings;
          setAspectRatio(settings.aspectRatio);
          setPhotoNum(settings.photoNum);
          setCountdown(settings.countdown);
          if (settings.filter) setFilter(settings.filter);
          if (settings.lightColor) setLightColor(settings.lightColor);
          setPlaySound(settings.sound);
          
          // Load photoOverlays
          if (template.photoOverlays && template.photoOverlays.length > 0) {
            setCurrentPhotoOverlays(template.photoOverlays);
          }
          
          // Create a new photo strip data based on template
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
  
  // Update photo booth settings when user changes them
  useEffect(() => {
    if (photoStripData) {
      const updatedSettings = {
        ...photoStripData.photoBoothSettings,
        aspectRatio,
        photoNum,
        countdown,
        filter,
        lightColor,
        sound: playSound
      };
      
      setPhotoStripData({
        ...photoStripData,
        photoBoothSettings: updatedSettings,
        photoOverlays: currentPhotoOverlays
      });
    }
  }, [aspectRatio, photoNum, countdown, filter, lightColor, playSound, photoStripData, setPhotoStripData, currentPhotoOverlays]);
  
  // Enhanced cleanup when navigating away from this page
  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      // Find and stop all active media tracks
      const stopAllMediaTracks = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => console.log('No camera to stop'));
        }
      };
      
      stopAllMediaTracks();
    };
  }, []);
  
  // Handle user photo capture from webcam
  const handlePhotoStripCapture = (images: string[], selectedAspectRatio?: string) => {
    setPhotoStripImages(images);
    updatePhotos(images);
    
    if (selectedAspectRatio) {
      setAspectRatio(selectedAspectRatio);
    }
    
    // If we have enough photos, navigate to the photo strip page
    if (images.length >= photoNum) {
      navigate('/photo-strip');
    }
  };
  
  // Render polaroid photo display
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
                order: photoStripImages.length - index // Reverse order so new photos appear on the right
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
  
  // Handle file upload for photo overlays
  const handlePhotoOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        // Create a new overlay with the uploaded image
        const newOverlay: PhotoOverlay = {
          url: e.target.result as string,
          position: currentPhotoOverlays[index]?.position || { x: 50, y: 50 }, // Center if no position
          scale: currentPhotoOverlays[index]?.scale || 1.0
        };
        
        // Update the overlays array
        const updatedOverlays = [...currentPhotoOverlays];
        updatedOverlays[index] = newOverlay;
        setCurrentPhotoOverlays(updatedOverlays);
        
        // Update the photoStripData
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
  
  // Handle dragging of overlays
  const handleOverlayMouseDown = (e: React.MouseEvent, index: number) => {
    setIsDragging(true);
    setDraggedOverlayIndex(index);
  };
  
  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedOverlayIndex === null || !overlayContainerRef.current) return;
    
    const containerRect = overlayContainerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    // Update the position of the dragged overlay
    const updatedOverlays = [...currentPhotoOverlays];
    updatedOverlays[draggedOverlayIndex] = {
      ...updatedOverlays[draggedOverlayIndex],
      position: { x, y }
    };
    
    setCurrentPhotoOverlays(updatedOverlays);
    
    // Update the photoStripData
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
  
  const handleScaleChange = (index: number, newScale: number) => {
    const updatedOverlays = [...currentPhotoOverlays];
    updatedOverlays[index] = {
      ...updatedOverlays[index],
      scale: newScale
    };
    
    setCurrentPhotoOverlays(updatedOverlays);
    
    // Update the photoStripData
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: updatedOverlays
      });
    }
  };
  
  const addNewOverlay = () => {
    // Create a center position based on the container size
    const containerWidth = overlayContainerRef.current?.clientWidth || 300;
    const containerHeight = overlayContainerRef.current?.clientHeight || 300;
    
    const newOverlay: PhotoOverlay = {
      url: "/placeholder.svg", // Default placeholder
      position: { x: containerWidth / 2, y: containerHeight / 2 },
      scale: 1.0
    };
    
    const updatedOverlays = [...currentPhotoOverlays, newOverlay];
    setCurrentPhotoOverlays(updatedOverlays);
    
    // Update the photoStripData
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: updatedOverlays
      });
    }
  };
  
  const deleteOverlay = (index: number) => {
    const updatedOverlays = currentPhotoOverlays.filter((_, i) => i !== index);
    setCurrentPhotoOverlays(updatedOverlays);
    
    // Update the photoStripData
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: updatedOverlays
      });
    }
  };
  
  // Create empty overlays if needed
  useEffect(() => {
    if (photoStripData && photoNum > 0 && (!currentPhotoOverlays || currentPhotoOverlays.length < photoNum)) {
      // Create default overlays for each photo
      const containerWidth = overlayContainerRef.current?.clientWidth || 300;
      const containerHeight = overlayContainerRef.current?.clientHeight || 300;
      
      const defaultOverlays: PhotoOverlay[] = Array(photoNum).fill(0).map((_, i) => ({
        url: "/placeholder.svg",
        position: { x: containerWidth / 2, y: containerHeight / 2 },
        scale: 1.0
      }));
      
      setCurrentPhotoOverlays(defaultOverlays);
    }
  }, [photoNum, photoStripData, currentPhotoOverlays]);
  
  return (
    <div className="min-h-screen">
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
                          onValueChange={(value) => setPhotoNum(Number(value))}
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
                    <div 
                      ref={overlayContainerRef}
                      className="relative bg-gray-100 border rounded-lg p-4 mb-4 h-[300px] overflow-hidden"
                      onMouseMove={handleOverlayMouseMove}
                      onMouseUp={handleOverlayMouseUp}
                      onMouseLeave={handleOverlayMouseUp}
                    >
                      {currentPhotoOverlays.map((overlay, index) => (
                        <div 
                          key={index}
                          className="absolute cursor-move"
                          style={{
                            left: `${overlay.position.x}px`,
                            top: `${overlay.position.y}px`,
                            transform: `scale(${overlay.scale})`,
                            transformOrigin: 'center',
                            zIndex: draggedOverlayIndex === index ? 100 : 10
                          }}
                          onMouseDown={(e) => handleOverlayMouseDown(e, index)}
                        >
                          <div className="relative group">
                            <img 
                              src={overlay.url} 
                              alt={`Overlay ${index + 1}`} 
                              className="max-w-[150px] max-h-[150px] object-contain"
                              draggable={false}
                            />
                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => deleteOverlay(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {currentPhotoOverlays.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No overlays added yet. Click "Add Overlay" below.
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <Button 
                        onClick={addNewOverlay}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Overlay
                      </Button>
                      
                      {currentPhotoOverlays.map((overlay, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h3 className="font-medium mb-2">Overlay #{index + 1}</h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <Label className="mb-1 block">Upload Image</Label>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={overlay.url} 
                                    alt={`Preview ${index + 1}`}
                                    className="max-w-full max-h-full"
                                  />
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="text-sm"
                                  onChange={(e) => handlePhotoOverlayUpload(e, index)}
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
                                  value={overlay.scale}
                                  onChange={(e) => handleScaleChange(index, parseFloat(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="w-10 text-center">{overlay.scale.toFixed(1)}x</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 mt-2">
                            Position: X: {Math.round(overlay.position.x)}, Y: {Math.round(overlay.position.y)}
                            <span className="ml-2 italic">(Drag overlay above to adjust position)</span>
                          </div>
                        </div>
                      ))}
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
                aspectRatio={aspectRatio}
                photoLimit={photoNum}
                countdownTime={countdown}
                defaultFilter={filter}
                lightColor={lightColor}
                playSound={playSound}
                photoOverlays={photoStripData?.photoOverlays}
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
