
import React, { createContext, useContext, useState, useEffect } from 'react';
import { validatePhotoData } from '@/lib/imageProcessing';
import { toast } from 'sonner';

export interface Resolution {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface PhotoOverlay {
  url: string;
  position: Position;
  scale: number;
  canvasSize?: {
    width: number;
    height: number;
  };
  photoPosition?: PhotoPosition | null;
}

export interface Decoration {
  type: string;
  url: string;
  position?: Position;
  scale?: number;
}

export interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextConfig {
  content: string;
  font: string;
  size: number;
  color: string;
  position: Position;
}

export interface PhotoBoothSettings {
  aspectRatio: string;
  countdown: number;
  photoNum: number;
  filter?: string;
  lightColor?: string;
  sound: boolean;
}

export interface Template {
  templateId: string;
  category: string;
  idol?: string;
  photoBoothSettings: PhotoBoothSettings;
  canvasSize: {
    width: number;
    height: number;
  };
  background: {
    type: string;
    url?: string;
    color: string;
  };
  photoPositions: PhotoPosition[];
  previewUrl?: string;
  photoOverlays?: PhotoOverlay[]; 
  decoration?: Decoration[];
}

export interface PhotoStrip {
  photoStripId: string;
  templateId?: string;
  category?: string;
  idol?: string;
  canvasSize: {
    width: number;
    height: number;
  };
  previewUrl?: string;
  background: {
    type: string;
    url?: string;
    color: string;
  };
  photoPositions: PhotoPosition[];
  photos: string[];
  photoOverlays?: PhotoOverlay[];
  decoration?: Decoration[];
  text?: TextConfig;
  photoBoothSettings: PhotoBoothSettings;
}

// Default aspect ratios
export const defaultAspectRatios = {
  "1:1": { width: 720, height: 720 },
  "4:3": { width: 960, height: 720 },
  "3:2": { width: 1080, height: 720 },
  "4:5": { width: 576, height: 720 }
};

// Default photo booth settings
const defaultPhotoBoothSettings: PhotoBoothSettings = {
  aspectRatio: "4:3",
  countdown: 3,
  photoNum: 4,
  filter: "Normal",
  lightColor: "#FFD700",
  sound: false
};

interface PhotoStripContextType {
  photoStripData: PhotoStrip | null;
  setPhotoStripData: React.Dispatch<React.SetStateAction<PhotoStrip | null>>;
  updatePhotos: (photos: string[]) => Promise<void>;
  updateBackground: (background: { type: string; url?: string; color: string }) => Promise<void>;
  updateText: (text: TextConfig) => Promise<void>;
  updateDecoration: (decorations: Decoration[]) => Promise<void>;
  updatePhotoOverlays: (overlays: PhotoOverlay[]) => Promise<void>;
  currentTemplate: Template | null;
  setCurrentTemplate: React.Dispatch<React.SetStateAction<Template | null>>;
}

const defaultPhotoStrip: PhotoStrip = {
  photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
  canvasSize: {
    width: 1200,
    height: 1600
  },
  background: {
    type: 'color',
    color: '#FFFFFF'
  },
  photoPositions: [
    { x: 100, y: 100, width: 400, height: 500 },
    { x: 600, y: 100, width: 400, height: 500 },
    { x: 100, y: 700, width: 400, height: 500 },
    { x: 600, y: 700, width: 400, height: 500 }
  ],
  photos: [],
  photoBoothSettings: defaultPhotoBoothSettings
};

const PhotoStripContext = createContext<PhotoStripContextType | undefined>(undefined);

export const PhotoStripProvider = ({ children }: { children: React.ReactNode }) => {
  const [photoStripData, setPhotoStripData] = useState<PhotoStrip | null>(defaultPhotoStrip);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // This effect ensures photoStrip data is loaded from localStorage (if exists)
  useEffect(() => {
    try {
      setIsLoading(true);
      // Try to load saved photoStripData from localStorage
      const savedPhotoStripData = localStorage.getItem('photoStripData');
      if (savedPhotoStripData) {
        console.log("Loading photoStripData from localStorage");
        let parsedData: PhotoStrip | null = null;
        
        try {
          parsedData = JSON.parse(savedPhotoStripData);
        } catch (jsonError) {
          console.error("Error parsing JSON from localStorage:", jsonError);
          setPhotoStripData(defaultPhotoStrip);
          setIsLoading(false);
          return;
        }
        
        // Validate data has required properties
        if (parsedData && parsedData.photoStripId) {
          // Check if there are photos
          if (Array.isArray(parsedData.photos) && parsedData.photos.length > 0 && 
              parsedData.photos.every(photo => typeof photo === 'string' && photo.trim() !== '')) {
            console.log("Loaded photoStripData from localStorage with", parsedData.photos.length, "photos");
            
            // Make sure we have proper photoOverlays structure
            if (parsedData.photoOverlays) {
              console.log("Found", parsedData.photoOverlays.length, "overlays in localStorage data");
              
              // Make sure we create new objects for position properties to avoid circular references
              parsedData.photoOverlays = parsedData.photoOverlays.map(overlay => ({
                url: overlay.url || "/placeholder.svg",
                position: { ...overlay.position } || { x: 0, y: 0 },
                scale: overlay.scale || 1,
                // Create new objects for these properties to avoid circular refs
                canvasSize: overlay.canvasSize ? 
                  { width: overlay.canvasSize.width, height: overlay.canvasSize.height } : 
                  undefined,
                photoPosition: overlay.photoPosition ? 
                  { x: overlay.photoPosition.x, y: overlay.photoPosition.y, 
                    width: overlay.photoPosition.width, height: overlay.photoPosition.height } : 
                  null
              }));
            }
            
            setPhotoStripData(parsedData);
          } else {
            console.log("Found photoStripData in localStorage but no photos. Using default.");
            setPhotoStripData(defaultPhotoStrip);
          }
        } else {
          console.log("Invalid photoStripData in localStorage. Using default.");
          setPhotoStripData(defaultPhotoStrip);
        }
      } else {
        console.log("No photoStripData in localStorage. Using default.");
        setPhotoStripData(defaultPhotoStrip);
      }
    } catch (error) {
      console.error("Error loading photoStripData from localStorage:", error);
      toast.error("Error loading saved photo data");
      setPhotoStripData(defaultPhotoStrip);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // This effect saves photoStripData to localStorage whenever it changes
  useEffect(() => {
    if (photoStripData && !isLoading) {
      try {
        // Only save if we have valid data to save
        if (photoStripData.photoStripId) {
          const hasPhotos = Array.isArray(photoStripData.photos) && photoStripData.photos.length > 0;
          
          // Create a sanitized copy without circular references
          const sanitizedData = {
            ...photoStripData,
            photoOverlays: photoStripData.photoOverlays ? 
              photoStripData.photoOverlays.map(overlay => ({
                url: overlay.url,
                position: { ...overlay.position },
                scale: overlay.scale,
                // Don't include potentially circular references
                canvasSize: overlay.canvasSize ? 
                  { width: overlay.canvasSize.width, height: overlay.canvasSize.height } : 
                  undefined,
                // Create a new object for photoPosition
                photoPosition: overlay.photoPosition ? 
                  { x: overlay.photoPosition.x, y: overlay.photoPosition.y, 
                    width: overlay.photoPosition.width, height: overlay.photoPosition.height } : 
                  null
              })) : 
              undefined
          };
          
          console.log(`Saving photoStripData to localStorage: ${hasPhotos ? photoStripData.photos.length : 0} photos`);
          localStorage.setItem('photoStripData', JSON.stringify(sanitizedData));
          
          if (hasPhotos) {
            console.log("Photos in saved data:", photoStripData.photos.length);
          }
        }
      } catch (error) {
        console.error("Error saving photoStripData to localStorage:", error);
        toast.error("Error saving photo data");
      }
    }
  }, [photoStripData, isLoading]);

  const updatePhotos = async (photos: string[]): Promise<void> => {
    if (!photoStripData) {
      console.error("Cannot update photos: photoStripData is null");
      return Promise.reject(new Error("PhotoStripData is null"));
    }
    
    console.log(`Updating photos in context. Count: ${photos.length}`);
    if (photos.length > 0) {
      console.log("First photo URL length:", photos[0].substring(0, 50) + "...");
    }
    
    setPhotoStripData(prev => {
      if (!prev) return null;
      
      // Create a new object to ensure state update is detected
      const updated = {
        ...prev,
        photos
      };
      
      // Log it for debugging
      console.log("Updated photoStripData with", photos.length, "photos");
      
      return updated;
    });
    
    return Promise.resolve();
  };

  const updateBackground = async (background: { type: string; url?: string; color: string }): Promise<void> => {
    if (!photoStripData) {
      return Promise.reject(new Error("PhotoStripData is null"));
    }
    
    setPhotoStripData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        background
      };
    });
    
    return Promise.resolve();
  };

  const updateText = async (text: TextConfig): Promise<void> => {
    if (!photoStripData) {
      return Promise.reject(new Error("PhotoStripData is null"));
    }
    
    setPhotoStripData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        text
      };
    });
    
    return Promise.resolve();
  };

  const updateDecoration = async (decorations: Decoration[]): Promise<void> => {
    if (!photoStripData) {
      return Promise.reject(new Error("PhotoStripData is null"));
    }
    
    setPhotoStripData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        decoration: decorations
      };
    });
    
    return Promise.resolve();
  };

  const updatePhotoOverlays = async (overlays: PhotoOverlay[]): Promise<void> => {
    if (!photoStripData) {
      return Promise.reject(new Error("PhotoStripData is null"));
    }
    
    console.log(`Updating overlays in context. Count: ${overlays.length}`);
    
    setPhotoStripData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        photoOverlays: overlays
      };
    });
    
    return Promise.resolve();
  };

  return (
    <PhotoStripContext.Provider 
      value={{ 
        photoStripData, 
        setPhotoStripData, 
        updatePhotos, 
        updateBackground, 
        updateText,
        updateDecoration,
        updatePhotoOverlays,
        currentTemplate,
        setCurrentTemplate
      }}
    >
      {children}
    </PhotoStripContext.Provider>
  );
};

export const usePhotoStrip = (): PhotoStripContextType => {
  const context = useContext(PhotoStripContext);
  if (context === undefined) {
    throw new Error('usePhotoStrip must be used within a PhotoStripProvider');
  }
  return context;
};
