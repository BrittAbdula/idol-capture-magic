
import React, { useState } from 'react';
import { Download, Share2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoFrameProps {
  image: string;
  onEdit?: () => void;
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ image, onEdit }) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `idolbooth_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Photo downloaded successfully!");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        // Convert the image URL to a blob
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], "idolbooth_photo.jpg", { type: blob.type });
        
        await navigator.share({
          title: 'My IdolBooth Photo',
          text: 'Check out my photo from IdolBooth.com!',
          files: [file]
        });
        toast.success("Photo shared successfully!");
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(image);
        toast.success("Image URL copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share photo");
    }
  };

  return (
    <div 
      className="relative overflow-hidden rounded-lg shadow-glass-sm group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img 
        src={image} 
        alt="Captured photo" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
      />
      
      <div className={`absolute inset-0 bg-black/30 flex flex-col justify-between p-4 transition-opacity duration-300 ${
        isHovering ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="self-end flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
          )}
          
          <button
            onClick={handleShare}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoFrame;
