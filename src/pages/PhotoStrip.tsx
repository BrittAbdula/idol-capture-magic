
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Undo2, Type, Image as ImageIcon, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhotoUpload from '../components/PhotoUpload';
import { usePhotoStrip } from '../contexts/PhotoStripContext';

const PhotoStrip: React.FC = () => {
  const { photoStripData, updatePhotos, updateBackground, updateText } = usePhotoStrip();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [showDate, setShowDate] = useState<boolean>(true);
  const [customColorInput, setCustomColorInput] = useState<string>('#FFFFFF');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [showUpload, setShowUpload] = useState<boolean>(false);

  useEffect(() => {
    if (!photoStripData) {
      navigate('/photo-booth');
      return;
    }

    // Update text in the photoStripData when customText changes
    if (customText) {
      updateText({
        content: customText,
        font: 'Arial',
        size: 24,
        color: '#FF4081',
        position: {
          x: 100,
          y: 1500
        }
      });
    }

    // Update background in the photoStripData when selectedColor changes
    updateBackground({
      type: 'color',
      color: selectedColor
    });
  }, [customText, selectedColor, photoStripData, navigate, updateText, updateBackground]);

  // Initialize from photoStripData
  useEffect(() => {
    if (photoStripData) {
      if (photoStripData.background.color) {
        setSelectedColor(photoStripData.background.color);
        setCustomColorInput(photoStripData.background.color);
      }
      
      if (photoStripData.text?.content) {
        setCustomText(photoStripData.text.content);
      }
    }
  }, [photoStripData]);

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        // Replace all photos with the uploaded one
        const newPhotos = Array(4).fill(e.target.result);
        updatePhotos(newPhotos);
        setShowUpload(false);
        toast.success("Photos uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const getOptimalCanvasSettings = () => {
    // Values as per specs
    return {
      padding: 25,
      sideMargin: 35,
      topMargin: 35,
      stripWidth: 480
    };
  };

  const generatePhotoStrip = (targetCanvas: HTMLCanvasElement, scale: number = 1) => {
    if (!targetCanvas || !photoStripData || photoStripData.photos.length === 0) return;
    
    const canvas = targetCanvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const loadImages = photoStripData.photos.map(src => {
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
      
      const { padding, sideMargin, topMargin, stripWidth } = getOptimalCanvasSettings();
      
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
      
      // Fill the background
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw each image
      loadedImages.forEach((img, index) => {
        const y = scaledTopMargin + (index * (imgHeight + scaledPadding));
        
        // Add white border around each photo
        const borderWidth = 5 * scale;
        ctx.fillStyle = '#FFFFFF';
        
        // Center the image horizontally
        const xPos = (canvas.width - imgWidth) / 2 - borderWidth;
        
        // Draw white border
        ctx.fillRect(xPos, y - borderWidth, 
                   imgWidth + (borderWidth * 2), imgHeight + (borderWidth * 2));
        
        // Draw the image
        ctx.drawImage(img, xPos + borderWidth, y, imgWidth, imgHeight);
      });
      
      // Add custom text if provided
      if (customText) {
        const textY = canvas.height - (showDate ? 130 * scale : 60 * scale);
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
        ctx.font = `bold ${Math.max(24, 28 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(customText, canvas.width / 2, textY);
      }
      
      // Add date if enabled
      if (showDate) {
        ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF80' : '#00000080';
        ctx.font = `${Math.max(16, 20 * scale)}px monospace`;
        ctx.textAlign = 'center';
        const dateText = new Date().toLocaleDateString();
        ctx.fillText(dateText, canvas.width / 2, canvas.height - 80 * scale);
      }
      
      // Add IdolBooth branding
      ctx.fillStyle = isDarkColor(selectedColor) ? '#FFFFFF' : '#000000';
      ctx.font = `bold ${Math.max(22, 26 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText("IdolBooth", canvas.width / 2, canvas.height - 35 * scale);
    });
  };

  const isDarkColor = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  useEffect(() => {
    if (thumbnailCanvasRef.current && photoStripData && photoStripData.photos.length > 0) {
      const scale = isMobile ? 0.3 : 0.4;
      generatePhotoStrip(thumbnailCanvasRef.current, scale);
    }
  }, [photoStripData, selectedColor, customText, showDate, isMobile]);

  const handleDownload = () => {
    if (!photoStripData || photoStripData.photos.length === 0) {
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
    }, 500);
  };

  const handlePrint = () => {
    if (!photoStripData || photoStripData.photos.length === 0) {
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
    if (!photoStripData || photoStripData.photos.length === 0) {
      toast.error("No photos to share");
      return;
    }

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

  const colors = [
    '#FFFFFF', '#000000', '#FFD1DC', '#F5A9B8', '#B19CD9', '#AEC6CF', 
    '#FF69B4', '#00008B', '#BDFFA3', '#FFDAB9', '#3A1E1E',
    '#C0C0C0', '#F2D7D5', '#A9CCE3', '#F7DC6F', '#D5F5E3', 
    '#4182E4', '#58D3F7', '#F9E79F', '#ABEBC6', '#F7B6D2', '#D3D3D3',
    '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#22C55E', '#EAB308'
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-montserrat">
            Your Photo Strip
          </h1>
          
          {showUpload ? (
            <div className="max-w-xl mx-auto">
              <PhotoUpload
                onUpload={handlePhotoUpload}
                label="Upload Your Photos"
              />
              <Button
                onClick={() => setShowUpload(false)}
                className="w-full mt-4"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                {(!photoStripData || photoStripData.photos.length === 0) ? (
                  <div className="glass-panel p-6 text-center">
                    <div className="mb-4 text-gray-500">
                      <ImageIcon className="w-16 h-16 mx-auto opacity-30" />
                    </div>
                    <h2 className="text-xl font-semibold mb-4">No Photos Yet</h2>
                    <p className="text-gray-600 mb-6">
                      You haven't taken any photos yet. Take photos or upload your own to create a photo strip.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => navigate('/photo-booth')}
                        className="idol-button w-full"
                      >
                        Take Photos
                      </Button>
                      <Button
                        onClick={() => setShowUpload(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Upload Photos
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 relative mx-auto">
                    <ScrollArea className="h-[70vh] w-full">
                      <div className="flex justify-center">
                        <canvas 
                          ref={thumbnailCanvasRef} 
                          className="max-h-[60vh] shadow-lg mx-auto block"
                        />
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              {(photoStripData && photoStripData.photos.length > 0) && (
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
                    <Button 
                      onClick={handleDownload}
                      className="flex-1 idol-button flex items-center justify-center gap-2 py-3"
                      disabled={isGeneratingDownload || !photoStripData || photoStripData.photos.length === 0}
                    >
                      <Download className="w-5 h-5" />
                      <span>{isGeneratingDownload ? "Generating..." : "Download"}</span>
                    </Button>
                    
                    <Button 
                      onClick={handlePrint}
                      className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                      variant="outline"
                      disabled={isPrinting || !photoStripData || photoStripData.photos.length === 0}
                    >
                      <Printer className="w-5 h-5" />
                      <span>{isPrinting ? "Preparing..." : "Print"}</span>
                    </Button>
                    
                    <Button 
                      onClick={handleShare}
                      className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                      variant="outline"
                      disabled={isSharing || !photoStripData || photoStripData.photos.length === 0}
                    >
                      <Share2 className="w-5 h-5" />
                      <span>{isSharing ? "Sharing..." : "Share"}</span>
                    </Button>
                    
                    <Button 
                      onClick={() => navigate('/photo-booth')}
                      className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                      variant="outline"
                    >
                      <Undo2 className="w-5 h-5" />
                      <span>Take New Photos</span>
                    </Button>
                    
                    <Button 
                      onClick={() => setShowUpload(true)}
                      className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                      variant="outline"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload Photos</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoStrip;
