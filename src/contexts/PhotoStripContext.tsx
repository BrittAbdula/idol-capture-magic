
import React, { createContext, useContext, useState, useEffect } from 'react';

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
        const parsedData = JSON.parse(savedPhotoStripData);
        // Validate data has required properties
        if (parsedData && parsedData.photoStripId && Array.isArray(parsedData.photos)) {
          console.log("Loaded photoStripData from localStorage:", parsedData.photos.length, "photos");
          setPhotoStripData(parsedData);
        }
      }
    } catch (error) {
      console.error("Error loading photoStripData from localStorage:", error);
    }
  }, []);

  // This effect saves photoStripData to localStorage whenever it changes
  useEffect(() => {
    if (photoStripData) {
      try {
        localStorage.setItem('photoStripData', JSON.stringify(photoStripData));
        console.log("Saved photoStripData to localStorage:", photoStripData.photos.length, "photos");
      } catch (error) {
        console.error("Error saving photoStripData to localStorage:", error);
      }
    }
  }, [photoStripData]);

  const updatePhotos = (photos: string[]) => {
    if (photoStripData) {
      console.log(`Updating photos in context. Count: ${photos.length}`);
      setPhotoStripData({
        ...photoStripData,
        photos
      });
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
