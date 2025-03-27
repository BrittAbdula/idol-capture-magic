import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Camera, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Download, Trash2, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebcamCapture from '../components/WebcamCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoFrame from '../components/PhotoFrame';
import PhotoStrip from '../components/PhotoStrip';
import PhotoFilters from '../components/PhotoFilters';
import { extractSubject, applyFilter } from '../lib/imageProcessing';

const PhotoBooth = () => {
  // State for photo booth
  const [step, setStep] = useState(1);
  const [idolPhoto, setIdolPhoto] = useState<string | null>(null);
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [filter, setFilter] = useState('Normal');
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
  
  // Handle user photo capture from webcam - updated to accept partial images
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
  
  // Reset the photo booth
  const handleReset = () => {
    setIdolPhoto(null);
    setPhotoStripImages([]);
    setFilter('Normal');
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
          <div className="max-w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {/* Promo/Intro section - 2 columns */}
              <div className="md:col-span-2">
                <div className="glass-panel p-4 mb-4 h-full">
                  <h2 className="text-xl font-bold mb-2 font-montserrat">Photo Booth</h2>
                  <p className="text-gray-600 mb-4">
                    Capture your perfect moment! Take 4 photos in sequence to create your custom photo strip.
                  </p>
                  
                  {showWebcam ? (
                    <button 
                      onClick={() => setShowWebcam(false)}
                      className="idol-button-outline w-full mb-2"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Photos Instead
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="idol-button-outline w-full mb-2"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Use Webcam Instead
                    </button>
                  )}
                </div>
              </div>
              
              {/* Webcam section - 3 columns, centered */}
              <div className="md:col-span-3 flex justify-center">
                <div className="w-full max-w-md">
                  {showWebcam ? (
                    <div className="overflow-hidden rounded-lg shadow-md">
                      <WebcamCapture onCapture={handlePhotoStripCapture} />
                    </div>
                  ) : (
                    <PhotoUpload
                      onUpload={handleUserPhotoUpload}
                      label="Upload Your Photos"
                    />
                  )}
                </div>
              </div>
              
              {/* Photo Strip Preview - 2 columns */}
              <div className="md:col-span-2 h-[480px]">
                <div className="h-full">
                  <PhotoStrip images={photoStripImages} filter={filter} />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="max-w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {/* Left Panel - Filters and Controls */}
              <div className="md:col-span-2">
                <div className="glass-panel p-4 mb-4">
                  <h3 className="text-xl font-semibold mb-3 font-montserrat">Choose a Filter</h3>
                  <PhotoFilters onSelectFilter={handleFilterSelect} selectedFilter={filter} />
                </div>
                
                <div className="glass-panel p-4 flex flex-col">
                  <h3 className="text-xl font-semibold mb-3 font-montserrat">What's Next?</h3>
                  <p className="text-gray-600 mb-4">
                    You can download your photo strip or create a new one.
                  </p>
                  
                  <div className="flex-1 flex flex-col gap-4 justify-center">
                    <button 
                      onClick={() => setStep(2)}
                      className="idol-button flex items-center justify-center"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Take New Photos
                    </button>
                    
                    <button 
                      onClick={handleReset}
                      className="idol-button-outline flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Photo Preview - 3 columns, centered */}
              <div className="md:col-span-3 flex justify-center">
                <div className="w-full max-w-md overflow-hidden rounded-lg shadow-md">
                  {/* This would be the photo preview with filters applied */}
                  {photoStripImages.length > 0 && (
                    <img 
                      src={photoStripImages[0]} 
                      alt="Preview" 
                      className={`w-full ${getFilterClassName(filter)}`} 
                    />
                  )}
                </div>
              </div>
              
              {/* Photo Strip Preview - 2 columns */}
              <div className="md:col-span-2 h-[480px]">
                <div className="h-full">
                  <PhotoStrip images={photoStripImages} filter={filter} />
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Helper function for filter class names
  const getFilterClassName = (filter: string) => {
    switch (filter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast-125 brightness-90';
      default: return '';
    }
  };
  
  // Render step navigation
  const renderStepNavigation = () => {
    return (
      <div className="flex justify-between items-center py-4 px-6 glass-panel mt-8 max-w-xl mx-auto">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
          className={`flex items-center gap-1 ${
            step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-idol-gold'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${
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
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4">
        {renderStepContent()}
        {renderStepNavigation()}
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoBooth;
