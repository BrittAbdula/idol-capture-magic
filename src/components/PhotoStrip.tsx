
import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoStripProps {
  images: string[];
  filter: string;
}

const PhotoStrip: React.FC<PhotoStripProps> = ({ images, filter }) => {
  const getFilterClassName = () => {
    switch (filter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast-125 brightness-90';
      default: return '';
    }
  };

  const handleDownload = () => {
    // Create a canvas element to combine the images into a strip
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx || images.length === 0) return;
    
    // We'll need to load the images first
    const loadImages = images.map(src => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    });
    
    Promise.all(loadImages).then(loadedImages => {
      if (loadedImages.length === 0) return;
      
      // Set canvas size - vertical strip format
      const imgWidth = loadedImages[0].width;
      const imgHeight = loadedImages[0].height;
      
      canvas.width = imgWidth;
      canvas.height = imgHeight * loadedImages.length;
      
      // Apply the filter effect if needed
      if (filter !== 'Normal') {
        // Fix: Don't try to get computed style from a class selector
        // Just apply the filter manually based on filter type
        let filterStyle = '';
        switch (filter) {
          case 'Warm': filterStyle = 'sepia(0.3) brightness(1.05)'; break;
          case 'Cool': filterStyle = 'brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)'; break;
          case 'Vintage': filterStyle = 'sepia(0.5) brightness(0.9) contrast(1.1)'; break;
          case 'B&W': filterStyle = 'grayscale(1)'; break;
          case 'Dramatic': filterStyle = 'contrast(1.25) brightness(0.9)'; break;
        }
        ctx.filter = filterStyle;
      }
      
      // Draw each image on the canvas
      loadedImages.forEach((img, index) => {
        ctx.drawImage(img, 0, index * imgHeight, imgWidth, imgHeight);
      });
      
      // Convert to data URL and download
      const link = document.createElement('a');
      link.download = `photo_strip_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
      
      toast.success("Photo strip downloaded successfully!");
    }).catch(err => {
      console.error("Error creating photo strip:", err);
      toast.error("Failed to download photo strip");
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden bg-black flex flex-col">
        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Take photos to see your strip here</p>
          </div>
        ) : (
          <div className={`flex-1 overflow-auto ${getFilterClassName()}`}>
            <div className="flex flex-col gap-1">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image} alt={`Photo ${index + 1}`} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {images.length > 0 && (
        <div className="p-2 bg-gray-100 dark:bg-gray-800 flex justify-center gap-2">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-idol-gold text-black rounded-md hover:bg-opacity-90 transition-colors"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText("Check out my photo strip from IdolBooth!");
              toast.success("Sharing message copied to clipboard!");
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoStrip;
