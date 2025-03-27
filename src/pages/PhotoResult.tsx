
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Undo2, Type, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PhotoResultProps {}

const PhotoResult: React.FC<PhotoResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [photoGap, setPhotoGap] = useState<number>(20);
  const [showDate, setShowDate] = useState<boolean>(true);
  const [customColorInput, setCustomColorInput] = useState<string>('#FFFFFF');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
    '#4182E4', '#58D3F7', '#F9E79F', '#ABEBC6', '#F7B6D2', '#D3D3D3',
    '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#22C55E', '#EAB308'
  ];

  const generatePhotoStrip = (targetCanvas: HTMLCanvasElement, scale: number = 1) => {
    if (!targetCanvas || images.length === 0) return;
    
    const canvas = targetCanvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Load all images first
    const loadImages = images.map(src => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    });
    
    Promise.all(loadImages).then(loadedImages => {
      if (loadedImages.length === 0) return;
      
      // Get dimensions from first image
      const imgWidth = loadedImages[0].width * scale;
      const imgHeight = loadedImages[0].height * scale;
      
      // Calculate strip dimensions
      const padding = photoGap * scale;
      const stripPadding = 40 * scale;
      const stripWidth = imgWidth + (stripPadding * 2);
      
      // Calculate total height but make sure it fits in viewport
      const totalImagesHeight = (imgHeight * loadedImages.length) + 
                          (padding * (loadedImages.length - 1));
      
      // Add extra space for text and date
      const extraSpace = (customText ? 60 * scale : 0) + 
                         (showDate ? 40 * scale : 0) + 
                         (stripPadding * 2);
      
      const stripHeight = totalImagesHeight + extraSpace;
      
      // Set canvas size
      canvas.width = stripWidth;
      canvas.height = stripHeight;
      
      // Fill with selected background color
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add strip frame effect (dashed borders)
      ctx.setLineDash([8 * scale, 8 * scale]);
      ctx.beginPath();
      ctx.moveTo(0, 15 * scale);
      ctx.lineTo(canvas.width, 15 * scale);
      ctx.strokeStyle = isDarkColor(selectedColor) ? '#FFFFFF50' : '#00000050';
      ctx.stroke();
      
      // Draw photos
      loadedImages.forEach((img, index) => {
        const y = stripPadding + (index * (imgHeight + padding));
        
        // Draw white border around image
        const borderWidth = 5 * scale;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(stripPadding - borderWidth, y - borderWidth, 
                   imgWidth + (borderWidth * 2), imgHeight + (borderWidth * 2));
        
        // Draw the image
        ctx.drawImage(img, stripPadding, y, imgWidth, imgHeight);
        
        // Add perforations between photos (except after the last one)
        if (index < loadedImages.length - 1) {
          ctx.setLineDash([5 * scale, 5 * scale]);
          ctx.beginPath();
          ctx.moveTo(0, y + imgHeight + padding/2);
          ctx.lineTo(canvas.width, y + imgHeight + padding/2);
          ctx.strokeStyle = isDarkColor(selectedColor) ? '#FFFFFF50' : '#00000050';
          ctx.stroke();
        }
      });
      
      // Add custom text
      if (customText) {
        const textY = stripHeight - (showDate ? 90 * scale : 40 * scale);
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
        ctx.font = `bold ${24 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(customText, stripWidth / 2, textY);
      }
      
      // Add date
      if (showDate) {
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF80' : '#00000080';
        ctx.font = `${16 * scale}px monospace`;
        ctx.textAlign = 'center';
        const dateText = new Date().toLocaleDateString();
        ctx.fillText(dateText, stripWidth / 2, stripHeight - 40 * scale);
      }
      
      // Add IdolBooth logo
      ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
      ctx.font = `bold ${16 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText("IdolBooth", stripWidth / 2, stripHeight - 15 * scale);
    });
  };
  
  // Detect if color is dark (for text contrast)
  const isDarkColor = (hexColor: string): boolean => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance (perceived brightness)
    // Using the formula: (0.299*R + 0.587*G + 0.114*B)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // If luminance is less than 0.5, color is considered dark
    return luminance < 0.5;
  };

  useEffect(() => {
    if (canvasRef.current) {
      generatePhotoStrip(canvasRef.current, 1);
    }
    if (thumbnailCanvasRef.current) {
      // Use a smaller scale for thumbnail to ensure it fits on screen
      const scale = isMobile ? 0.3 : 0.4;
      generatePhotoStrip(thumbnailCanvasRef.current, scale);
    }
  }, [images, selectedColor, customText, photoGap, showDate, isMobile]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    // Create a download link for the canvas
    const link = document.createElement('a');
    link.download = `photo_strip_${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg');
    link.click();
    
    toast.success("Photo strip downloaded successfully!");
  };

  const handleRetake = () => {
    navigate('/photo-booth');
  };

  const handleAddCustomColor = () => {
    if (!customColorInput.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      toast.error("Please enter a valid hex color code.");
      return;
    }
    
    setSelectedColor(customColorInput);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-montserrat">
            Your Photo Strip
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Photo strip display */}
            <div className="flex flex-col items-center">
              <div className="mb-4 relative mx-auto">
                {/* Thumbnail version for display, sized to fit on one screen */}
                <Dialog>
                  <DialogTrigger>
                    <div className="relative cursor-pointer group">
                      <canvas 
                        ref={thumbnailCanvasRef} 
                        className="max-h-[60vh] shadow-lg transition-all duration-300 group-hover:shadow-xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/20 rounded-lg group-hover:opacity-100 transition-all duration-300">
                        <Maximize2 className="text-white w-10 h-10" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] p-0 overflow-auto">
                    <div className="p-6 bg-white flex justify-center">
                      <ScrollArea className="w-full max-h-[80vh]">
                        <canvas 
                          ref={canvasRef} 
                          className="max-w-full shadow-lg mx-auto"
                        />
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {images.length > 1 && (
                <div className="w-full max-w-md">
                  <p className="text-center text-sm text-gray-600 mb-2">All your photos are combined in the strip above</p>
                </div>
              )}
            </div>
            
            {/* Right column - Customization options */}
            <div className="flex flex-col">
              <div className="glass-panel p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 font-montserrat">
                  Frame color
                </h2>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color, index) => (
                    <button
                      key={index}
                      className={`w-10 h-10 rounded-full border ${selectedColor === color ? 'ring-2 ring-offset-2 ring-idol-gold' : 'ring-1 ring-gray-200'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select color ${index + 1}`}
                    />
                  ))}
                  
                  {/* Custom color picker */}
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      placeholder="#RRGGBB"
                      className="w-24 px-2 py-1 border rounded-md text-sm"
                    />
                    <button
                      onClick={handleAddCustomColor}
                      className="px-3 py-1 bg-idol-gold text-black rounded-md text-sm hover:bg-opacity-90 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 font-montserrat">
                  Photo strip settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span>Space between photos</span>
                      <span className="text-sm text-gray-500">{photoGap}px</span>
                    </label>
                    <Slider
                      value={[photoGap]}
                      min={5}
                      max={50}
                      step={1}
                      onValueChange={(value) => setPhotoGap(value[0])}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2">Custom caption text</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Add your custom text here"
                      className="w-full px-3 py-2 border rounded-md"
                      maxLength={40}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showDate"
                      checked={showDate}
                      onChange={(e) => setShowDate(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="showDate">Show date</label>
                  </div>
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
