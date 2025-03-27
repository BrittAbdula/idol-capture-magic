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
          <div className="max-w-7xl mx-auto">
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
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column - Promo content */}
              <div className="lg:col-span-2">
                <div className="bg-pink-50 p-5 rounded-lg">
                  <h3 className="text-lg font-bold text-pink-500 mb-2">Get the app for endless frames, stickers, filters, and retouching tools!</h3>
                  <div className="mt-4 mb-2">
                    <img 
                      src="/lovable-uploads/b4b96b6d-d78d-4240-8d01-4516e32b494a.png" 
                      alt="QR Code" 
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600">Scan to Download</p>
                </div>
              </div>

              {/* Middle column - Webcam */}
              <div className="lg:col-span-8">
                <div className="aspect-[4/3] overflow-hidden bg-black rounded-lg">
                  {showWebcam ? (
                    <WebcamCapture onCapture={handlePhotoStripCapture} />
                  ) : (
                    <div className="h-full">
                      <PhotoUpload
                        onUpload={handleUserPhotoUpload}
                        label="Upload Your Photos"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3 text-center">Choose a filter</h3>
                  <PhotoFilters onSelectFilter={handleFilterSelect} selectedFilter={filter} />
                </div>

                <div className="mt-4 flex justify-center">
                  {showWebcam ? (
                    <button 
                      onClick={() => setShowWebcam(false)}
                      className="idol-button-outline flex items-center"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Photos Instead
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="idol-button-outline flex items-center"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Use Webcam Instead
                    </button>
                  )}
                </div>
              </div>

              {/* Right column - Photo strip */}
              <div className="lg:col-span-2">
                <div className="h-full">
                  <PhotoStrip images={photoStripImages} filter={filter} />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left side - Filters and controls */}
              <div className="lg:col-span-3">
                <div className="glass-panel p-4 mb-6">
                  <h3 className="text-xl font-semibold mb-3 font-montserrat">Choose a Filter</h3>
                  <PhotoFilters onSelectFilter={handleFilterSelect} selectedFilter={filter} />
                </div>
                
                <div className="glass-panel p-4">
                  <h3 className="text-xl font-semibold mb-3 font-montserrat">What's Next?</h3>
                  <p className="text-gray-600 mb-4">
                    You can download your photo strip or create a new one.
                  </p>
                  
                  <div className="flex flex-col gap-4">
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
              
              {/* Center - Preview of photo strip */}
              <div className="lg:col-span-7">
                <h2 className="text-3xl font-bold mb-4 font-montserrat text-center">Your Perfect Photo Strip</h2>
                <div className="aspect-video bg-gray-100 rounded-lg p-6 flex justify-center">
                  <div className="max-w-sm">
                    <PhotoStrip images={photoStripImages} filter={filter} />
                  </div>
                </div>
              </div>
              
              {/* Right side - Extra controls or info */}
              <div className="lg:col-span-2">
                <div className="glass-panel p-4">
                  <h3 className="text-lg font-semibold mb-3">Share Your Creation</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download your photo strip or share it with friends.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        const downloadButton = document.createElement('button');
                        downloadButton.onclick = () => {
                          const photoStripComponent = document.querySelector('[data-photo-strip]');
                          if (photoStripComponent) {
                            photoStripComponent.dispatchEvent(new Event('download'));
                          }
                        };
                        downloadButton.click();
                      }}
                      className="flex items-center gap-1 w-full px-3 py-2 text-sm bg-idol-gold text-black rounded-md hover:bg-opacity-90 transition-colors"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("Check out my photo strip from IdolBooth!");
                        toast.success("Sharing message copied to clipboard!");
                      }}
                      className="flex items-center gap-1 w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </button>
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
