import React, { useEffect, useState, useRef } from 'react';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PhotoOverlay } from '@/contexts/PhotoStripContext';
import { processPhotoStripData } from '@/lib/imageProcessing';

interface PhotoStripProps {
  images: string[];
  filter: string;
  showControls?: boolean;
  photoOverlays?: PhotoOverlay[];
  // 添加新的属性
  background?: {
    type: string;
    color?: string;
    url?: string;
    imageUrl?: string;
  };
  decoration?: {
    url?: string;
    position?: { x: number; y: number };
    scale?: number;
  }[];
  text?: {
    content: string;
    font?: string;
    size?: number;
    color?: string;
    position?: { x: number; y: number };
  };
  showDate?: boolean;
  canvasSize?: { width: number; height: number };
  photoPositions?: { x: number; y: number; width: number; height: number }[];
  selectedColor?: string;
}

const PhotoStrip: React.FC<PhotoStripProps> = ({ 
  images, 
  filter, 
  showControls = true,
  photoOverlays,
  background,
  decoration,
  text,
  showDate,
  canvasSize,
  photoPositions,
  selectedColor
}) => {
  const [loaded, setLoaded] = useState(false);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  const [renderedOverlays, setRenderedOverlays] = useState<PhotoOverlay[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Process incoming images and set them for rendering - with stable dependency array
  useEffect(() => {
    console.log("PhotoStrip component - Images received:", images?.length || 0);
    
    // Validate images array
    if (Array.isArray(images) && images.length > 0) {
      console.log("PhotoStrip - Valid images array found");
      
      // Filter out any empty strings or non-string values
      const validImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
      
      if (validImages.length > 0) {
        console.log("PhotoStrip - Setting", validImages.length, "valid images");
        setRenderedImages(validImages);
        setLoaded(true);
      } else {
        console.error("PhotoStrip - No valid images found in array");
        setLoaded(false);
      }
    } else {
      console.error("PhotoStrip - Invalid or empty images array", images);
      setLoaded(false);
    }
  }, [images]); // Only depend on images, not derived state
  
  // Process overlays separately to avoid dependency cycles
  useEffect(() => {
    // Process overlays if they exist
    if (photoOverlays && photoOverlays.length > 0) {
      console.log("PhotoStrip - Overlays received:", photoOverlays.length);
      const validOverlays = photoOverlays.filter(overlay => 
        overlay && overlay.url && overlay.url !== "/placeholder.svg"
      );
      
      console.log("PhotoStrip - Setting", validOverlays.length, "valid overlays");
      setRenderedOverlays(validOverlays);
    } else {
      setRenderedOverlays([]);
    }
  }, [photoOverlays]); // Only depend on photoOverlays

  // 渲染预览图到画布
  useEffect(() => {
    if (canvasRef.current && loaded && renderedImages.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // 设置画布尺寸
      const width = canvasSize?.width || 480;
      const height = canvasSize?.height || 640;
      canvas.width = width;
      canvas.height = height;
      
      // 绘制背景
      ctx.fillStyle = background?.color || selectedColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // 如果有背景图片，加载并绘制
      if (background?.type === 'image' && (background.url || background.imageUrl)) {
        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, width, height);
          drawRemainingElements();
        };
        bgImg.onerror = () => {
          drawRemainingElements();
        };
        bgImg.src = background.url || background.imageUrl || '';
      } else {
        drawRemainingElements();
      }
      
      function drawRemainingElements() {
        // 加载并绘制照片
        const loadImages = renderedImages.map(src => {
          return new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null as unknown as HTMLImageElement);
            img.src = src;
          });
        });
        
        // 加载装饰元素
        const loadDecorations = decoration ? 
          decoration.map(dec => {
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
          
          const loadedPhotos = loadedAssets.slice(0, renderedImages.length) as HTMLImageElement[];
          const loadedDecorations = loadedAssets.slice(renderedImages.length) as (HTMLImageElement | null)[];
          
          if (loadedPhotos.length === 0) return;
          
          // 应用滤镜效果
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
          
          // 绘制照片
          if (photoPositions && photoPositions.length > 0) {
            loadedPhotos.forEach((photo, index) => {
              if (index < photoPositions.length && photo) {
                const pos = photoPositions[index];
                
                // 绘制白色边框
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(
                  pos.x - 5, 
                  pos.y - 5, 
                  pos.width + 10, 
                  pos.height + 10
                );
                
                // 绘制照片
                ctx.drawImage(
                  photo, 
                  pos.x, 
                  pos.y, 
                  pos.width, 
                  pos.height
                );
              }
            });
          } else {
            // 如果没有指定位置，使用默认布局
            const imgWidth = width * 0.8;
            const imgHeight = imgWidth * 0.75;
            const padding = 20;
            const startY = 50;
            
            loadedPhotos.forEach((photo, index) => {
              if (photo) {
                const y = startY + (index * (imgHeight + padding));
                ctx.drawImage(
                  photo, 
                  (width - imgWidth) / 2, 
                  y, 
                  imgWidth, 
                  imgHeight
                );
              }
            });
          }
          
          // 在照片上绘制背景图片（如果需要）
          if (background?.type === 'image' && (background.url || background.imageUrl)) {
            const bgImg = new Image();
            bgImg.onload = () => {
              ctx.globalCompositeOperation = 'source-atop';
              ctx.drawImage(bgImg, 0, 0, width, height);
              ctx.globalCompositeOperation = 'source-over';
            };
            bgImg.src = background.url || background.imageUrl || '';
          }
          
          // 绘制装饰元素
          ctx.filter = 'none'; // 重置滤镜
          if (decoration && loadedDecorations.length > 0) {
            decoration.forEach((dec, index) => {
              const img = loadedDecorations[index];
              if (img && dec.position) {
                const decScale = dec.scale || 1;
                ctx.drawImage(
                  img,
                  dec.position.x,
                  dec.position.y,
                  img.width * decScale,
                  img.height * decScale
                );
              }
            });
          }
          
          // 绘制文本
          if (text && text.content) {
            ctx.fillStyle = text.color || '#000000';
            ctx.font = `${text.size || 24}px ${text.font || 'Arial'}`;
            ctx.textAlign = 'center';
            
            const textX = text.position ? text.position.x : width / 2;
            const textY = text.position ? text.position.y : height - 100;
            
            ctx.fillText(text.content, textX, textY);
          }
          
          // 绘制日期
          if (showDate) {
            ctx.fillStyle = '#00000080';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            const dateText = new Date().toLocaleDateString();
            ctx.fillText(dateText, width / 2, height - 80);
          }
          
          // 绘制水印
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("IdolBooth", width / 2, height - 35);
        });
      }
    }
  }, [loaded, renderedImages, renderedOverlays, background, decoration, text, showDate, canvasSize, photoPositions, selectedColor, filter]);

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
    
    if (!ctx || renderedImages.length === 0) {
      toast.error("No photos to download");
      return;
    }
    
    // We'll need to load the images first
    const loadImages = renderedImages.map(src => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          reject(new Error(`Failed to load image: ${src}`));
        };
        img.src = src;
      });
    });
    
    // If we have photo overlays, preload them too
    const loadOverlays = renderedOverlays.length > 0 ? renderedOverlays.map(overlay => {
      if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") {
        return Promise.resolve(null);
      }
      return new Promise<HTMLImageElement | null>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`Failed to load overlay: ${overlay.url}`);
          resolve(null);
        };
        img.src = overlay.url;
      });
    }) : [];
    
    Promise.all([...loadImages, ...loadOverlays]).then(loadedImages => {
      if (loadedImages.length === 0) {
        toast.error("Failed to load images");
        return;
      }
      
      // Separate loaded images and overlays
      const photoImages = loadedImages.slice(0, renderedImages.length) as HTMLImageElement[];
      const overlayImages = loadOverlays.length > 0 ? 
                            loadedImages.slice(renderedImages.length).filter(Boolean) as HTMLImageElement[] : [];
      
      // Set canvas size - vertical receipt-like strip format
      const imgWidth = photoImages[0].width;
      const imgHeight = photoImages[0].height;
      
      // Add some padding between photos and at the edges
      const padding = 20;
      const stripPadding = 30;
      
      canvas.width = imgWidth + (stripPadding * 2);
      canvas.height = (imgHeight * photoImages.length) + (padding * (photoImages.length - 1)) + (stripPadding * 2);
      
      // Fill with white background
      ctx.fillStyle = background?.color || selectedColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
      photoImages.forEach((img, index) => {
        const y = stripPadding + (index * (imgHeight + padding));
        ctx.drawImage(img, stripPadding, y, imgWidth, imgHeight);
        
        // If we have an overlay for this photo, draw it
        if (renderedOverlays[index] && overlayImages[index]) {
          const overlay = renderedOverlays[index];
          const overlayImg = overlayImages[index];
          
          if (overlayImg) {
            // Reset filter for overlay image
            ctx.filter = 'none';
            
            // Use exact position from the overlay position data
            const scale = overlay.scale || 1;
            const photoPosition = overlay.photoPosition;
            
            if (photoPosition) {
              const widthRatio = imgWidth / photoPosition.width;
              const heightRatio = imgHeight / photoPosition.height;
              
              const posX = stripPadding + (overlay.position.x * widthRatio);
              const posY = y + (overlay.position.y * heightRatio);
              
              const overlayWidth = overlayImg.width * scale;
              const overlayHeight = overlayImg.height * scale;
              
              ctx.drawImage(
                overlayImg,
                posX - (overlayWidth / 2),
                posY - (overlayHeight / 2),
                overlayWidth,
                overlayHeight
              );
            } else {
              // Fallback positioning
              const posX = stripPadding + overlay.position.x;
              const posY = y + overlay.position.y;
              
              const overlayWidth = overlayImg.width * scale;
              const overlayHeight = overlayImg.height * scale;
              
              ctx.drawImage(
                overlayImg,
                posX, posY, overlayWidth, overlayHeight
              );
            }
            
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
          }
        }
        
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
      });
      
      // Add footer at the bottom of the receipt
      ctx.filter = 'none';
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

  // Force a repaint of the component when loaded changes
  useEffect(() => {
    if (stripRef.current) {
      const forceRepaint = stripRef.current.offsetHeight;
    }
  }, [loaded, renderedImages]);

  return (
    <div className="flex flex-col items-center" ref={stripRef}>
      {!loaded || renderedImages.length === 0 ? (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see your photo strip here</p>
        </div>
      ) : (
        <>
          {/* 使用Canvas渲染预览图 */}
          <canvas 
            ref={canvasRef} 
            className="max-w-full" 
            style={{ 
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              maxWidth: '280px'
            }}
          />
          
          {/* 保留原有的照片条展示方式作为备用 */}
          <div className="hidden flex-col items-center mt-4 max-w-full overflow-auto">
            <div 
              className="bg-white p-5 pb-10"
              style={{ 
                maxWidth: '280px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}
            >
              {renderedImages.map((image, index) => (
                <div key={index} className="mb-4">
                  <div className={`${getFilterClassName()} overflow-hidden relative`}>
                    <img 
                      src={image} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full mx-auto block" 
                      onLoad={() => console.log(`Photo ${index + 1} loaded`)}
                      onError={() => console.error(`Failed to load photo ${index + 1}`)}
                    />
                    
                    {renderedOverlays[index] && renderedOverlays[index].url && 
                     renderedOverlays[index].url !== "/placeholder.svg" && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <img 
                          src={renderedOverlays[index].url}
                          alt={`Overlay ${index + 1}`}
                          style={{
                            position: 'absolute',
                            left: `${renderedOverlays[index].position.x}px`,
                            top: `${renderedOverlays[index].position.y}px`,
                            transform: `translate(-50%, -50%) scale(${renderedOverlays[index].scale || 1})`,
                            transformOrigin: 'center'
                          }}
                          onLoad={() => console.log(`Overlay ${index + 1} loaded`)}
                          onError={() => console.error(`Failed to load overlay ${index + 1}`)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="pt-2 text-xs text-gray-600 font-mono">
                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </div>
                  {index < renderedImages.length - 1 && (
                    <div className="w-full border-t border-gray-300 my-4"></div>
                  )}
                </div>
              ))}
              <div className="text-center text-xs text-gray-500 font-mono mt-2">
                Thank you for using IdolBooth!
              </div>
            </div>
          </div>
        </>
      )}
      
      {showControls && loaded && renderedImages.length > 0 && (
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
