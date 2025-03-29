
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
  updatePhotos: (photos: string[]) => void;
  updateBackground: (background: { type: string; url?: string; color: string }) => void;
  updateText: (text: TextConfig) => void;
  updateDecoration: (decorations: Decoration[]) => void;
  updatePhotoOverlays: (overlays: PhotoOverlay[]) => void;
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

  // This effect ensures photoStrip data is loaded from localStorage (if exists)
  useEffect(() => {
    try {
      // Try to load saved photoStripData from localStorage
      const savedPhotoStripData = localStorage.getItem('photoStripData');
      if (savedPhotoStripData) {
        console.log("Loading photoStripData from localStorage");
        const parsedData = JSON.parse(savedPhotoStripData);
        
        // Validate data has required properties
        if (parsedData && parsedData.photoStripId) {
          // Check if there are photos
          if (Array.isArray(parsedData.photos) && parsedData.photos.length > 0) {
            console.log("Loaded photoStripData from localStorage with", parsedData.photos.length, "photos");
            
            // Ensure photoOverlays are properly structured if they exist
            if (parsedData.photoOverlays) {
              console.log("Found", parsedData.photoOverlays.length, "overlays in localStorage data");
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
    }
  }, []);

  // This effect saves photoStripData to localStorage whenever it changes
  useEffect(() => {
    if (photoStripData) {
      try {
        // Only save if we have valid data to save
        if (photoStripData.photoStripId) {
          const hasPhotos = Array.isArray(photoStripData.photos) && photoStripData.photos.length > 0;
          
          console.log(`Saving photoStripData to localStorage: ${hasPhotos ? photoStripData.photos.length : 0} photos`);
          localStorage.setItem('photoStripData', JSON.stringify(photoStripData));
          
          if (hasPhotos) {
            console.log("Photos in saved data:", photoStripData.photos);
          }
        }
      } catch (error) {
        console.error("Error saving photoStripData to localStorage:", error);
        toast.error("Error saving photo data");
      }
    }
  }, [photoStripData]);

  const updatePhotos = (photos: string[]) => {
    if (photoStripData) {
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
    } else {
      console.error("Cannot update photos: photoStripData is null");
    }
  };

  const updateBackground = (background: { type: string; url?: string; color: string }) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        background
      });
    }
  };

  const updateText = (text: TextConfig) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        text
      });
    }
  };

  const updateDecoration = (decorations: Decoration[]) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        decoration: decorations
      });
    }
  };

  const updatePhotoOverlays = (overlays: PhotoOverlay[]) => {
    if (photoStripData) {
      console.log(`Updating overlays in context. Count: ${overlays.length}`);
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: overlays
      });
    }
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
