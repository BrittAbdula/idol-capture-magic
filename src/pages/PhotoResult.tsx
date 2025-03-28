import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Undo2, Type, Image as ImageIcon, Maximize2, X, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import NavbarThemed from '../components/NavbarThemed';
import Footer from '../components/Footer';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PhotoResultProps {}

const PhotoResult: React.FC<PhotoResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [images, setImages] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [showDate, setShowDate] = useState<boolean>(true);
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
  }, [dialogOpen, selectedColor, customText, showDate, aspectRatio]);

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

  const getOptimalCanvasSettings = (aspectRatio: string, imagesCount: number): {
    padding: number;
    sideMargin: number;
    topMargin: number;
    stripWidth: number;
  } => {
    let padding = 20;
    let sideMargin = 30;
    let topMargin = 30;
    let stripWidth = 0;

    switch (aspectRatio) {
      case '1:1':
        sideMargin = 40;
        topMargin = 40;
        stripWidth = 400;
        break;
      case '4:3':
        sideMargin = 35;
        topMargin = 35;
        stripWidth = 450;
        break;
      case '3:2':
        sideMargin = 35;
        topMargin = 35;
        stripWidth = 480;
        break;
      case '16:9':
        sideMargin = 30;
        topMargin = 30;
        stripWidth = 520;
        break;
      case '9:16':
        sideMargin = 25;
        topMargin = 25;
        stripWidth = 380;
        break;
      default:
        sideMargin = 35;
        topMargin = 35;
        stripWidth = 450;
    }

    if (imagesCount > 3) {
      padding = 15;
    } else if (imagesCount <= 2) {
      padding = 30;
    }

    return { padding, sideMargin, topMargin, stripWidth };
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
      
      const { padding, sideMargin, topMargin, stripWidth } = getOptimalCanvasSettings(aspectRatio, loadedImages.length);
      
      const scaledPadding = padding * scale;
      const scaledSideMargin = sideMargin * scale;
      const scaledTopMargin = topMargin * scale;
      const scaledStripWidth = stripWidth * scale;
      
      const totalImagesHeight = (imgHeight * loadedImages.length) + 
                          (scaledPadding * (loadedImages.length - 1));
      
      const textSpace = customText ? 120 * scale : 0;
      const dateSpace = showDate ? 80 * scale : 0;
      const extraSpace = textSpace + dateSpace + (scaledTopMargin * 2);
      
      const calculatedWidth = Math.max(scaledStripWidth, imgWidth + (scaledSideMargin * 2));
      canvas.width = calculatedWidth;
      canvas.height = totalImagesHeight + extraSpace;
      
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      loadedImages.forEach((img, index) => {
        const y = scaledTopMargin + (index * (imgHeight + scaledPadding));
        
        const borderWidth = 5 * scale;
        ctx.fillStyle = '#FFFFFF';
        
        const xPos = (canvas.width - imgWidth) / 2 - borderWidth;
        
        ctx.fillRect(xPos, y - borderWidth, 
                   imgWidth + (borderWidth * 2), imgHeight + (borderWidth * 2));
        
        ctx.drawImage(img, xPos + borderWidth, y, imgWidth, imgHeight);
      });
      
      if (customText) {
        const textY = canvas.height - (showDate ? 130 * scale : 60 * scale);
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
        ctx.font = `bold ${Math.max(24, 28 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(customText, canvas.width / 2, textY);
      }
      
      if (showDate) {
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF80' : '#00000080';
        ctx.font = `${Math.max(16, 20 * scale)}px monospace`;
        ctx.textAlign = 'center';
        const dateText = new Date().toLocaleDateString();
        ctx.fillText(dateText, canvas.width / 2, canvas.height - 80 * scale);
      }
      
      ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
      ctx.font = `bold ${Math.max(22, 26 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText("IdolBooth", canvas.width / 2, canvas.height - 35 * scale);
    });
  };

  useEffect(() => {
    if (thumbnailCanvasRef.current) {
      const scale = isMobile ? 0.3 : 0.4;
      generatePhotoStrip(thumbnailCanvasRef.current, scale);
    }
  }, [images, selectedColor, customText, showDate, isMobile, aspectRatio]);

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
      <NavbarThemed />
      
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
                  Caption settings
                </h2>
                
                <div className="space-y-6">
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
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="flex-1 idol-button flex items-center justify-center gap-2 py-3"
                      disabled={isGeneratingDownload || isPrinting || isSharing}
                    >
                      <Share2 className="w-5 h-5" />
                      <span>{isGeneratingDownload || isPrinting || isSharing ? "Processing..." : "Share"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleDownload} disabled={isGeneratingDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>{isGeneratingDownload ? "Generating..." : "Download"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrint} disabled={isPrinting}>
                      <Printer className="mr-2 h-4 w-4" />
                      <span>{isPrinting ? "Preparing..." : "Print"}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare} disabled={isSharing}>
                      <Share2 className="mr-2 h-4 w-4" />
                      <span>{isSharing ? "Sharing..." : "Share link"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  onClick={handleRetake}
                  className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                  variant="outline"
                >
                  <Undo2 className="w-5 h-5" />
                  <span>Retake</span>
                </Button>
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
