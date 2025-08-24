
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  onUpload: (file: File) => void | Promise<void>;
  label?: string;
  className?: string;
  isUploading?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  onUpload, 
  label = "Upload Photo", 
  className = "",
  isUploading = false
}) => {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    // Pass the file to parent component
    await onUpload(file);
  };

  const clearFile = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*" 
        onChange={handleFileInputChange} 
      />
      
      <div 
        className={`border-2 border-dashed rounded-lg transition-all duration-300 overflow-hidden bg-gray-50 flex items-center justify-center
                   ${dragging ? 'border-idol-gold bg-idol-gold/5' : 'border-gray-300 hover:border-idol-gold/50'}
                   ${preview ? 'p-0' : 'p-8'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={preview ? undefined : triggerFileInput}
      >
        {preview ? (
          <div className="relative group w-full h-full flex items-center justify-center">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg" 
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <>
                <div className="w-16 h-16 border-4 border-idol-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-lg font-medium mb-2">Uploading...</p>
                <p className="text-sm text-gray-500">Please wait while we upload your image</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-idol-gold/10 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-idol-gold" />
                </div>
                <p className="text-lg font-medium mb-2">{label}</p>
                <p className="text-sm text-gray-500 mb-4">Drag & drop your image here or click to browse</p>
                <p className="text-xs text-gray-400">JPG, PNG, GIF up to 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
