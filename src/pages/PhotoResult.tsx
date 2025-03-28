import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Undo2, Type, Image as ImageIcon, Maximize2, X, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogTrigger 
} from "@/components/ui/dialog";

interface PhotoResultProps {}

const PhotoResult: React.FC<PhotoResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [images, setImages] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [photoGap, setPhotoGap] = useState<number>(50);
  const [sidePadding, setSidePadding] = useState<number>(50);
  const [topPadding, setTopPadding] = useState<number>(50);
  const [showDate, setShowDate] = useState<boolean>(true);
  const [showDashedLines, setShowDashedLines] = useState<boolean>(false);
  const [customColorInput, setCustomColorInput] = useState<string>('#FFFFFF');
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    if (location.state?.images) {
      setImages(location.state.images);
      
      if (location.state.aspectRatio) {
        setAspectRatio(location.state.aspectRatio);
      }
    } else {
      navigate('/photo-booth');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (dialogOpen && canvasRef.current) {
      generatePhotoStrip(canvasRef.current, 1);
    }
  }, [dialogOpen, selectedColor, customText, photoGap, sidePadding, topPadding, showDate, showDashedLines, aspectRatio]);

  const colors = [
    '#FFFFFF', '#000000', '#FFD1DC', '#F5A9B8', '#B19CD9', '#AEC6CF', 
    '#FF69B4', '#00008B', '#BDFFA3', '#FFDAB9', '#3A1E1E',
    '#C0C0C0', '#F2D7D5', '#A9CCE3', '#F7DC6F', '#D5F5E3', 
    '#4182E4', '#58D3F7', '#F9E79F', '#ABEBC6', '#F7B6D2', '#D3D3D3',
    '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#22C55E', '#EAB308'
  ];

  const isDarkColor = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const generatePhotoStrip = (targetCanvas: HTMLCanvasElement, scale: number = 1) => {
    if (!targetCanvas || images.length === 0) return;
    
    const canvas = targetCanvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const loadImages = images.map(src => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    });
    
    Promise.all(loadImages).then(loadedImages => {
      if (loadedImages.length === 0) return;
      
      const imgWidth = loadedImages[0].width * scale;
      const imgHeight = loadedImages[0].height * scale;
      
      const padding = photoGap * scale;
      const sideMargin = (sidePadding / 2) * scale;
      const topMargin = (topPadding / 2) * scale;
      
      let stripWidth = imgWidth + (sideMargin * 2);
      
      if (aspectRatio === '9:16' || aspectRatio === '3:2') {
        stripWidth = Math.max(stripWidth, imgWidth * 1.3) + (sideMargin * 2);
      }
      
      const totalImagesHeight = (imgHeight * loadedImages.length) + 
                          (padding * (loadedImages.length - 1));
      
      const textSpace = customText ? 120 * scale : 0;
      const dateSpace = showDate ? 80 * scale : 0;
      const extraSpace = textSpace + dateSpace + (topMargin * 2);
      
      const stripHeight = totalImagesHeight + extraSpace;
      
      canvas.width = stripWidth;
      canvas.height = stripHeight;
      
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.setLineDash([8 * scale, 8 * scale]);
      ctx.beginPath();
      ctx.moveTo(0, 15 * scale);
      ctx.lineTo(canvas.width, 15 * scale);
      ctx.strokeStyle = isDarkColor(selectedColor) ? '#FFFFFF50' : '#00000050';
      ctx.stroke();
      
      loadedImages.forEach((img, index) => {
        const y = topMargin + (index * (imgHeight + padding));
        
        const borderWidth = 5 * scale;
        ctx.fillStyle = '#FFFFFF';
        
        const xPos = (stripWidth - imgWidth) / 2 - borderWidth;
        
        ctx.fillRect(xPos, y - borderWidth, 
                   imgWidth + (borderWidth * 2), imgHeight + (borderWidth * 2));
        
        ctx.drawImage(img, xPos + borderWidth, y, imgWidth, imgHeight);
        
        if (showDashedLines && index < loadedImages.length - 1) {
          ctx.setLineDash([5 * scale, 5 * scale]);
          ctx.beginPath();
          ctx.moveTo(0, y + imgHeight + padding/2);
          ctx.lineTo(canvas.width, y + imgHeight + padding/2);
          ctx.strokeStyle = isDarkColor(selectedColor) ? '#FFFFFF50' : '#00000050';
          ctx.stroke();
        }
      });
      
      if (customText) {
        const textY = stripHeight - (showDate ? 130 * scale : 60 * scale);
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
        ctx.font = `bold ${Math.max(24, 28 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(customText, stripWidth / 2, textY);
      }
      
      if (showDate) {
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF80' : '#00000080';
        ctx.font = `${Math.max(16, 20 * scale)}px monospace`;
        ctx.textAlign = 'center';
        const dateText = new Date().toLocaleDateString();
        ctx.fillText(dateText, stripWidth / 2, stripHeight - 80 * scale);
      }
      
      ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
      ctx.font = `bold ${Math.max(22, 26 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText("IdolBooth", stripWidth / 2, stripHeight - 35 * scale);
    });
  };

  useEffect(() => {
    if (thumbnailCanvasRef.current) {
      const scale = isMobile ? 0.3 : 0.4;
      generatePhotoStrip(thumbnailCanvasRef.current, scale);
    }
  }, [images, selectedColor, customText, photoGap, sidePadding, topPadding, showDate, showDashedLines, isMobile, aspectRatio]);

  const handleDownload = () => {
    setIsGeneratingDownload(true);
    
    const tempCanvas = document.createElement('canvas');
    
    generatePhotoStrip(tempCanvas, 1);
    
    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.download = `photo_strip_${Date.now()}.jpg`;
        link.href = tempCanvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Photo strip downloaded successfully!");
      } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download photo strip");
      } finally {
        setIsGeneratingDownload(false);
      }
    }, 500);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    const tempCanvas = document.createElement('canvas');
    generatePhotoStrip(tempCanvas, 1);
    
    setTimeout(() => {
      try {
        const dataUrl = tempCanvas.toDataURL('image/jpeg');
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error("Pop-up blocked. Please allow pop-ups to print.");
          setIsPrinting(false);
          return;
        }
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Photo Strip</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                }
                @media print {
                  body {
                    height: auto;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" />
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 200);
                };
              </script>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        toast.success("Preparing photo strip for printing!");
      } catch (error) {
        console.error("Print error:", error);
        toast.error("Failed to print photo strip");
      } finally {
        setIsPrinting(false);
      }
    }, 500);
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const tempCanvas = document.createElement('canvas');
      generatePhotoStrip(tempCanvas, 1);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        tempCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        }, 'image/jpeg', 0.95);
      });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Photo Strip from IdolBooth',
          text: 'Check out my photo strip from IdolBooth!',
          files: [new File([blob], 'photo-strip.jpg', { type: 'image/jpeg' })]
        });
        toast.success("Photo strip shared successfully!");
      } else {
        const shareUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `photo_strip_${Date.now()}.jpg`;
        link.href = shareUrl;
        link.click();
        
        URL.revokeObjectURL(shareUrl);
        
        toast.info("Sharing not supported on this browser. Photo strip downloaded instead.");
      }
    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info("Share operation was cancelled");
      } else {
        toast.error("Failed to share photo strip");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleRetake = () => {
    navigate('/photo-booth');
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
            <div className="flex flex-col items-center">
              <div className="mb-4 relative mx-auto">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
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
                  
                  <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Photo Strip Preview</DialogTitle>
                      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                      </DialogClose>
                    </DialogHeader>
                    <div className="flex justify-center items-center p-6 pt-0">
                      <ScrollArea className="h-[70vh] w-full">
                        <div className="flex justify-center">
                          <canvas 
                            ref={canvasRef} 
                            className="max-w-full shadow-lg mx-auto block"
                          />
                        </div>
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
                  
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => {
                        const color = e.target.value;
                        setCustomColorInput(color);
                        setSelectedColor(color);
                      }}
                      className="w-10 h-10 p-0 border-0 rounded-full cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => {
                        const color = e.target.value;
                        setCustomColorInput(color);
                        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                          setSelectedColor(color);
                        }
                      }}
                      placeholder="#RRGGBB"
                      className="w-24 px-2 py-1 border rounded-md text-sm"
                    />
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
                      max={100}
                      step={1}
                      onValueChange={(value) => setPhotoGap(value[0])}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span>Side margins</span>
                      <span className="text-sm text-gray-500">{sidePadding}px</span>
                    </label>
                    <Slider
                      value={[sidePadding]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setSidePadding(value[0])}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between mb-2">
                      <span>Top margin</span>
                      <span className="text-sm text-gray-500">{topPadding}px</span>
                    </label>
                    <Slider
                      value={[topPadding]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setTopPadding(value[0])}
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
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDate"
                        checked={showDate}
                        onCheckedChange={(checked) => 
                          setShowDate(checked === true)}
                      />
                      <label 
                        htmlFor="showDate"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show date
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDashedLines"
                        checked={showDashedLines}
                        onCheckedChange={(checked) => 
                          setShowDashedLines(checked === true)}
                      />
                      <label 
                        htmlFor="showDashedLines"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show dashed lines between photos
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-auto">
                <button 
                  onClick={handleDownload}
                  disabled={isGeneratingDownload}
                  className={`flex-1 idol-button flex items-center justify-center gap-2 py-3 ${isGeneratingDownload ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Download className="w-5 h-5" />
                  <span>{isGeneratingDownload ? "Generating..." : "Download"}</span>
                </button>
                
                <button 
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className={`flex-1 idol-button-secondary flex items-center justify-center gap-2 py-3 ${isPrinting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Printer className="w-5 h-5" />
                  <span>{isPrinting ? "Preparing..." : "Print"}</span>
                </button>
                
                <button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className={`flex-1 idol-button-secondary flex items-center justify-center gap-2 py-3 ${isSharing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Share2 className="w-5 h-5" />
                  <span>{isSharing ? "Sharing..." : "Share"}</span>
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
