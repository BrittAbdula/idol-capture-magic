
import { toast } from "sonner";
import { PhotoStrip, PhotoOverlay } from "@/contexts/PhotoStripContext";

// Function to extract subject from an image (placeholder for AI implementation)
export const extractSubject = async (image: File): Promise<string> => {
  try {
    // This is a placeholder function. In a real implementation, this would use
    // an AI service or library to extract the subject from the image.
    
    // For now, we'll just return the original image URL
    return URL.createObjectURL(image);
  } catch (error) {
    console.error("Error extracting subject:", error);
    toast.error("Failed to extract subject from image");
    throw error;
  }
};

// Apply a filter to an image
export const applyFilter = (
  image: string,
  filter: string
): string => {
  // In a real implementation, this would apply CSS filters or canvas manipulations
  // to the image. For now, we'll just return the original image.
  return image;
};

// Function to create a photo strip from multiple images
export const createPhotoStrip = (images: string[]): string => {
  // This is a placeholder function. In a real implementation, this would
  // combine multiple images into a photo strip layout.
  
  // For now, we'll just return the first image
  return images[0] || '';
};

// Function to combine two images (idol and user)
export const combineImages = async (
  idolImage: string,
  userImage: string
): Promise<string> => {
  try {
    // This is a placeholder function. In a real implementation, this would
    // use canvas to composite the two images together.
    
    // For now, we'll just return the idol image
    return idolImage;
  } catch (error) {
    console.error("Error combining images:", error);
    toast.error("Failed to combine images");
    throw error;
  }
};

// Validate photo data
export const validatePhotoData = (photoData: any): boolean => {
  if (!photoData) {
    console.error("validatePhotoData: No photo data provided");
    return false;
  }
  if (!Array.isArray(photoData.photos)) {
    console.error("validatePhotoData: photos is not an array", photoData);
    return false;
  }
  
  // Ensure photos array is not empty when validating
  if (photoData.photos.length === 0) {
    console.error("validatePhotoData: photos array is empty");
    return false;
  }
  
  // Check that photos contain valid data
  const validPhotos = photoData.photos.every((photo: string) => 
    typeof photo === 'string' && photo.trim() !== ''
  );
  
  if (!validPhotos) {
    console.error("validatePhotoData: contains invalid photo entries", photoData.photos);
    return false;
  }
  
  console.log("validatePhotoData: Photo data valid, contains", photoData.photos.length, "photos");
  return true;
};

// Helper to safely load image objects
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Process and prepare photo data for rendering
export const processPhotoStripData = (photoStripData: PhotoStrip | null): {
  hasValidPhotos: boolean,
  processedPhotos: string[],
  processedOverlays: PhotoOverlay[] | undefined
} => {
  if (!photoStripData) {
    console.error("processPhotoStripData: No photo strip data provided");
    return { hasValidPhotos: false, processedPhotos: [], processedOverlays: undefined };
  }

  // Log the data we're processing
  console.log("processPhotoStripData: Processing data with", 
    photoStripData.photos?.length || 0, "photos and", 
    photoStripData.photoOverlays?.length || 0, "overlays");

  // Check if we have valid photos
  const hasValidPhotos = Array.isArray(photoStripData.photos) && 
    photoStripData.photos.length > 0 &&
    photoStripData.photos.every(photo => typeof photo === 'string' && photo.trim() !== '');

  if (!hasValidPhotos) {
    console.error("processPhotoStripData: Invalid photo data", photoStripData.photos);
  } else {
    console.log("processPhotoStripData: Valid photos found:", photoStripData.photos.length);
  }

  // Filter out any invalid data
  const processedPhotos = hasValidPhotos ? 
    photoStripData.photos.filter(photo => typeof photo === 'string' && photo.trim() !== '') : 
    [];

  // Also validate overlays if they exist
  const processedOverlays = photoStripData.photoOverlays?.map(overlay => ({
    ...overlay,
    url: overlay.url || "/placeholder.svg",
    position: overlay.position || { x: 0, y: 0 },
    scale: overlay.scale || 1
  }));

  return { 
    hasValidPhotos, 
    processedPhotos, 
    processedOverlays 
  };
};
