import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';

interface PhotoStripProps {
  images: string[];
  filter: string;
  showControls?: boolean;
  backgroundColor?: string;
  text?: {
    content: string;
    font?: string;
    size?: number;
    color?: string;
  };
  decoration?: Array<{
    type: string;
    url: string;
    scale?: number;
  }>;
  showDate?: boolean;
  margin?: number;
  cols?: number;
  showBorder?: boolean;
}

const PhotoStrip = forwardRef<HTMLCanvasElement, PhotoStripProps>(({ 
  images, 
  filter, 
  showControls = true,
  backgroundColor = '#F7DC6F',
  text,
  decoration = [],
  showDate = true,
  margin = 20,
  cols = 1,
  showBorder = false,
}, ref) => {
  const [loaded, setLoaded] = useState(false);
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const stripRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Expose the internal canvas ref to the external ref
  useImperativeHandle(ref, () => canvasRef.current!, []);
  
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
  

  
  // Generate preview when relevant props change
  useEffect(() => {
    if (loaded && renderedImages.length > 0) {
      generatePhotoStripPreview();
    }
  }, [loaded, renderedImages, backgroundColor, text, decoration, showDate, filter, margin, cols, showBorder]);

  const getFilterClassName = () => {
    switch (filter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness(0.9) contrast(1.1)';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast(1.25) brightness(0.9)';
      default: return '';
    }
  };

  // Updated function: Calculate symmetric photo positions with proper 0px margin handling
  const calculateSymmetricPositions = (
    photoCount: number,
    canvasWidth: number,
    margin: number,
    cols: number
  ) => {
    const positions = [];

    // Handle 0px margin case - use minimal outer margin for canvas structure
    const outerMargin = margin === 0 ? 0 : margin;
    const photoMargin = margin; // Photo spacing can be 0

    // Available dimensions for photos
    const availableWidth = canvasWidth - (outerMargin * 2);

    // Calculate rows based on photo count and desired columns
    const rows = Math.ceil(photoCount / cols);

    // Calculate photo size, maintaining fixed aspect ratio (4:3)
    const photoRatio = 4 / 3; // Standard photo aspect ratio

    // Calculate column width - handle 0 margin case
    const totalHorizontalMargin = photoMargin * Math.max(0, cols - 1);
    const photoWidth = (availableWidth - totalHorizontalMargin) / cols;
    // Calculate height based on aspect ratio
    const photoHeight = photoWidth / photoRatio;

    // Calculate total canvas height: top outer margin + photo height of all rows + row spacing + bottom area height
    // Bottom area height is a fixed pixel value, used for placing text, date, and watermark
    const footerHeight = 150; // Reserve 150px as the bottom footer area
    const totalVerticalPhotoMargin = photoMargin * Math.max(0, rows - 1);
    const canvasHeight = outerMargin * 2 + (rows * photoHeight) + totalVerticalPhotoMargin + footerHeight;

    // Determine vertical starting position for photos
    const verticalStart = outerMargin; // Photos start after top outer margin

    // Calculate positions for each photo
    for (let i = 0; i < photoCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Handle centering for the last row if it's not full
      let rowXOffset = 0;
      const isLastRow = row === rows - 1;
      const photosInLastRow = photoCount - (row * cols);

      if (isLastRow && photosInLastRow < cols) {
        // Calculate extra offset to center the last row
        const lastRowWidth = (photosInLastRow * photoWidth) +
          ((photosInLastRow - 1) * photoMargin);
        rowXOffset = (availableWidth - lastRowWidth) / 2;
      }

      positions.push({
        x: outerMargin + rowXOffset + (col * (photoWidth + photoMargin)),
        y: verticalStart + (row * (photoHeight + photoMargin)),
        width: photoWidth,
        height: photoHeight
      });
    }

    return { positions, canvasHeight, footerHeight };
  };

  // Updated function: Draw photo maintaining aspect ratio with proper border handling for 0px margin
  const drawPhotoMaintainingAspectRatio = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    targetX: number, 
    targetY: number, 
    targetWidth: number, 
    targetHeight: number
  ) => {
    // Calculate the original aspect ratio of the image
    const imgRatio = img.width / img.height;
    // Calculate the aspect ratio of the target area
    const targetRatio = targetWidth / targetHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    // Decide how to scale the image based on aspect ratio
    if (imgRatio > targetRatio) {
      // Image is wider, scale by width
      drawWidth = targetWidth;
      drawHeight = targetWidth / imgRatio;
      offsetY = (targetHeight - drawHeight) / 2;
    } else {
      // Image is taller, scale by height
      drawHeight = targetHeight;
      drawWidth = targetHeight * imgRatio;
      offsetX = (targetWidth - drawWidth) / 2;
    }
    
    // Draw image, maintaining original aspect ratio
    ctx.drawImage(
      img,
      targetX + offsetX,
      targetY + offsetY,
      drawWidth,
      drawHeight
    );
  };

  const generatePhotoStripPreview = useCallback(() => {
    if (!canvasRef.current || renderedImages.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Use a predefined width for the canvas and calculate height based on content
    const width = 800; // Predefined standard width

    // Calculate symmetric layout for photos using provided margin and cols
    const photoCount = renderedImages.length;
    const { positions: symmetricPositions, canvasHeight: calculatedHeight, footerHeight } = calculateSymmetricPositions(
      photoCount,
      width,
      margin,
      cols
    );

    const height = calculatedHeight; // Use calculated height

    canvas.width = width;
    canvas.height = height;
    
    // Fill with background color
    ctx.fillStyle = backgroundColor || '#F7DC6F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load all images first
    const imagesToLoad = [];
    
    // Load photos
    const photoPromises = renderedImages.map((photoUrl, index) => 
      new Promise<{img: HTMLImageElement, index: number}>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({img, index});
        img.onerror = (e) => {
          console.warn(`Failed to load photo at index ${index}:`, e);
          reject(new Error(`Failed to load photo ${index}`));
        };
        img.src = photoUrl;
      })
    );
    imagesToLoad.push(...photoPromises);
    
    // Load decorations
    const decorationPromises = decoration.map((dec, index) => {
      if (!dec.url) return Promise.resolve(null);
      return new Promise<{img: HTMLImageElement | null, index: number}>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({img, index});
        img.onerror = () => {
          console.warn(`Failed to load decoration at index ${index}`);
          resolve({img: null, index});
        };
        img.src = dec.url;
      });
    });
    imagesToLoad.push(...decorationPromises);
    
    
    
    // Wait for all images to load then render
    Promise.all(imagesToLoad)
      .then(results => {
        // Process loaded images
        const loadedImages = results.filter(result => result !== null);
        
        // Draw photo frames and images
        const loadedPhotos = loadedImages.filter(item => 
          item && 'index' in item && item.index < renderedImages.length
        ) as {img: HTMLImageElement, index: number}[];
        
        loadedPhotos.forEach(({img, index}) => {
          // Use our symmetric calculation
          const pos = symmetricPositions[index];
          
          if (!pos) { // Skip if position is undefined
            console.warn(`Skipping photo ${index} due to missing position data`);
            return;
          }
          
          // Draw white border/frame based on showBorder setting
          if (showBorder) {
            const borderWidth = Math.max(2, 5 * (pos.width / 800)); // Scaled border width
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
              pos.x - borderWidth, 
              pos.y - borderWidth, 
              pos.width + (borderWidth * 2), 
              pos.height + (borderWidth * 2)
            );
          }
          
          // Apply filter if needed
          if (filter !== 'Normal') {
            ctx.save();
            
            switch (filter) {
              case 'Warm':
                ctx.filter = 'sepia(0.3) brightness(1.05)';
                break;
              case 'Cool':
                ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)';
                break;
              case 'Vintage':
                ctx.filter = 'sepia(0.5) brightness(0.9) contrast(1.1)';
                break;
              case 'B&W':
                ctx.filter = 'grayscale(1)';
                break;
              case 'Dramatic':
                ctx.filter = 'contrast(1.25) brightness(0.9)';
                break;
            }
          }
          
          // Use aspect-ratio-maintaining drawing method
          drawPhotoMaintainingAspectRatio(
            ctx,
            img,
            pos.x,
            pos.y,
            pos.width,
            pos.height
          );
          
          if (filter !== 'Normal') {
            ctx.restore();
          }
        });
        
        // Draw decorations - centered horizontally, position vertically relative to canvas height
        const loadedDecorations = loadedImages.filter(item => 
          item && 'index' in item && 
          item.index >= renderedImages.length && 
          item.index < renderedImages.length + decoration.length
        ) as {img: HTMLImageElement | null, index: number}[];
        
        loadedDecorations.forEach(({img, index}) => {
          if (!img) return;
          
          const decorationIndex = index - renderedImages.length;
          const dec = decoration[decorationIndex];
          
          // Center horizontally, place in footer area or calculate position
          const decPosX = width / 2; // Center horizontally
          // Place decorations in the middle of the footer area
          const footerTopPosition = height - footerHeight;
          const decPosY = footerTopPosition + footerHeight / 2; // Center vertically within footer

          const scale = dec.scale || 1;
          
          ctx.drawImage(
            img,
            decPosX - (img.width * scale / 2),
            decPosY - (img.height * scale / 2),
            img.width * scale,
            img.height * scale
          );
        });
        
      
    
        
        // Calculate bottom area position - using the fixed footer height
        const footerTopPosition = height - footerHeight;

        // Determine which elements are present
        const elementsToDraw = [];
        if (text && text.content) {
          elementsToDraw.push('text');
        }
        if (showDate) {
          elementsToDraw.push('date');
        }
        elementsToDraw.push('watermark'); // Watermark is always present

        const numElements = elementsToDraw.length;
        const verticalPadding = footerHeight * 0.1; // Small padding at top/bottom of footer area
        const availableFooterHeight = footerHeight - (verticalPadding * 2);
        const elementSpacing = availableFooterHeight / Math.max(1, numElements); // Divide available height by number of elements

        // Calculate vertical positions
        const elementPositionsY: { [key: string]: number } = {};
        elementsToDraw.forEach((elementType, index) => {
          // Position elements based on index and calculated spacing
          elementPositionsY[elementType] = footerTopPosition + verticalPadding + (index + 0.5) * elementSpacing;
        });

        // Draw caption text - always centered horizontally, vertically within footer
        if (text && text.content) {
          ctx.fillStyle = text.color || '#000000';
          ctx.font = `${text.size || 24}px ${text.font || 'Arial'}`;
          ctx.textAlign = 'center';

          const textX = width / 2;
          // Position text using dynamically calculated Y
          ctx.fillText(text.content, textX, elementPositionsY['text']);
        }

        // Draw date if enabled - always centered horizontally, vertically within footer
        if (showDate) {
          ctx.fillStyle = isDarkColor(backgroundColor) ? '#FFFFFF80' : '#00000080';
          ctx.font = '16px monospace';
          ctx.textAlign = 'center';
          const dateText = new Date().toLocaleDateString();
          // Position date using dynamically calculated Y
          ctx.fillText(dateText, width / 2, elementPositionsY['date']);
        }

        // Draw watermark - always centered horizontally, vertically within footer
        ctx.fillStyle = isDarkColor(backgroundColor) ? '#FFFFFF' : '#000000';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        // Position watermark using dynamically calculated Y
        ctx.fillText("IdolBooth", width / 2, elementPositionsY['watermark']);

        // Save canvas as preview URL
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
      })
      .catch(err => {
        console.error("Error generating photo strip preview:", err);
        // Create a simple error message on canvas
        ctx.fillStyle = backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FF0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Error generating preview", canvas.width / 2, canvas.height / 2);
        
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
      });
  }, [renderedImages, backgroundColor, text, decoration, showDate, filter, margin, cols, showBorder]);

  const isDarkColor = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const handleDownload = () => {
    if (renderedImages.length === 0) {
      toast.error("No photos to download");
      return;
    }

    // If we already have a preview URL, use it directly
    if (previewUrl) {
      setTimeout(() => {
        try {
          const link = document.createElement('a');
          link.download = `photo_strip_${Date.now()}.jpg`;
          link.href = previewUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success("Photo strip downloaded successfully!");
        } catch (error) {
          console.error("Download error:", error);
          toast.error("Failed to download photo strip");
        }
      }, 200);
      return;
    }
    
    // Otherwise generate a new high-quality download
    if (!canvasRef.current) {
      toast.error("Cannot generate photo");
      return;
    }
    
    // Generate a fresh photo strip for download
    generatePhotoStripPreview(); // This will update previewUrl
    
    // Give it time to render and update previewUrl
    setTimeout(() => {
      if (previewUrl) { // Check previewUrl again after timeout
        const link = document.createElement('a');
        link.download = `photo_strip_${Date.now()}.jpg`;
        link.href = previewUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      
        toast.success("Photo strip downloaded successfully!");
      } else {
        toast.error("Failed to generate photo strip");
      }
    }, 500); // Adjust timeout if needed
  };

  // Force a repaint of the component when loaded changes
  useEffect(() => {
    if (stripRef.current) {
      // Trigger reflow to ensure layout updates
      const forceRepaint = stripRef.current.offsetHeight;
    }
  }, [loaded, renderedImages, previewUrl]); // Add previewUrl to dependencies

  // Force regeneration of preview when layout settings change
  useEffect(() => {
    if (loaded && renderedImages.length > 0) {
      // Clear previous preview URL to force re-render with new layout
      setPreviewUrl('');
      // Regenerate the preview with new layout settings after a small delay
      const timer = setTimeout(() => {
        generatePhotoStripPreview();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [margin, cols, showBorder, loaded, renderedImages, generatePhotoStripPreview]);

  return (
    <div 
      ref={stripRef} // Keep internal ref for layout calculations if needed
      style={{
        width: '100%',
        // Background color applied to the container when previewUrl is not ready
        backgroundColor: (!previewUrl && backgroundColor) ? (isDarkColor(backgroundColor) ? '#333' : backgroundColor) : undefined,
        padding: margin === 0 ? '0px' : `${margin}px` // Handle 0px margin case for container padding
      }}
      className="photo-strip-container relative flex justify-center"
    >
      {/* Hidden canvas for rendering - not displayed directly */}
      <canvas ref={canvasRef} className="hidden"></canvas>

      {!loaded || renderedImages.length === 0 ? (
        // Loading or no photos state
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see your photo strip here</p>
        </div>
      ) : (
        // Render the preview image or individual images while generating
        previewUrl ? (
          // Final rendered photo strip image
          <div 
            className="shadow-lg"
            style={{
              maxWidth: '280px',
              maxHeight: '600px',
              // Background color applied here when previewUrl is ready
              backgroundColor: backgroundColor || '#FFFFFF'
            }}
          >
            <img 
              src={previewUrl} 
              alt="Photo Strip Preview" 
              className="w-full h-auto block" // Ensure image takes up full width of its container
              style={{ backgroundColor: backgroundColor || '#FFFFFF' }} // Apply background to the image as well (optional, container should suffice)
            />
          </div>
        ) : (
          // Show individual images while generating the canvas preview
          <div 
            className="bg-white p-5 pb-10"
            style={{
              maxWidth: '280px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              backgroundColor: backgroundColor || '#FFFFFF',
              padding: margin === 0 ? '0px' : undefined // Remove padding for 0px margin
            }}
          >
            {renderedImages.map((image, index) => (
              <div key={index} className={margin === 0 ? "mb-0" : "mb-4 last:mb-0"}>
                <div className={`${getFilterClassName()} overflow-hidden relative`}>
                  <img 
                    src={image} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full mx-auto block" 
                    onLoad={() => console.log(`Photo ${index + 1} loaded`)}
                    onError={() => console.error(`Failed to load photo ${index + 1}`)}
                  />
                </div>
                {showDate && ( // Only show date below each individual photo in this state
                  <div className="pt-2 text-xs text-gray-600 font-mono">
                    {new Date().toLocaleDateString()}
                  </div>
                )}
                {/* No separator between images when using canvas for final output */}
              </div>
            ))}
            {/* Text and Watermark only shown on final canvas output, not individual previews */}
            <div className="text-center text-xs text-gray-500 font-mono mt-4">
              Generating preview...
            </div>
          </div>
        )
      )}
    </div>
  );
});

export default PhotoStrip;