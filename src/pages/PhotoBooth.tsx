
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Settings2 } from 'lucide-react';
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
import { usePhotoStrip } from '../contexts/PhotoStripContext';
import { getTemplate } from '../data/templates';

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
          
          // Create a new photo strip data based on template
          const newPhotoStripData = {
            photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            templateId: template.templateId,
            category: template.category,
            idol: template.idol,
            canvasSize: template.canvasSize,
            background: template.background,
            photoPositions: template.photoPositions,
            idolOverlay: template.idolOverlay,
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
  }, [templateFromQuery, setCurrentTemplate, setPhotoStripData]);
  
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
        photoBoothSettings: updatedSettings
      });
    }
  }, [aspectRatio, photoNum, countdown, filter, lightColor, playSound, photoStripData, setPhotoStripData]);
  
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Photo Booth Settings</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
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
                </div>
                
                <DialogClose asChild>
                  <Button className="w-full">Save Settings</Button>
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
                idolOverlay={currentTemplate?.idolOverlay}
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
