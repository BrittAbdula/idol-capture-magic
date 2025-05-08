import React, { useState, useRef, ChangeEvent, useEffect, DragEvent } from 'react';
import { Upload, X, Plus, ImageIcon, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Template } from '@/contexts/PhotoStripContext';

interface MultiPhotoUploadProps {
  onComplete: (photos: string[]) => void;
  requiredCount?: number;
  template?: Template | null;
  aspectRatio?: string;
}

const MultiPhotoUpload: React.FC<MultiPhotoUploadProps> = ({ 
  onComplete, 
  requiredCount = 4,
  template,
  aspectRatio = "4:3"
}) => {
  // Use template settings if available
  const photoCount = template?.photoBoothSettings?.photoNum || requiredCount;
  const templateAspectRatio = template?.photoBoothSettings?.aspectRatio || aspectRatio;
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    processMultipleFiles(files);
  };

  const processMultipleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }

    // 限制上传的照片数量（最多9张）
    const maxPhotos = 9;
    if (photos.length + imageFiles.length > maxPhotos) {
      toast.warning(`You can upload a maximum of ${maxPhotos} photos`);
      // 只处理前几张以达到最大限制
      imageFiles.splice(0, maxPhotos - photos.length);
    }

    const promises = imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!e.target?.result) {
            resolve('');
            return;
          }
          
          // 创建图像对象获取尺寸并处理
          const img = new Image();
          img.onload = () => {
            // 创建画布进行裁剪（如果需要）
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve('');
              return;
            }
            
            // 根据选定的宽高比设置目标尺寸
            let targetWidth, targetHeight;
            const [widthRatio, heightRatio] = templateAspectRatio.split(':').map(Number);
            
            // 确定图像是否需要裁剪以匹配宽高比
            const imgRatio = img.width / img.height;
            const targetRatio = widthRatio / heightRatio;
            
            if (imgRatio > targetRatio) {
              // 图像比目标比例更宽，裁剪宽度
              targetHeight = img.height;
              targetWidth = img.height * targetRatio;
            } else {
              // 图像比目标比例更高，裁剪高度
              targetWidth = img.width;
              targetHeight = img.width / targetRatio;
            }
            
            // 设置画布尺寸为目标尺寸
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // 计算裁剪位置（居中裁剪）
            const cropX = (img.width - targetWidth) / 2;
            const cropY = (img.height - targetHeight) / 2;
            
            // 在画布上绘制裁剪后的图像
            ctx.drawImage(
              img, 
              cropX, cropY, targetWidth, targetHeight, // 源坐标
              0, 0, targetWidth, targetHeight          // 目标坐标
            );
            
            // 将画布转换为数据URL
            const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(croppedImageUrl);
          };
          
          img.src = e.target.result as string;
        };
        
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newPhotos) => {
      const validPhotos = newPhotos.filter(p => p !== '');
      setPhotos([...photos, ...validPhotos]);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processMultipleFiles(files);
    }
  };

  const handleComplete = () => {
    // 检查是否至少上传了1张照片
    if (photos.length < 1) {
      toast.error('Please upload at least 1 photo');
      return;
    }
    
    onComplete(photos);
  };

  // 获取预览框的显示比例
  const getRatioValue = (): number => {
    const [width, height] = templateAspectRatio.split(':').map(Number);
    return height / width;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-full p-6 mb-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDragging ? 'border-idol-gold bg-idol-gold bg-opacity-5' : 'border-gray-300 hover:border-idol-gold hover:bg-gray-50'
          }`}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-idol-gold bg-opacity-10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-idol-gold" />
            </div>
            <p className="mb-2 text-sm font-semibold">Click or drag photos here</p>
            <p className="text-xs text-gray-500">Upload multiple photos at once (JPG, PNG)</p>
            <p className="text-xs text-gray-500 mt-1">Please upload 1-9 photos to create a photo strip</p>
          </div>
        </div>

        {photos.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-2">Uploaded photos ({photos.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <AspectRatio ratio={getRatioValue()}>
                    <img 
                      src={photo} 
                      alt={`Uploaded photo ${index + 1}`} 
                      className="w-full h-full object-cover rounded-md border border-gray-200"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(index);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </AspectRatio>
                </div>
              ))}
              
              {photos.length < 9 && (
                <div 
                  onClick={triggerFileInput}
                  className="relative cursor-pointer"
                >
                  <AspectRatio ratio={getRatioValue()}>
                    <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-idol-gold transition-colors bg-gray-50">
                      <Plus className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Add more</span>
                    </div>
                  </AspectRatio>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          className="idol-button px-6 py-2"
          disabled={photos.length < 1}
        >
          Create Photo Strip
        </Button>
      </div>
    </div>
  );
};

export default MultiPhotoUpload;
