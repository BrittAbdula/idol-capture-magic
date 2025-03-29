import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Undo2, Type, Image as ImageIcon, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MultiPhotoUpload from '../components/MultiPhotoUpload';
import { usePhotoStrip } from '../contexts/PhotoStripContext';
import { templates } from '../data/templates';
import PhotoStrip from '../components/PhotoStrip';

const PhotoStripPage: React.FC = () => {
  const { photoStripData, setPhotoStripData, updatePhotos, updateBackground, updateText, updateDecoration, updatePhotoOverlays, currentTemplate, setCurrentTemplate } = usePhotoStrip();
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
  const [showUpload, setShowUpload] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    if (photoStripData) {
      console.log("PhotoStripPage - photoStripData loaded:", photoStripData);
      
      if (photoStripData.photos && photoStripData.photos.length > 0) {
        console.log("PhotoStripPage - Photos available:", photoStripData.photos.length);
        setShowUpload(false);
      } else {
        console.log("PhotoStripPage - No photos available, showing upload");
        setShowUpload(true);
      }
      
      if (photoStripData.background.color) {
        setSelectedColor(photoStripData.background.color);
        setCustomColorInput(photoStripData.background.color);
      }
      
      if (photoStripData.text?.content) {
        setCustomText(photoStripData.text.content);
      }
    } else {
      console.log("PhotoStripPage - No photoStripData available");
    }
  }, [photoStripData]);

  useEffect(() => {
    if (photoStripData?.photos && photoStripData.photos.length > 0) {
      console.log("Initial mount check - Photos found:", photoStripData.photos.length);
      setShowUpload(false);
    }
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.templateId === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCurrentTemplate(template);
      
      if (photoStripData) {
        const newPhotoStripData = {
          ...photoStripData,
          templateId: template.templateId,
          category: template.category,
          idol: template.idol,
          canvasSize: template.canvasSize,
          background: template.background,
          photoPositions: template.photoPositions,
          photoOverlays: template.photoOverlays,
          decoration: template.decoration,
          photoBoothSettings: template.photoBoothSettings
        };
        setPhotoStripData(newPhotoStripData);
      }
    }
  };

  const handlePhotoUploadComplete = (photos: string[]) => {
    console.log("Upload complete with", photos.length, "photos");
    updatePhotos(photos);
    setShowUpload(false);
    toast.success("Photos uploaded successfully!");
  };

  const getOptimalCanvasSettings = () => {
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
    
    const loadDecorations = photoStripData.decoration ? 
      photoStripData.decoration.map(dec => {
        if (!dec.url) return Promise.resolve(null);
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = dec.url;
        });
      }) : [];
    
    Promise.all([...loadImages, ...loadDecorations]).then(loadedAssets => {
      if (loadedAssets.length === 0) return;
      
      const loadedPhotos = loadedAssets.slice(0, photoStripData.photos.length) as HTMLImageElement[];
      const loadedDecorations = loadedAssets.slice(photoStripData.photos.length) as (HTMLImageElement | null)[];
      
      if (loadedPhotos.length === 0) return;
      
      const canvasWidth = photoStripData.canvasSize.width * scale;
      const canvasHeight = photoStripData.canvasSize.height * scale;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      ctx.fillStyle = photoStripData.background.color || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (photoStripData.background.type === 'image' && photoStripData.background.url) {
        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
          drawRemainingElements();
        };
        bgImg.onerror = () => {
          drawRemainingElements();
        };
        bgImg.src = photoStripData.background.url;
      } else {
        drawRemainingElements();
      }
      
      function drawRemainingElements() {
        loadedPhotos.forEach((img, index) => {
          if (index < photoStripData.photoPositions.length) {
            const pos = photoStripData.photoPositions[index];
            
            const borderWidth = 5 * scale;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
              pos.x * scale - borderWidth, 
              pos.y * scale - borderWidth, 
              pos.width * scale + (borderWidth * 2), 
              pos.height * scale + (borderWidth * 2)
            );
            
            ctx.drawImage(
              img, 
              pos.x * scale, 
              pos.y * scale, 
              pos.width * scale, 
              pos.height * scale
            );
          }
        });
        
        if (photoStripData.decoration && loadedDecorations.length > 0) {
          photoStripData.decoration.forEach((dec, index) => {
            const img = loadedDecorations[index];
            if (img && dec.position) {
              const decScale = dec.scale || 1;
              ctx.drawImage(
                img,
                dec.position.x * scale,
                dec.position.y * scale,
                img.width * decScale * scale,
                img.height * decScale * scale
              );
            }
          });
        }
        
        if (photoStripData.text) {
          const text = photoStripData.text;
          ctx.fillStyle = text.color;
          ctx.font = `${text.size * scale}px ${text.font || 'Arial'}`;
          ctx.textAlign = 'center';
          
          const textX = text.position ? text.position.x * scale : canvas.width / 2;
          const textY = text.position ? text.position.y * scale : canvas.height - 100 * scale;
          
          ctx.fillText(text.content, textX, textY);
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
      }
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

  useEffect(() => {
    if (customText && photoStripData) {
      updateText({
        content: customText,
        font: 'Arial',
        size: 24,
        color: '#FF4081',
        position: {
          x: photoStripData.canvasSize.width ? photoStripData.canvasSize.width / 2 : 600,
          y: photoStripData.canvasSize.height ? photoStripData.canvasSize.height - 100 : 1500
        }
      });
    }

    if (photoStripData) {
      updateBackground({
        type: 'color',
        color: selectedColor
      });
    }
  }, [customText, selectedColor, updateText, updateBackground, photoStripData]);

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

  console.log("PhotoStripPage render - showUpload:", showUpload);
  console.log("PhotoStripPage render - photoStripData:", photoStripData?.photos?.length || 0, "photos");

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-montserrat">
            Your Photo Strip
          </h1>
          
          {photoStripData?.photos?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <div className="mb-4 relative mx-auto">
                  <PhotoStrip 
                    images={photoStripData.photos}
                    filter={photoStripData.photoBoothSettings?.filter || 'Normal'}
                    photoOverlays={photoStripData.photoOverlays}
                  />
                </div>
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
                  <Button 
                    onClick={handleDownload}
                    className="flex-1 idol-button flex items-center justify-center gap-2 py-3"
                    disabled={isGeneratingDownload}
                  >
                    <Download className="w-5 h-5" />
                    <span>{isGeneratingDownload ? "Generating..." : "Download"}</span>
                  </Button>
                  
                  <Button 
                    onClick={handlePrint}
                    className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                    variant="outline"
                    disabled={isPrinting}
                  >
                    <Printer className="w-5 h-5" />
                    <span>{isPrinting ? "Preparing..." : "Print"}</span>
                  </Button>
                  
                  <Button 
                    onClick={handleShare}
                    className="flex-1 idol-button-outline flex items-center justify-center gap-2 py-3"
                    variant="outline"
                    disabled={isSharing}
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
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="glass-panel p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 font-montserrat">
                  Choose a Template (Optional)
                </h2>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (4 photos, 4:3)</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.templateId} value={template.templateId}>
                        {template.category} - {template.templateId} ({template.photoBoothSettings.photoNum} photos, {template.photoBoothSettings.aspectRatio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <MultiPhotoUpload 
                onComplete={handlePhotoUploadComplete}
                template={currentTemplate}
                aspectRatio={currentTemplate?.photoBoothSettings.aspectRatio || "4:3"}
              />
              
              <div className="mt-6 text-center">
                <Button
                  onClick={() => navigate('/photo-booth')}
                  variant="outline"
                  className="idol-button-outline"
                >
                  Go to Photo Booth Instead
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoStripPage;
