
import React, { createContext, useContext, useState } from 'react';

export interface Resolution {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface IdolOverlay {
  url: string;
  position: Position;
  scale: number;
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

export interface Template {
  templateId: string;
  category: string;
  idol?: string;
  aspectRatio: string;
  resolution: Resolution;
  countdown: number;
  photoNum: number;
  filter?: string;
  lightColor?: string;
  idolOverlay?: IdolOverlay;
  decoration?: Decoration[];
  sound: boolean;
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
  background: {
    type: string;
    url?: string;
    color: string;
  };
  photoPositions: PhotoPosition[];
  photos: string[];
  frame?: {
    url: string;
  };
  stickers?: {
    url: string;
    x: number;
    y: number;
    scale: number;
  }[];
  text?: TextConfig;
}

// Default aspect ratios
export const defaultAspectRatios = {
  "1:1": { width: 720, height: 720 },
  "4:3": { width: 960, height: 720 },
  "3:2": { width: 1080, height: 720 },
  "4:5": { width: 576, height: 720 }
};

interface PhotoStripContextType {
  photoStripData: PhotoStrip | null;
  setPhotoStripData: React.Dispatch<React.SetStateAction<PhotoStrip | null>>;
  updatePhotos: (photos: string[]) => void;
  updateBackground: (background: { type: string; url?: string; color: string }) => void;
  updateText: (text: TextConfig) => void;
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
  photos: []
};

const PhotoStripContext = createContext<PhotoStripContextType | undefined>(undefined);

export const PhotoStripProvider = ({ children }: { children: React.ReactNode }) => {
  const [photoStripData, setPhotoStripData] = useState<PhotoStrip | null>(defaultPhotoStrip);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  const updatePhotos = (photos: string[]) => {
    if (photoStripData) {
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

  return (
    <PhotoStripContext.Provider 
      value={{ 
        photoStripData, 
        setPhotoStripData, 
        updatePhotos, 
        updateBackground, 
        updateText,
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
