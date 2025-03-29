import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Undo2, Type, Image as ImageIcon, Maximize2, X, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import Navbar from '../components/Navbar';
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
import { usePhotoStrip, PhotoOverlay } from '@/contexts/PhotoStripContext';
import { processPhotoStripData } from '@/lib/imageProcessing';

interface PhotoResultProps {}

const PhotoResult: React.FC<PhotoResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { photoStripData, updatePhotos } = usePhotoStrip();
  const [images, setImages] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [showDate, setShowDate] = useState<boolean>(true);
  const [customColorInput, setCustomColorInput] = useState<string>('#FFFFFF');
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [photoOverlays, setPhotoOverlays] = useState<PhotoOverlay[] | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [dataReady, setDataReady] = useState<boolean>(false);

  useEffect(() => {
    console.log("PhotoResult - Initializing");
    
    if (location.state?.images && Array.isArray(location.state.images) && location.state.images.length > 0) {
      console.log("PhotoResult - Using images from location state:", location.state.images.length);
      setImages(location.state.images);
      
      if (location.state.aspectRatio) {
        setAspectRatio(location.state.aspectRatio);
      }

      if (photoStripData?.photoOverlays) {
        console.log("PhotoResult - Using overlays from photoStripData:", photoStripData.photoOverlays.length);
        setPhotoOverlays(photoStripData.photoOverlays);
      }
      
      setDataReady(true);
    } 
    else if (photoStripData) {
      console.log("PhotoResult - Checking photoStripData for images");
      const { hasValidPhotos, processedPhotos, processedOverlays } = processPhotoStripData(photoStripData);
      
      if (hasValidPhotos && processedPhotos.length > 0) {
        console.log("PhotoResult - Using images from photoStripData context:", processedPhotos.length);
        setImages(processedPhotos);
        
        if (photoStripData.photoBoothSettings?.aspectRatio) {
          setAspectRatio(photoStripData.photoBoothSettings.aspectRatio);
        }
        
        if (processedOverlays && processedOverlays.length > 0) {
          console.log("PhotoResult - Using overlays from photoStripData context:", processedOverlays.length);
          setPhotoOverlays(processedOverlays);
        }
        
        setDataReady(true);
      } else {
        console.error("PhotoResult - No valid images found in photoStripData");
        toast.error("No photos available. Please take new photos.");
        navigate('/photo-booth');
      }
    } else {
      console.error("PhotoResult - No location state or photoStripData available");
      toast.error("No photos available. Please take new photos.");
      navigate('/photo-booth');
    }
  }, [location, navigate, photoStripData]);

  useEffect(() => {
    if (dialogOpen && canvasRef.current && dataReady) {
      generatePhotoStrip(canvasRef.current, 1);
    }
  }, [dialogOpen, selectedColor, customText, showDate, aspectRatio, dataReady]);

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
    let padding = 25;
    let sideMargin = 35;
    let topMargin = 35;
    let stripWidth = 480;

    switch (aspectRatio) {
      case '1:1':
      case '4:3':
      case '3:2':
        sideMargin = 100;
        topMargin = 100;
        stripWidth = 480;
        padding = 25;
        break;
      default:
        sideMargin = 35;
        topMargin = 35;
        stripWidth = 480;
    }

    return { padding, sideMargin, topMargin, stripWidth };
  };

  const generatePhotoStrip = (targetCanvas: HTMLCanvasElement, scale: number = 1) => {
    if (!targetCanvas || !images || images.length === 0) {
      console.error("Cannot generate photo strip: canvas or images not available");
      return;
    }
    
    console.log(`PhotoResult - Generating photo strip with ${images.length} images and scale ${scale}`);
    
    const canvas = targetCanvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }
    
    const loadImages = images.map((src, index) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Loaded image ${index+1} successfully`);
          resolve(img);
        };
        img.onerror = (e) => {
          console.error(`Failed to load image ${index+1}: ${e}`);
          reject(new Error(`Failed to load image ${index+1}`));
        };
        img.src = src;
      });
    });
    
    const loadOverlays = photoOverlays ? photoOverlays.map((overlay, index) => {
      if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") {
        return Promise.resolve(null);
      }
      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Loaded overlay ${index+1} successfully`);
          resolve(img);
        };
        img.onerror = (e) => {
          console.error(`Failed to load overlay ${index+1}: ${e}`);
          resolve(null);
        };
        img.src = overlay.url;
      });
    }) : [];
    
    Promise.all([...loadImages, ...loadOverlays])
      .then(loadedImages => {
        if (loadedImages.length === 0) {
          console.error("No images loaded successfully");
          return;
        }
        
        const imageElements = loadedImages.slice(0, images.length) as HTMLImageElement[];
        const overlayElements = photoOverlays && photoOverlays.length > 0 ? 
                                loadedImages.slice(images.length).filter(Boolean) as HTMLImageElement[] : [];
        
        if (imageElements.length === 0) {
          console.error("No valid image elements to render");
          return;
        }
        
        console.log(`Processing ${imageElements.length} images and ${overlayElements.length} overlays`);
        
        const imgWidth = imageElements[0].width * scale;
        const imgHeight = imageElements[0].height * scale;
        
        const { padding, sideMargin, topMargin, stripWidth } = getOptimalCanvasSettings(aspectRatio, imageElements.length);
        
        const scaledPadding = padding * scale;
        const scaledSideMargin = sideMargin * scale;
        const scaledTopMargin = topMargin * scale;
        const scaledStripWidth = stripWidth * scale;
        
        const totalImagesHeight = (imgHeight * imageElements.length) + 
                            (scaledPadding * (imageElements.length - 1));
        
        const textSpace = customText ? 120 * scale : 0;
        const dateSpace = showDate ? 80 * scale : 0;
        const extraSpace = textSpace + dateSpace + (scaledTopMargin * 2);
        
        const calculatedWidth = Math.max(scaledStripWidth, imgWidth + (scaledSideMargin * 2));
        canvas.width = calculatedWidth;
        canvas.height = totalImagesHeight + extraSpace;
        
        console.log(`Canvas dimensions set to ${canvas.width}x${canvas.height}`);
        
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        imageElements.forEach((img, index) => {
          const y = scaledTopMargin + (index * (imgHeight + scaledPadding));
          
          const borderWidth = 5 * scale;
          ctx.fillStyle = '#FFFFFF';
          
          const xPos = (canvas.width - imgWidth) / 2 - borderWidth;
          
          ctx.fillRect(xPos, y - borderWidth, 
                     imgWidth + (borderWidth * 2), imgHeight + (borderWidth * 2));
          
          ctx.drawImage(img, xPos + borderWidth, y, imgWidth, imgHeight);
          
          if (photoOverlays && 
              photoOverlays[index] && 
              overlayElements[index] && 
              photoOverlays[index].url !== "/placeholder.svg") {
            const overlay = photoOverlays[index];
            const overlayImg = overlayElements[index];
            
            if (overlayImg) {
              const scale = overlay.scale || 1;
              
              const posX = xPos + borderWidth + overlay.position.x * scale;
              const posY = y + overlay.position.y * scale;
              
              const overlayWidth = overlayImg.width * scale;
              const overlayHeight = overlayImg.height * scale;
              
              ctx.drawImage(
                overlayImg,
                posX, posY, overlayWidth, overlayHeight
              );
              
              console.log(`Drew overlay ${index+1} at position ${posX},${posY} with size ${overlayWidth}x${overlayHeight}`);
            }
          }
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
        
        console.log("Photo strip generation complete");
      })
      .catch(error => {
        console.error("Error generating photo strip:", error);
        toast.error("Failed to generate photo strip");
      });
  };

  useEffect(() => {
    if (thumbnailCanvasRef.current && images.length > 0 && dataReady) {
      const scale = isMobile ? 0.3 : 0.4;
      console.log(`Generating thumbnail with scale ${scale}`);
      generatePhotoStrip(thumbnailCanvasRef.current, scale);
    }
  }, [images, selectedColor, customText, showDate, isMobile, aspectRatio, photoOverlays, dataReady]);

  const handleDownload = () => {
    if (!images || images.length === 0) {
      toast.error("No photos to download");
      return;
    }
    
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
    }, 1000);
  };

  const handlePrint = () => {
    if (!images || images.length === 0) {
      toast.error("No photos to print");
      return;
    }
    
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
                  }, 500);
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
    }, 1000);
  };

  const handleShare = async () => {
    if (!images || images.length === 0) {
      toast.error("No photos to share");
      return;
    }
    
    setIsSharing(true);
    
    try {
      const tempCanvas = document.createElement('canvas');
      generatePhotoStrip(tempCanvas, 1);
      
      setTimeout(async () => {
        try {
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
      }, 1000);
    } catch (error) {
      console.error("Share preparation error:", error);
      toast.error("Failed to prepare photo strip for sharing");
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
          
          {!dataReady && (
            <div className="text-center py-10">
              <div className="animate-pulse bg-gray-200 h-60 w-40 mx-auto rounded-md mb-4"></div>
              <p className="text-gray-500">Loading your photos...</p>
            </div>
          )}
          
          {dataReady && (
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
                        disabled={isGeneratingDownload || isPrinting || isSharing || !dataReady || images.length === 0}
                      >
                        <Share2 className="w-5 h-5" />
                        <span>{isGeneratingDownload || isPrinting || isSharing ? "Processing..." : "Share"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleDownload} disabled={isGeneratingDownload || !dataReady || images.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>{isGeneratingDownload ? "Generating..." : "Download"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint} disabled={isPrinting || !dataReady || images.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        <span>{isPrinting ? "Preparing..." : "Print"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare} disabled={isSharing || !dataReady || images.length === 0}>
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
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoResult;
