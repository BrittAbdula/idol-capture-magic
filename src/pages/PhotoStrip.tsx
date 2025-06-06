import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Undo2, Type, Image as ImageIcon, Printer, Share2, Settings, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MultiPhotoUpload from '../components/MultiPhotoUpload';
import { usePhotoStrip } from '../contexts/PhotoStripContext';
import PhotoStrip from '../components/PhotoStrip';
import { processPhotoStripData } from '@/lib/imageProcessing';
import SEO from '../components/SEO';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X, Copy, Mail, Twitter, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";

const PhotoStripPage: React.FC = () => {
  const { photoStripData, setPhotoStripData, updatePhotos, updateBackground, updateText, updateDecoration, updatePhotoOverlays, currentTemplate, setCurrentTemplate } = usePhotoStrip();
  const navigate = useNavigate();
  const stripCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#F7DC6F');
  const [customText, setCustomText] = useState<string>("My photo booth memories");
  const [showDate, setShowDate] = useState<boolean>(true);
  const [customColorInput, setCustomColorInput] = useState<string>('#F7DC6F');
  const [isGeneratingDownload, setIsGeneratingDownload] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [showUpload, setShowUpload] = useState<boolean>(true);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);
  const [showBorder, setShowBorder] = useState<boolean>(true);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [customIdol, setCustomIdol] = useState<string>("");
  const [isGeneratingIdol, setIsGeneratingIdol] = useState<boolean>(false);

  // New state for adaptive layout
  const [selectedMargin, setSelectedMargin] = useState<string>('20');
  const [selectedCols, setSelectedCols] = useState<string>('1');

  console.log("------PhotoStripPage - photoStripData:", photoStripData);

  const processedData = useMemo(() => {
    if (!photoStripData) return { hasValidPhotos: false, processedPhotos: [], processedOverlays: undefined };

    const data = processPhotoStripData(photoStripData);
    return {
      hasValidPhotos: data.hasValidPhotos,
      processedPhotos: data.processedPhotos,
      processedOverlays: data.processedOverlays
    };
  }, [photoStripData?.photos]);

  useEffect(() => {
    if (!dataInitialized && photoStripData) {
      console.log("PhotoStripPage - Initial data loading");
      const processed = processPhotoStripData(photoStripData);

      const updates: { showUpload?: boolean; selectedColor?: string; customColorInput?: string; customText?: string; } = {};

      if (processed.hasValidPhotos && processed.processedPhotos.length > 0) {
        updates.showUpload = false;
      } else {
        updates.showUpload = true;
      }

      if (photoStripData.background.color) {
        updates.selectedColor = photoStripData.background.color;
        updates.customColorInput = photoStripData.background.color;
      }

      if (photoStripData.text?.content) {
        updates.customText = photoStripData.text.content;
      }

      if (Object.keys(updates).length > 0) {
        setShowUpload(updates.showUpload);
        if (updates.selectedColor) setSelectedColor(updates.selectedColor);
        if (updates.customColorInput) setCustomColorInput(updates.customColorInput);
        if (updates.customText) setCustomText(updates.customText);
      }

      setDataInitialized(true);
    }
  }, [photoStripData, dataInitialized]);

  const handlePhotoUploadComplete = (photos: string[]) => {
    console.log("Upload complete with", photos.length, "photos");
    if (photos.length > 0) {
      // 如果还没有photoStripData，创建初始化数据
      if (!photoStripData) {
        const defaultPhotoStripData = {
          photoStripId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          templateId: "default",
          category: "general",
          canvasSize: {
            width: 1200,
            height: 1600
          },
          background: {
            type: "color" as const,
            color: selectedColor
          },
          photoPositions: [
            { x: 100, y: 100, width: 400, height: 500 },
            { x: 600, y: 100, width: 400, height: 500 },
            { x: 100, y: 700, width: 400, height: 500 },
            { x: 600, y: 700, width: 400, height: 500 }
          ],
          photoOverlays: [],
          decoration: [],
          photos: photos,
          text: {
            content: customText,
            font: "Arial",
            size: 24,
            color: "#FF4081",
            position: { x: 600, y: 1500 }
          },
          photoBoothSettings: {
            aspectRatio: "4:3",
            countdown: 3,
            photoNum: photos.length,
            filter: "Normal",
            lightColor: "#FFFFFF",
            sound: false
          }
        };

        setPhotoStripData(defaultPhotoStripData);
      } else {
        // 已有photoStripData，只更新照片
        updatePhotos(photos);
      }

      setShowUpload(false);
      toast.success("Photos uploaded successfully!");
    } else {
      toast.error("No photos were uploaded");
    }
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
    if (customText && photoStripData && photoStripData.text?.content !== customText) {
      updateText({
        content: customText,
        font: photoStripData.text?.font || 'Arial',
        size: photoStripData.text?.size || 24,
        color: photoStripData.text?.color || '#FF4081',
        position: {
          x: photoStripData.canvasSize ? photoStripData.canvasSize.width / 2 : 600,
          y: photoStripData.canvasSize ? photoStripData.canvasSize.height - 100 : 1500
        }
      });
    }

    if (photoStripData && photoStripData.background.color !== selectedColor) {
      updateBackground({
        ...photoStripData.background,
        type: 'color' as const,
        color: selectedColor
      });
    }
  }, [customText, selectedColor, updateText, updateBackground, photoStripData]);

  const handleDownload = () => {
    if (!photoStripData || !photoStripData.photos || photoStripData.photos.length === 0) {
      toast.error("No photos to download");
      return;
    }

    setIsGeneratingDownload(true);

    // Find the image element rendered by the PhotoStrip component
    const imgElement = document.querySelector('.photo-strip-preview img');

    if (!imgElement || !(imgElement instanceof HTMLImageElement)) {
      console.error("Download error: Could not find photo strip image element");
      toast.error("Failed to download photo strip: could not get image");
      setIsGeneratingDownload(false);
      return;
    }

    const dataUrl = imgElement.src;

    if (!dataUrl || dataUrl === '') {
      console.error("Download error: Image element has no source");
      toast.error("Failed to download photo strip: invalid image data");
      setIsGeneratingDownload(false);
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `idolbooth_photostrip_${Date.now()}.jpg`;
      link.href = dataUrl;
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
  };

  const handlePrint = () => {
    if (!photoStripData || !photoStripData.photos || photoStripData.photos.length === 0) {
      toast.error("No photos to print");
      return;
    }

    setIsPrinting(true);

    setTimeout(() => {
      try {
        const imgElement = document.querySelector('.photo-strip-preview img');
        if (!imgElement || !(imgElement instanceof HTMLImageElement)) {
          throw new Error("Could not find photo strip image element");
        }
        const dataUrl = imgElement.src;

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
    if (!photoStripData || !photoStripData.photos || photoStripData.photos.length === 0) {
      toast.error("No photos to share");
      return;
    }

    setIsSharing(true);

    try {
      // Get the image element from the photo strip preview
      const imgElement = document.querySelector('.photo-strip-preview img');
      if (!imgElement || !(imgElement instanceof HTMLImageElement)) {
        throw new Error("Could not find photo strip image element");
      }

      // Convert the image to blob
      const response = await fetch(imgElement.src);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'photostrip.png');

      // Upload to server
      const uploadResponse = await fetch('https://api.idolbooth.com/api/photos/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload image: ${errorData.message || uploadResponse.statusText}`);
      }

      const data = await uploadResponse.json();

      // Extract accessKey from the response
      const { accessKey } = data;

      if (!accessKey) {
        throw new Error("Upload successful, but no accessKey returned.");
      }

      // Set the share URL and show dialog
      const fullShareUrl = `${window.location.origin}/share?accessKey=${accessKey}`;
      setShareUrl(fullShareUrl);
      setShowShareDialog(true);

      toast.success("Photo strip ready to share!");

    } catch (error) {
      console.error("Share error:", error);
      if (error instanceof Error) {
        toast.error(`Failed to share photo strip: ${error.message}`);
      } else {
        toast.error("Failed to share photo strip");
      }
    } finally {
      setIsSharing(false);
    }
  };

  // 添加复制链接的处理函数
  const handleCopyLink = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    } finally {
      setIsCopying(false);
    }
  };

  const colors = [
    '#F7DC6F', '#FFFFFF', '#000000', '#FFD1DC', '#F5A9B8', '#B19CD9', '#AEC6CF',
    '#FF69B4', '#00008B', '#BDFFA3', '#FFDAB9', '#3A1E1E',
    '#C0C0C0', '#F2D7D5', '#A9CCE3', '#D5F5E3',
    '#4182E4', '#58D3F7', '#F9E79F', '#ABEBC6', '#F7B6D2', '#D3D3D3',
    '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#22C55E', '#EAB308'
  ];

  const handleGenerateIdol = async () => {
    setIsGeneratingIdol(true);
    try {
      // 获取当前照片条画布
      const stripCanvas = stripCanvasRef.current;
      if (!stripCanvas) {
        throw new Error("Could not find photo strip canvas");
      }

      // 将画布转换为 Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        stripCanvas.toBlob(resolve, 'image/png');
      });
      
      if (!blob) {
        throw new Error("Failed to convert canvas to blob");
      }

      const formData = new FormData();
      formData.append('image', blob, 'photostrip.png');
      formData.append('idolPrompt', customIdol);

      // 生成偶像照片条
      const idolResponse = await fetch('https://api.idolbooth.com/api/ai/generate-photo-with-idol', {
        method: 'POST',
        body: formData
      }); 

      if (!idolResponse.ok) {
        throw new Error("Failed to generate idol photo");
      }

      const { data } = await idolResponse.json();
      updatePhotos([data.image_url]); 
      toast.success("Idol photo strip generated successfully!");
    } catch (error) {
      console.error("Generate idol error:", error);
      toast.error("Failed to generate idol photo strip");
    } finally {
      setIsGeneratingIdol(false);
    }
  };

  console.log("PhotoStripPage render - showUpload:", showUpload);
  console.log("PhotoStripPage render - photoStripData:", processedData.processedPhotos.length, "photos");

  return (
    <div className="min-h-screen">
      <SEO
        title="Create Stunning Photo Strips with Idols | IdolBooth.com"
        description="Make beautiful photo strips with your idol photos. Download, share, and print your memories with our free online photo strip creator."
      />
      <Navbar />

      <main className="pt-28 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-montserrat">
            IdolBooth Photo Strip
          </h1>

          {processedData.hasValidPhotos && processedData.processedPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <div className="mb-4 relative mx-auto photo-strip-preview max-h-[60vh] overflow-auto md:max-h-none md:overflow-visible">
                  <PhotoStrip
                    ref={stripCanvasRef}
                    images={processedData.processedPhotos}
                    filter={photoStripData?.photoBoothSettings?.filter || 'Normal'}
                    backgroundColor={photoStripData?.background?.color || '#F7DC6F'}
                    text={photoStripData?.text}
                    decoration={photoStripData?.decoration}
                    showDate={showDate}
                    margin={parseInt(selectedMargin, 10)}
                    cols={parseInt(selectedCols, 10)}
                    showBorder={showBorder}
                    isGenerating={isGeneratingIdol}
                  />
                </div>

                {/* Mobile Settings Button (visible only on mobile) */}
                <div className="mt-4 block md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="idol-button-outline flex items-center justify-center gap-2">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[50vh] overflow-auto">
                      <SheetHeader className="mb-4">
                        <SheetTitle>Photo Strip Settings</SheetTitle>
                        <SheetDescription>
                          Customize your photo strip appearance
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="h-full pr-4">
                        {/* 添加生成偶像面板 */}
                        <div className="glass-panel p-6 mb-6">
                          <h2 className="text-xl font-semibold mb-4 font-montserrat">
                            Create with Idol
                          </h2>
                          <div className="space-y-6">
                            <div>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={customIdol}
                                  onChange={(e) => setCustomIdol(e.target.value)}
                                  placeholder="Enter idol name"
                                  className="w-full px-3 py-2 border rounded-md"
                                  maxLength={40}
                                />
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-2">Popular idols:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Ariana Grande",
                                      "BTS",
                                      "BLACKPINK",
                                      "JENNIE",
                                      "Lisa",
                                      "Rosé",
                                      "Jisoo",
                                    ].map(idol => (
                                      <button
                                        key={idol}
                                        onClick={() => setCustomIdol(idol)}
                                        className={`text-xs px-2 py-1 rounded-full ${customIdol === idol ? 'bg-idol-gold text-black' : 'bg-gray-100 hover:bg-gray-200'}`}
                                      >
                                        {idol}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="mt-2">
                                    <button 
                                      onClick={handleGenerateIdol}
                                      disabled={isGeneratingIdol}
                                      className={`text-xs px-2 py-1 rounded-full flex items-center justify-center w-full ${
                                        isGeneratingIdol 
                                          ? 'bg-gray-300 cursor-not-allowed' 
                                          : customIdol 
                                            ? 'bg-idol-gold text-black hover:bg-amber-400' 
                                            : 'bg-gray-100 hover:bg-gray-200'
                                      }`}
                                    >
                                      {isGeneratingIdol ? (
                                        <>
                                          <span className="animate-spin mr-1">🌀</span>
                                          <span>Generating...</span>
                                        </>
                                      ) : (
                                        <span>Generate with Idol</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Layout Settings */}
                        <div className="glass-panel p-6 mb-6">
                          <h2 className="text-xl font-semibold mb-4 font-montserrat">
                            Layout Settings
                          </h2>
                          <div className="space-y-6">
                            <div>
                              <label className="block mb-3">Photo Margin (px)</label>
                              <RadioGroup
                                value={selectedMargin}
                                onValueChange={setSelectedMargin}
                                className="flex gap-3"
                              >
                                {['0', '5', '10', '20', '40'].map((margin) => (
                                  <label
                                    key={margin}
                                    htmlFor={`margin-${margin}-mobile`}
                                    className="cursor-pointer flex-1"
                                  >
                                    <div
                                      className={`flex items-center justify-center h-16 rounded-md transition-all ${selectedMargin === margin ? 'border-idol-gold bg-idol-gold/10' : 'border-gray-200'}`}
                                      style={{ border: `${Math.max(1, parseInt(margin) / 6)}px solid` }}
                                    >
                                      <div className="bg-gray-300 rounded-md w-3/4 h-3/4"></div>
                                      <RadioGroupItem value={margin} id={`margin-${margin}-mobile`} className="sr-only" />
                                    </div>
                                    <span className={`block text-xs text-center mt-1 ${selectedMargin === margin ? 'font-medium text-idol-gold' : 'text-gray-600'}`}>
                                      {margin}px
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </div>
                            <div>
                              <label className="block mb-3">Photos per Row</label>
                              <RadioGroup
                                value={selectedCols}
                                onValueChange={setSelectedCols}
                                className="flex gap-3"
                              >
                                {[
                                  { value: '1', label: '1 Column' },
                                  { value: '2', label: '2 Columns' },
                                  { value: '3', label: '3 Columns' },
                                  { value: '4', label: '4 Columns' }
                                ].map((col) => (
                                  <label
                                    key={col.value}
                                    htmlFor={`cols-${col.value}-mobile`}
                                    className={`cursor-pointer flex-1`}
                                  >
                                    <div className={`border-2 p-2 rounded-md h-12 transition-all ${selectedCols === col.value ? 'border-idol-gold bg-idol-gold/10' : 'border-gray-200'}`}>
                                      {col.value === '1' && <div className="w-full h-full bg-gray-300 rounded-sm"></div>}
                                      {col.value === '2' && <div className="flex h-full gap-1"><div className="w-1/2 bg-gray-300 rounded-sm"></div><div className="w-1/2 bg-gray-300 rounded-sm"></div></div>}
                                      {col.value === '3' && <div className="flex h-full gap-1"><div className="w-1/3 bg-gray-300 rounded-sm"></div><div className="w-1/3 bg-gray-300 rounded-sm"></div><div className="w-1/3 bg-gray-300 rounded-sm"></div></div>}
                                      {col.value === '4' && <div className="flex h-full gap-1"><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div></div>}
                                      <RadioGroupItem value={col.value} id={`cols-${col.value}-mobile`} className="sr-only" />
                                    </div>
                                    <span className={`block text-xs text-center mt-1 ${selectedCols === col.value ? 'font-medium text-idol-gold' : 'text-gray-600'}`}>
                                      {col.label}
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </div>
                            <div className="setting-item">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={showBorder}
                                  onChange={(e) => setShowBorder(e.target.checked)}
                                />
                                <span className="text-sm"> Show Border</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Frame color */}
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

                        {/* Caption settings */}
                        <div className="glass-panel p-6 mb-6">
                          <h2 className="text-xl font-semibold mb-4 font-montserrat">
                            Caption settings
                          </h2>

                          <div className="space-y-6">
                            <div>
                              <Label className="block mb-2">Custom caption text</Label>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={customText}
                                  onChange={(e) => setCustomText(e.target.value)}
                                  placeholder="Add your custom text here"
                                  className="w-full px-3 py-2 border rounded-md"
                                  maxLength={40}
                                />
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-2">Quick captions:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "Best day ever! ✨",
                                      "Squad goals 💯",
                                      "My idol moment 💫",
                                      "Forever memory 💖",
                                      "Main character energy ⚡",
                                      "Ultimate fan moment 🔥",
                                      "Fandom life 💕",
                                      "Dream came true 🌟"
                                    ].map(caption => (
                                      <button
                                        key={caption}
                                        onClick={() => setCustomText(caption)}
                                        className={`text-xs px-2 py-1 rounded-full ${customText === caption ? 'bg-idol-gold text-black' : 'bg-gray-100 hover:bg-gray-200'
                                          }`}
                                      >
                                        {caption}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="showDate-mobile"
                                checked={showDate}
                                onCheckedChange={(checked) =>
                                  setShowDate(checked === true)}
                              />
                              <Label
                                htmlFor="showDate-mobile"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Show date
                              </Label>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Action buttons for mobile */}
                <div className="mt-2 flex flex-wrap gap-2 w-full md:hidden">
                  <Button
                    onClick={handleDownload}
                    className="flex-1 idol-button flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600"
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

                  <Button
                    onClick={handleGenerateIdol}
                    className="flex-1 idol-button flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 mb-2"
                    disabled={isGeneratingIdol}
                  >
                    {isGeneratingIdol ? (
                      <>
                        <span className="animate-spin mr-1">🌀</span>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5" />
                        <span>Generate with Idol</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Desktop settings panel - only visible on desktop */}
              <div className="hidden md:flex md:flex-col">
                <div className="glass-panel p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 font-montserrat">
                    Create a Photo Strip with your favorite Idol
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={customIdol}
                          onChange={(e) => setCustomIdol(e.target.value)}
                          placeholder="Custom idol and scene"
                          className="w-full px-3 py-2 border rounded-md"
                          maxLength={40}
                        />
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">Quick captions:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Ariana Grande",
                              "BTS",
                              "BLACKPINK",
                              "JENNIE",
                              "Lisa",
                              "Rosé",
                              "Jisoo",
                            ].map(idol => (
                              <button
                                key={idol}
                                onClick={() => setCustomIdol(idol)}
                                className={`text-xs px-2 py-1 rounded-full ${customIdol === idol ? 'bg-idol-gold text-black' : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                              >
                                {idol + " " + "💖"}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2">
                            <button 
                              onClick={handleGenerateIdol}
                              disabled={isGeneratingIdol}
                              className={`text-xs px-2 py-1 rounded-full flex items-center justify-center ${
                                isGeneratingIdol 
                                  ? 'bg-gray-300 cursor-not-allowed' 
                                  : customIdol 
                                    ? 'bg-idol-gold text-black hover:bg-amber-400' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {isGeneratingIdol ? (
                                <>
                                  <span className="animate-spin mr-1">🌀</span> Generating...
                                </>
                              ) : (
                                <span>Generate</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 font-montserrat">
                    Layout Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block mb-3">Photo Margin (px)</label>
                      <RadioGroup
                        value={selectedMargin}
                        onValueChange={setSelectedMargin}
                        className="flex gap-4"
                      >
                        {['0', '5', '10', '20', '40'].map((margin) => (
                          <label
                            key={margin}
                            htmlFor={`margin-${margin}`}
                            className="cursor-pointer flex-1"
                          >
                            <div
                              className={`flex items-center justify-center h-20 rounded-md transition-all ${selectedMargin === margin ? 'border-idol-gold bg-idol-gold/10' : 'border-gray-200'}`}
                              style={{ border: `${Math.max(1, parseInt(margin) / 5)}px solid` }}
                            >
                              <div className="bg-gray-300 rounded-md w-3/4 h-3/4"></div>
                              <RadioGroupItem value={margin} id={`margin-${margin}`} className="sr-only" />
                            </div>
                            <span className={`block text-sm text-center mt-1 ${selectedMargin === margin ? 'font-medium text-idol-gold' : 'text-gray-600'}`}>
                              {margin}px
                            </span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <label className="block mb-3">Photos per Row</label>
                      <RadioGroup
                        value={selectedCols}
                        onValueChange={setSelectedCols}
                        className="flex gap-4"
                      >
                        {[
                          { value: '1', label: '1 Column' },
                          { value: '2', label: '2 Columns' },
                          { value: '3', label: '3 Columns' },
                          { value: '4', label: '4 Columns' }
                        ].map((col) => (
                          <label
                            key={col.value}
                            htmlFor={`cols-${col.value}`}
                            className={`cursor-pointer w-[100px]`}
                          >
                            <div className={`border-2 p-2 rounded-md h-14 flex items-center justify-center transition-all ${selectedCols === col.value ? 'border-idol-gold bg-idol-gold/10' : 'border-gray-200'}`}>
                              {col.value === '1' && <div className="w-full h-full bg-gray-300 rounded-sm"></div>}
                              {col.value === '2' && <div className="flex h-full w-full gap-1"><div className="w-1/2 bg-gray-300 rounded-sm"></div><div className="w-1/2 bg-gray-300 rounded-sm"></div></div>}
                              {col.value === '3' && <div className="flex h-full w-full gap-1"><div className="w-1/3 bg-gray-300 rounded-sm"></div><div className="w-1/3 bg-gray-300 rounded-sm"></div><div className="w-1/3 bg-gray-300 rounded-sm"></div></div>}
                              {col.value === '4' && <div className="flex h-full w-full gap-1"><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div><div className="w-1/4 bg-gray-300 rounded-sm"></div></div>}
                              <RadioGroupItem value={col.value} id={`cols-${col.value}`} className="sr-only" />
                            </div>
                            <span className={`block text-sm text-center mt-1 ${selectedCols === col.value ? 'font-medium text-idol-gold' : 'text-gray-600'}`}>
                              {col.label}
                            </span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="setting-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={showBorder}
                          onChange={(e) => setShowBorder(e.target.checked)}
                        />
                        <span className="text-sm"> Show Border</span>
                      </label>
                    </div>
                  </div>
                </div>

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
                      <Label className="block mb-2">Custom caption text</Label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Add your custom text here"
                          className="w-full px-3 py-2 border rounded-md"
                          maxLength={40}
                        />
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">Quick captions:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Best day ever! ✨",
                              "Squad goals 💯",
                              "My idol moment 💫",
                              "Forever memory 💖",
                              "Main character energy ⚡",
                              "Ultimate fan moment 🔥",
                              "Fandom life 💕",
                              "Dream came true 🌟"
                            ].map(caption => (
                              <button
                                key={caption}
                                onClick={() => setCustomText(caption)}
                                className={`text-xs px-2 py-1 rounded-full ${customText === caption ? 'bg-idol-gold text-black' : 'bg-gray-100 hover:bg-gray-200'
                                  }`}
                              >
                                {caption}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDate"
                        checked={showDate}
                        onCheckedChange={(checked) =>
                          setShowDate(checked === true)}
                      />
                      <Label
                        htmlFor="showDate"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show date
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-auto">
                  <Button
                    onClick={handleDownload}
                    className="flex-1 idol-button flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600"
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
                  Upload Photos to Create a Photo Strip
                </h2>

                <MultiPhotoUpload
                  onComplete={handlePhotoUploadComplete}
                  template={currentTemplate}
                  aspectRatio={currentTemplate?.photoBoothSettings.aspectRatio || "4:3"}
                />

                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Upload 1-9 photos to create your photo strip, or use the photo booth to take new photos
                  </p>
                  <Button
                    onClick={() => navigate('/photo-booth')}
                    variant="outline"
                    className="idol-button-outline"
                  >
                    Go to Photo Booth
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md glass-panel animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-2xl font-montserrat text-center">Share Your Strip</DialogTitle>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Share URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share URL</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 font-mono text-sm bg-background/50"
                />
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  window.open(`https://x.com/intent/tweet?text=Check out my photo strip!&url=${encodeURIComponent(shareUrl)}`, '_blank');
                }}
                className="idol-button-outline flex items-center justify-center gap-3 w-full"
              >
                <X className="h-5 w-5" />
                <span>Share on X</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = `mailto:?subject=Check out my photo strip!&body=${encodeURIComponent(shareUrl)}`;
                }}
                className="idol-button-outline flex items-center justify-center gap-3 w-full"
              >
                <Mail className="h-5 w-5" />
                <span>Share via Email</span>
              </button>

              <button
                onClick={() => {
                  window.open(shareUrl, '_blank');
                }}
                className="idol-button-outline flex items-center justify-center gap-3 w-full"
              >
                <Eye className="h-5 w-5" />
                <span>Preview</span>
              </button>

              <button
                onClick={handleCopyLink}
                disabled={isCopying}
                className="idol-button flex items-center justify-center gap-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="h-5 w-5" />
                <span>{isCopying ? "Copying..." : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default PhotoStripPage;
