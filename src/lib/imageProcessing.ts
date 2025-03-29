
import { Template, PhotoOverlay } from '../contexts/PhotoStripContext';

export const processPhotoStripData = (photoStripData: Template | null): {
  hasValidPhotos: boolean;
  processedPhotos: string[];
  processedOverlays?: PhotoOverlay[];
} => {
  if (!photoStripData) {
    console.log("processPhotoStripData - No photoStripData provided");
    return {
      hasValidPhotos: false,
      processedPhotos: []
    };
  }

  // Check if photoStripData has the photos property and it contains valid data
  const hasPhotos = 'photos' in photoStripData && 
                    Array.isArray(photoStripData.photos) && 
                    photoStripData.photos.length > 0;
                    
  if (!hasPhotos) {
    console.log("processPhotoStripData - No valid photos in photoStripData");
    return {
      hasValidPhotos: false,
      processedPhotos: []
    };
  }

  // Filter out any invalid photo entries
  const validPhotos = (photoStripData.photos as string[]).filter(
    photo => typeof photo === 'string' && photo.trim() !== ''
  );

  // Process overlays if they exist
  let processedOverlays: PhotoOverlay[] | undefined;
  if (photoStripData.photoOverlays && photoStripData.photoOverlays.length > 0) {
    processedOverlays = photoStripData.photoOverlays.map(overlay => {
      // Make a deep copy of the overlay to avoid reference issues
      return { ...overlay, position: { ...overlay.position } };
    });
  }

  return {
    hasValidPhotos: validPhotos.length > 0,
    processedPhotos: validPhotos,
    processedOverlays
  };
};

// Fix the issue on line 139 where there's a truthy expression error
export const validateImage = (image: HTMLImageElement | null): boolean => {
  // Instead of using just if (image) which TypeScript flags as a truthy expression error
  return image !== null && image instanceof HTMLImageElement && image.width > 0;
};
