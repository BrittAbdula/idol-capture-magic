
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
}

export interface Decoration {
  type: string;
  url: string;
  position?: Position;
  scale?: number;
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
}

export const defaultAspectRatios = {
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
  photoStripData: Template | null;
  setPhotoStripData: (data: Template | null) => void;
  updatePhotos: (photos: string[]) => void;
  updatePhotoOverlays: (overlays: PhotoOverlay[]) => void;
  updateBackground: (background: Background) => void;
  updateText: (text: string) => void;
  updateDecoration: (decorations: Decoration[]) => void;
  currentTemplate: Template | null;
  setCurrentTemplate: (template: Template | null) => void;
}

const PhotoStripContext = createContext<PhotoStripContextProps | undefined>(undefined);

export const PhotoStripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [photoBoothImage, setPhotoBoothImage] = useState<string | null>(null);
  const [photoStripData, setPhotoStripData] = useState<Template | null>(null);
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
      setPhotoStripData({
        ...photoStripData,
        photos: newPhotos
      });
    }
  }, [photoStripData]);

  const updatePhotoOverlays = useCallback((overlays: PhotoOverlay[]) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        photoOverlays: overlays
      });
    }
  }, [photoStripData]);

  const updateBackground = useCallback((background: Background) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        background
      });
    }
  }, [photoStripData]);

  const updateText = useCallback((text: string) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        caption: text
      } as Template); // Type assertion as Template since caption isn't in our interface
    }
  }, [photoStripData]);

  const updateDecoration = useCallback((decorations: Decoration[]) => {
    if (photoStripData) {
      setPhotoStripData({
        ...photoStripData,
        decoration: decorations
      });
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
