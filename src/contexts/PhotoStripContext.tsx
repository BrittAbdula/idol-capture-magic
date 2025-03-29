import React, { createContext, useState, useContext, useCallback } from 'react';

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
}

const PhotoStripContext = createContext<PhotoStripContextProps | undefined>(undefined);

export const PhotoStripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [photoBoothImage, setPhotoBoothImage] = useState<string | null>(null);

  const addPhoto = useCallback((photo: string) => {
    setPhotos((prevPhotos) => [...prevPhotos, photo]);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const reset = useCallback(() => {
    setPhotos([]);
    setTemplateId(null);
    setPhotoBoothImage(null);
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
