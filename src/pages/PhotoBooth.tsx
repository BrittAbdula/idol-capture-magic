
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Camera, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebcamCapture from '../components/WebcamCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoFrame from '../components/PhotoFrame';
import PhotoStrip from '../components/PhotoStrip';
import PhotoFilters from '../components/PhotoFilters';
import FrameColorSelector from '../components/FrameColorSelector';
import StickersSelector from '../components/StickersSelector';
import { extractSubject, applyFilter } from '../lib/imageProcessing';

const PhotoBooth = () => {
  // State for photo booth
  const [step, setStep] = useState(1);
  const [idolPhoto, setIdolPhoto] = useState<string | null>(null);
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [filter, setFilter] = useState('Normal');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle idol photo upload
  const handleIdolPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const extractedImage = await extractSubject(file);
      setIdolPhoto(extractedImage);
      setStep(2);
    } catch (error) {
      console.error("Error processing idol photo:", error);
      toast.error("Failed to process idol photo");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle user photo capture from webcam
  const handlePhotoStripCapture = (images: string[]) => {
    setPhotoStripImages(images);
    if (images.length === 4) {
      setStep(3);
    }
  };
  
  // Handle user photo upload
  const handleUserPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      setPhotoStripImages(Array(4).fill(imageUrl));
      setStep(3);
    } catch (error) {
      console.error("Error processing user photo:", error);
      toast.error("Failed to process user photo");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle filter selection
  const handleFilterSelect = (filterName: string) => {
    setFilter(filterName);
  };
  
  // Handle frame color selection
  const handleFrameColorSelect = (color: string) => {
    setFrameColor(color);
  };
  
  // Handle sticker selection
  const handleStickerSelect = (stickerUrl: string) => {
    setSelectedSticker(stickerUrl);
  };
  
  // Reset the photo booth
  const handleReset = () => {
    setIdolPhoto(null);
    setPhotoStripImages([]);
    setFilter('Normal');
    setFrameColor('#FFFFFF');
    setSelectedSticker(null);
    setStep(1);
    setShowWebcam(true);
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-4 font-montserrat">Upload Idol Photo</h1>
              <p className="text-gray-600">
                Choose a photo of your favorite idol to start creating your photo strip.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PhotoUpload
                onUpload={handleIdolPhotoUpload}
                label="Upload Idol Photo"
                className="h-full"
              />
              
              <div className="glass-panel p-6">
                <h3 className="text-xl font-semibold mb-4 font-montserrat">Skip This Step?</h3>
                <p className="text-gray-600 mb-6">
                  If you want to take a regular photo without an idol, you can skip this step.
                </p>
                <button 
                  onClick={() => setStep(2)} 
                  className="idol-button-outline w-full"
                >
                  Skip to Camera
                </button>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left side: Photo strip preview */}
              <div className="md:col-span-3 order-2 md:order-1">
                <div className="text-center mb-3">
                  <h2 className="text-xl font-bold font-montserrat">Your Strip</h2>
                </div>
                <div className="glass-panel p-2 h-[400px]">
                  <PhotoStrip 
                    images={photoStripImages} 
                    filter={filter} 
                    frameColor={frameColor}
                    sticker={selectedSticker}
                  />
                </div>
              </div>
              
              {/* Middle: Webcam/Camera */}
              <div className="md:col-span-5 order-1 md:order-2">
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-bold font-montserrat">Take Your Photos</h1>
                  <p className="text-sm text-gray-600 mb-2">
                    We'll take 4 photos for your strip
                  </p>
                </div>
                
                {showWebcam ? (
                  <div className="relative">
                    <WebcamCapture onCapture={handlePhotoStripCapture} />
                    
                    <div className="mt-2 flex justify-center">
                      <button 
                        onClick={() => setShowWebcam(false)}
                        className="idol-button-outline text-sm py-1"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Photos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <PhotoUpload
                      onUpload={handleUserPhotoUpload}
                      label="Upload Your Photos"
                    />
                    
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setShowWebcam(true)}
                        className="idol-button-outline text-sm py-1"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Use Webcam
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right side: Options & customization */}
              <div className="md:col-span-4 order-3">
                <div className="space-y-6">
                  {/* Frame color options */}
                  <div className="glass-panel p-4">
                    <h3 className="text-lg font-semibold mb-3 font-montserrat">Frame Color</h3>
                    <FrameColorSelector 
                      selectedColor={frameColor} 
                      onSelectColor={handleFrameColorSelect} 
                    />
                  </div>
                  
                  {/* Stickers options */}
                  <div className="glass-panel p-4">
                    <h3 className="text-lg font-semibold mb-3 font-montserrat">Stickers</h3>
                    <StickersSelector 
                      selectedSticker={selectedSticker} 
                      onSelectSticker={handleStickerSelect} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left side: Photo strip preview */}
              <div className="md:col-span-3 order-2 md:order-1">
                <div className="text-center mb-3">
                  <h2 className="text-xl font-bold font-montserrat">Your Strip</h2>
                </div>
                <div className="glass-panel p-2 h-[400px]">
                  <PhotoStrip 
                    images={photoStripImages} 
                    filter={filter} 
                    frameColor={frameColor}
                    sticker={selectedSticker}
                  />
                </div>
              </div>
              
              {/* Middle: Final options */}
              <div className="md:col-span-5 order-1 md:order-2">
                <div className="text-center mb-3">
                  <h1 className="text-2xl font-bold font-montserrat">Perfect Your Strip</h1>
                  <p className="text-sm text-gray-600 mb-2">
                    Add the finishing touches
                  </p>
                </div>
                
                <div className="glass-panel p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-3 font-montserrat">Choose a Filter</h3>
                  <PhotoFilters onSelectFilter={handleFilterSelect} selectedFilter={filter} />
                </div>
                
                <div className="glass-panel p-4 flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 font-montserrat">What's Next?</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button 
                      onClick={() => setStep(2)}
                      className="idol-button flex items-center justify-center"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      New Photos
                    </button>
                    
                    <button 
                      onClick={handleReset}
                      className="idol-button-outline flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right side: Options & customization */}
              <div className="md:col-span-4 order-3">
                <div className="space-y-6">
                  {/* Frame color options */}
                  <div className="glass-panel p-4">
                    <h3 className="text-lg font-semibold mb-3 font-montserrat">Frame Color</h3>
                    <FrameColorSelector 
                      selectedColor={frameColor} 
                      onSelectColor={handleFrameColorSelect} 
                    />
                  </div>
                  
                  {/* Stickers options */}
                  <div className="glass-panel p-4">
                    <h3 className="text-lg font-semibold mb-3 font-montserrat">Stickers</h3>
                    <StickersSelector 
                      selectedSticker={selectedSticker} 
                      onSelectSticker={handleStickerSelect} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render step navigation
  const renderStepNavigation = () => {
    return (
      <div className="flex justify-between items-center py-3 px-6 glass-panel mt-6 max-w-md mx-auto">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
          className={`flex items-center gap-1 ${
            step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-idol-gold'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
                s === step 
                  ? 'bg-idol-gold' 
                  : s < step 
                    ? 'bg-gray-400' 
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={() => step < 3 && photoStripImages.length > 0 && setStep(step + 1)}
          disabled={step === 3 || (step === 2 && photoStripImages.length === 0)}
          className={`flex items-center gap-1 ${
            step === 3 || (step === 2 && photoStripImages.length === 0) 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-black hover:text-idol-gold'
          }`}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4">
        {renderStepContent()}
        {renderStepNavigation()}
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoBooth;
