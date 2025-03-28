
import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, Plus, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Template } from '@/contexts/PhotoStripContext';

interface MultiPhotoUploadProps {
  onComplete: (photos: string[]) => void;
  requiredCount?: number;
  template?: Template | null;
  aspectRatio?: string;
}

const MultiPhotoUpload: React.FC<MultiPhotoUploadProps> = ({ 
  onComplete, 
  requiredCount = 4,
  template,
  aspectRatio = "4:3"
}) => {
  // Use template settings if available
  const photoCount = template?.photoNum || requiredCount;
  const templateAspectRatio = template?.aspectRatio || aspectRatio;
  
  const [photos, setPhotos] = useState<string[]>(Array(photoCount).fill(''));
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>(Array(photoCount).fill(null));

  const handleFileSelect = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    processImage(file, index);
  };

  const processImage = (file: File, index: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return;
      
      // Create an image to get dimensions and process
      const img = new Image();
      img.onload = () => {
        // Create canvas for cropping if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set aspect ratio dimensions based on selected aspect ratio
        let targetWidth, targetHeight;
        const [widthRatio, heightRatio] = templateAspectRatio.split(':').map(Number);
        
        // Determine if the image needs to be cropped to match aspect ratio
        const imgRatio = img.width / img.height;
        const targetRatio = widthRatio / heightRatio;
        
        if (imgRatio > targetRatio) {
          // Image is wider than target ratio, crop width
          targetHeight = img.height;
          targetWidth = img.height * targetRatio;
        } else {
          // Image is taller than target ratio, crop height
          targetWidth = img.width;
          targetHeight = img.width / targetRatio;
        }
        
        // Set canvas size to the target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate crop position (center the crop)
        const cropX = (img.width - targetWidth) / 2;
        const cropY = (img.height - targetHeight) / 2;
        
        // Draw cropped image to canvas
        ctx.drawImage(
          img, 
          cropX, cropY, targetWidth, targetHeight, // Source coordinates
          0, 0, targetWidth, targetHeight           // Destination coordinates
        );
        
        // Convert canvas to data URL
        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update photos array
        const newPhotos = [...photos];
        newPhotos[index] = croppedImageUrl;
        setPhotos(newPhotos);
      };
      
      img.src = e.target.result as string;
    };
    
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = '';
    setPhotos(newPhotos);
    
    // Reset file input
    if (fileInputRefs.current[index]) {
      (fileInputRefs.current[index] as HTMLInputElement).value = '';
    }
  };

  const triggerFileInput = (index: number) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]?.click();
    }
  };

  const handleComplete = () => {
    // Check if all required photos are uploaded
    const filledPhotos = photos.filter(p => p !== '');
    if (filledPhotos.length < photoCount) {
      toast.error(`Please upload all ${photoCount} photos`);
      return;
    }
    
    onComplete(photos);
  };

  // Get display ratio for the preview boxes
  const getRatioValue = (): number => {
    const [width, height] = templateAspectRatio.split(':').map(Number);
    return height / width;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Upload Your Photos</h2>
        <p className="text-gray-600 mb-4">
          Please upload {photoCount} photos for your photo strip. The images will be cropped to maintain the {templateAspectRatio} aspect ratio.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <AspectRatio ratio={getRatioValue()}>
                {photo ? (
                  <div className="relative group">
                    <img 
                      src={photo} 
                      alt={`Uploaded photo ${index + 1}`} 
                      className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button 
                        onClick={() => removePhoto(index)}
                        className="p-1 bg-red-500 rounded-full text-white"
                        aria-label="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => triggerFileInput(index)}
                    className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-idol-gold transition-colors bg-gray-50"
                  >
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Photo {index + 1}</span>
                  </div>
                )}
              </AspectRatio>
              
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect(index)}
                ref={(el) => fileInputRefs.current[index] = el}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          className="idol-button px-6 py-2"
          disabled={photos.filter(p => p !== '').length < photoCount}
        >
          Create Photo Strip
        </Button>
      </div>
    </div>
  );
};

export default MultiPhotoUpload;
