
import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoStripProps {
  images: string[];
  filter: string;
  showControls?: boolean;
}

const PhotoStrip: React.FC<PhotoStripProps> = ({ images, filter, showControls = true }) => {
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
    // Create a canvas element to combine the images into a single receipt-like strip
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
      
      // Set canvas size - vertical receipt-like strip format
      const imgWidth = loadedImages[0].width;
      const imgHeight = loadedImages[0].height;
      
      // Add some padding between photos and at the edges
      const padding = 20;
      const stripPadding = 30;
      
      canvas.width = imgWidth + (stripPadding * 2);
      canvas.height = (imgHeight * loadedImages.length) + (padding * (loadedImages.length - 1)) + (stripPadding * 2);
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw dotted perforation lines at top
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(canvas.width, 15);
      ctx.strokeStyle = '#AAAAAA';
      ctx.stroke();
      
      // Apply the filter effect if needed
      if (filter !== 'Normal') {
        // Apply the filter manually based on filter type
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
        const y = stripPadding + (index * (imgHeight + padding));
        ctx.drawImage(img, stripPadding, y, imgWidth, imgHeight);
        
        // Add timestamp under each photo
        ctx.filter = 'none'; // Reset filter for text
        ctx.fillStyle = '#333333';
        ctx.font = '12px monospace';
        const timestamp = new Date().toLocaleTimeString();
        const date = new Date().toLocaleDateString();
        ctx.fillText(`${date} ${timestamp}`, stripPadding + 10, y + imgHeight + 15);
        
        // Restore filter for next image
        if (filter !== 'Normal') {
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
        
        // Draw perforation line between photos (except after the last one)
        if (index < loadedImages.length - 1) {
          ctx.filter = 'none'; // Reset filter for dotted line
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, y + imgHeight + padding/2);
          ctx.lineTo(canvas.width, y + imgHeight + padding/2);
          ctx.strokeStyle = '#AAAAAA';
          ctx.stroke();
        }
      });
      
      // Draw dotted perforation line at bottom
      ctx.filter = 'none';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 15);
      ctx.lineTo(canvas.width, canvas.height - 15);
      ctx.strokeStyle = '#AAAAAA';
      ctx.stroke();
      
      // Add footer at the bottom of the receipt
      ctx.fillStyle = '#333333';
      ctx.font = '10px monospace';
      ctx.fillText('Thank you for using IdolBooth!', stripPadding + 10, canvas.height - 25);
      
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
    <div className="flex flex-col items-center">
      {images.length === 0 ? (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see your photo strip here</p>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-4 max-w-full overflow-auto">
          <div 
            className="receipt-strip bg-white shadow-md p-5 pb-10"
            style={{ 
              maxWidth: '280px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              borderTop: '1px dashed #aaa',
              borderBottom: '1px dashed #aaa'
            }}
          >
            {images.map((image, index) => (
              <div key={index} className="mb-4">
                <div className={`${getFilterClassName()} overflow-hidden`}>
                  <img 
                    src={image} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full mx-auto block" 
                  />
                </div>
                <div className="pt-2 text-xs text-gray-600 font-mono">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
                {index < images.length - 1 && (
                  <div className="w-full border-t border-dashed border-gray-300 my-4"></div>
                )}
              </div>
            ))}
            <div className="text-center text-xs text-gray-500 font-mono mt-2">
              Thank you for using IdolBooth!
            </div>
          </div>
        </div>
      )}
      
      {showControls && images.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
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
