import React, { createContext, useState, useContext, useCallback } from 'react';

// Define all required interfaces
export interface Position {
  x: number;
  y: number;
}

export interface PhotoOverlay {
  url: string;
  position: Position;
  scale: number;
  canvasSize?: CanvasSize;
  photoPosition?: PhotoPosition | null;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Background {
  type: 'color' | 'image';
  color?: string;
  imageUrl?: string;
  url?: string; // Add url property
}

export interface Decoration {
  type: string;
  url: string;
  position?: Position;
  scale?: number;
}

export interface TextConfig {
  content: string;
  font?: string;
  size?: number;
  color?: string;
  position?: Position;
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
  canvasSize: CanvasSize;
  background: Background;
  photoPositions: PhotoPosition[];
  previewUrl?: string;
  photoOverlays?: PhotoOverlay[];
  decoration?: Decoration[];
  photos?: string[]; // Add photos property
  text?: TextConfig; // Add text property
  caption?: string; // Add caption property for backward compatibility
}

// Define interface for the dynamic photo strip session data
export interface PhotoStripSessionData extends Template {
  photoStripId: string; // Unique ID for the photo strip session
  photos: string[]; // Array of captured photos (data URLs)
}

export const defaultAspectRatios: Record<string, number> = {
  '1:1': 1,
  '4:3': 4/3,
  '3:2': 3/2,
  '4:5': 4/5
};

interface PhotoStripContextProps {
  photos: string[];
  addPhoto: (photo: string) => void;
  removePhoto: (index: number) => void;
  clearPhotos: () => void;
  templateId: string | null;
  setTemplateId: (templateId: string | null) => void;
  photoBoothImage: string | null;
  setPhotoBoothImage: (photoBoothImage: string | null) => void;
  reset: () => void;
  // Add the missing properties
  photoStripData: PhotoStripSessionData | null;
  setPhotoStripData: (data: PhotoStripSessionData | null | ((prevData: PhotoStripSessionData | null) => PhotoStripSessionData | null)) => void;
  updatePhotos: (photos: string[]) => void;
  updatePhotoOverlays: (overlays: PhotoOverlay[]) => void;
  updateBackground: (background: Background) => void;
  updateText: (text: TextConfig | string) => void; // Change type to support both string and TextConfig
  updateDecoration: (decorations: Decoration[]) => void;
  currentTemplate: Template | null;
  setCurrentTemplate: (template: Template | null) => void;
}

const PhotoStripContext = createContext<PhotoStripContextProps | undefined>(undefined);

export const PhotoStripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [photoBoothImage, setPhotoBoothImage] = useState<string | null>(null);
  const [photoStripData, setPhotoStripData] = useState<PhotoStripSessionData | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  const addPhoto = useCallback((photo: string) => {
    setPhotos((prevPhotos) => [...prevPhotos, photo]);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const updatePhotos = useCallback((newPhotos: string[]) => {
    setPhotos(newPhotos);
    
    if (photoStripData) {
      setPhotoStripData(prevData => ({
        ...prevData,
        photos: newPhotos
      }));
    }
  }, [photoStripData]);

  const updatePhotoOverlays = useCallback((overlays: PhotoOverlay[]) => {
    if (photoStripData) {
      setPhotoStripData(prevData => ({
        ...prevData,
        photoOverlays: overlays
      }));
    }
  }, [photoStripData]);

  const updateBackground = useCallback((background: Background) => {
    if (photoStripData) {
      setPhotoStripData(prevData => ({
        ...prevData,
        background
      }));
    }
  }, [photoStripData]);

  const updateText = useCallback((text: TextConfig | string) => {
    if (photoStripData) {
      if (typeof text === 'string') {
        // Handle the case where text is a string (backwards compatibility)
        setPhotoStripData(prevData => ({
          ...prevData,
          caption: text
        }));
      } else {
        // Handle the case where text is a TextConfig object
        setPhotoStripData(prevData => ({
          ...prevData,
          text
        }));
      }
    }
  }, [photoStripData]);

  const updateDecoration = useCallback((decorations: Decoration[]) => {
    if (photoStripData) {
      setPhotoStripData(prevData => ({
        ...prevData,
        decoration: decorations
      }));
    }
  }, [photoStripData]);

  const reset = useCallback(() => {
    setPhotos([]);
    setTemplateId(null);
    setPhotoBoothImage(null);
    setPhotoStripData(null);
    setCurrentTemplate(null);
  }, []);

  const value: PhotoStripContextProps = {
    photos,
    addPhoto,
    removePhoto,
    clearPhotos,
    templateId,
    setTemplateId,
    photoBoothImage,
    setPhotoBoothImage,
    reset,
    photoStripData,
    setPhotoStripData,
    updatePhotos,
    updatePhotoOverlays,
    updateBackground,
    updateText,
    updateDecoration,
    currentTemplate,
    setCurrentTemplate
  };

  return (
    <PhotoStripContext.Provider value={value}>
      {children}
    </PhotoStripContext.Provider>
  );
};

export const usePhotoStrip = (): PhotoStripContextProps => {
  const context = useContext(PhotoStripContext);
  if (!context) {
    throw new Error("usePhotoStrip must be used within a PhotoStripProvider");
  }
  return context;
};
