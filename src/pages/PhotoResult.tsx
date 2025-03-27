
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";

interface PhotoResultProps {}

const PhotoResult: React.FC<PhotoResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [timestamp] = useState<string>(new Date().toLocaleString());
  
  useEffect(() => {
    // Check if we have images in the state
    if (location.state?.images) {
      setImages(location.state.images);
      if (location.state.images.length > 0) {
        setSelectedImage(location.state.images[0]);
      }
    } else {
      // Redirect back to photo booth if no images
      navigate('/photo-booth');
    }
  }, [location, navigate]);

  const colors = [
    '#FFFFFF', '#000000', '#FFD1DC', '#F5A9B8', '#B19CD9', '#AEC6CF', 
    '#FF69B4', '#00008B', '#BDFFA3', '#FFDAB9', '#3A1E1E',
    '#C0C0C0', '#F2D7D5', '#A9CCE3', '#F7DC6F', '#D5F5E3', 
    '#4182E4', '#58D3F7', '#F9E79F', '#ABEBC6', '#F7B6D2', '#D3D3D3'
  ];

  const handleDownload = () => {
    if (!selectedImage) return;
    
    // Create a canvas element to generate the final image with frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // Set canvas size with additional space for frame
      canvas.width = img.width + 40;  // 20px padding on each side
      canvas.height = img.height + 120;  // More space at bottom for polaroid effect
      
      // Draw colored frame
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw white inner frame
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Draw image
      ctx.drawImage(img, 20, 20, img.width, img.height);
      
      // Add timestamp at the bottom
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(timestamp, canvas.width / 2, canvas.height - 30);
      
      // Convert to data URL and download
      const link = document.createElement('a');
      link.download = `photo_booth_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg');
      link.click();
      
      toast.success("Photo downloaded successfully!");
    };
    
    img.src = selectedImage;
  };

  const handleRetake = () => {
    navigate('/photo-booth');
  };

  // Render polaroid photos with the first one centered and others expanding right to left
  const renderPolaroidPhotos = () => {
    if (images.length === 0) return null;
    
    const photoWidth = 220; // Width of each photo container in pixels
    const gap = 16; // Gap between photos in pixels
    
    return (
      <div className="flex justify-center mt-4 mb-8 relative overflow-hidden" style={{ minHeight: '300px' }}>
        <div className="flex flex-row-reverse justify-center items-center gap-4 transition-all duration-300">
          {images.map((image, index) => {
            // Whether this image is selected
            const isSelected = selectedImage === image;
            
            // Calculate the z-index for overlapping effect (higher for more recent photos)
            const zIndex = images.length - index;
            
            return (
              <div 
                key={index}
                className={`polaroid-frame bg-white shadow-lg p-3 pb-8 transform transition-all duration-300 cursor-pointer ${isSelected ? 'scale-110 z-50' : 'scale-100 hover:scale-105'}`}
                style={{ 
                  maxWidth: '220px',
                  backgroundColor: isSelected ? selectedColor : '#FFFFFF',
                  zIndex,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                }}
                onClick={() => setSelectedImage(image)}
              >
                <div className="bg-white p-1 overflow-hidden">
                  <img 
                    src={image} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-auto" 
                  />
                </div>
                <div className="pt-3 pb-1 text-center text-xs text-gray-600">
                  {timestamp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-montserrat">
            Your Photo Booth Creation
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Photo display */}
            <div className="flex flex-col items-center">
              {renderPolaroidPhotos()}
              
              {images.length > 1 && (
                <Pagination>
                  <PaginationContent>
                    {images.map((image, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink 
                          isActive={selectedImage === image}
                          onClick={() => setSelectedImage(image)}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
            
            {/* Right column - Customization options */}
            <div className="flex flex-col">
              <div className="glass-panel p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 font-montserrat">
                  Frame color
                </h2>
                <div className="grid grid-cols-6 md:grid-cols-7 gap-3">
                  {colors.map((color, index) => (
                    <button
                      key={index}
                      className={`w-10 h-10 rounded-full border ${selectedColor === color ? 'ring-2 ring-offset-2 ring-idol-gold' : 'ring-1 ring-gray-200'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select color ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="glass-panel p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 font-montserrat">
                  Stickers
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <button
                      key={index}
                      className="w-16 h-16 border rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      aria-label={`Sticker ${index + 1}`}
                    >
                      {/* Sticker icon or placeholder */}
                      <span className="text-2xl">🌟</span>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4 text-xs text-gray-500">
                  Stickers feature coming soon!
                </div>
              </div>
              
              <div className="flex gap-4 mt-auto">
                <button 
                  onClick={handleDownload}
                  className="flex-1 idol-button flex items-center justify-center gap-2 py-3"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
                
                <button 
                  onClick={handleRetake}
                  className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                >
                  <Undo2 className="w-5 h-5" />
                  <span>Retake</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoResult;
