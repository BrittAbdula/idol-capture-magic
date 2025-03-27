
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Camera, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebcamCapture from '../components/WebcamCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoFrame from '../components/PhotoFrame';
import PhotoFilters from '../components/PhotoFilters';
import { extractSubject, applyFilter } from '../lib/imageProcessing';

const PhotoBooth = () => {
  // State for photo booth
  const [step, setStep] = useState(1);
  const [idolPhoto, setIdolPhoto] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [combinedPhoto, setCombinedPhoto] = useState<string | null>(null);
  const [filter, setFilter] = useState('Normal');
  const [showWebcam, setShowWebcam] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle idol photo upload
  const handleIdolPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      // In a full implementation, this would extract the subject using AI
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
  const handleWebcamCapture = (imageSrc: string) => {
    setUserPhoto(imageSrc);
    setStep(3);
  };
  
  // Handle user photo upload
  const handleUserPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      setUserPhoto(imageUrl);
      setStep(3);
    } catch (error) {
      console.error("Error processing user photo:", error);
      toast.error("Failed to process user photo");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // When both photos are available, combine them
  useEffect(() => {
    if (idolPhoto && userPhoto) {
      // In a full implementation, this would intelligently combine the photos
      // For now, we'll just use the user photo as the combined photo
      setCombinedPhoto(userPhoto);
    }
  }, [idolPhoto, userPhoto]);
  
  // Handle filter selection
  const handleFilterSelect = (filterName: string) => {
    setFilter(filterName);
    if (combinedPhoto) {
      // Apply the selected filter to the combined photo
      applyFilter(combinedPhoto, filterName);
    }
  };
  
  // Reset the photo booth
  const handleReset = () => {
    setIdolPhoto(null);
    setUserPhoto(null);
    setCombinedPhoto(null);
    setFilter('Normal');
    setStep(1);
    setShowWebcam(true);
  };
  
  // Get filter class name
  const getFilterClassName = () => {
    switch (filter) {
      case 'Warm': return 'sepia-[0.3] brightness-105';
      case 'Cool': return 'brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]';
      case 'Vintage': return 'sepia-[0.5] brightness-90 contrast-110';
      case 'B&W': return 'grayscale';
      case 'Dramatic': return 'contrast-125 brightness-90';
      case 'Vivid': return 'saturate-150 contrast-110 brightness-105';
      case 'Muted': return 'saturate-50 brightness-110';
      default: return '';
    }
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-4 font-montserrat">Take Your Photo</h1>
              <p className="text-gray-600">
                Use your webcam to take a photo or upload an existing one.
              </p>
            </div>
            
            <div className="flex flex-col gap-8">
              {showWebcam ? (
                <div className="relative">
                  <WebcamCapture onCapture={handleWebcamCapture} />
                  
                  <div className="mt-4 flex justify-center">
                    <button 
                      onClick={() => setShowWebcam(false)}
                      className="idol-button-outline"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Photo Instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <PhotoUpload
                    onUpload={handleUserPhotoUpload}
                    label="Upload Your Photo"
                  />
                  
                  <div className="flex justify-center mt-2">
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="idol-button-outline"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Use Webcam Instead
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-4 font-montserrat">Your Perfect Photo</h1>
              <p className="text-gray-600">
                Select a filter and download your photo strip.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {combinedPhoto && (
                <div className="flex flex-col">
                  <div className="overflow-hidden rounded-lg bg-black flex items-center justify-center">
                    <div className={getFilterClassName()}>
                      <img 
                        src={combinedPhoto} 
                        alt="Combined photo" 
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                  
                  <PhotoFilters
                    onSelectFilter={handleFilterSelect}
                    selectedFilter={filter}
                  />
                </div>
              )}
              
              <div className="glass-panel p-6 flex flex-col">
                <h3 className="text-xl font-semibold mb-4 font-montserrat">Your Photo Strip</h3>
                <p className="text-gray-600 mb-6">
                  Here's your final photo strip. You can download it or share it with friends.
                </p>
                
                <div className="flex-1 flex flex-col gap-4 justify-center">
                  <button className="idol-button flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Download Photo
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
          onClick={() => step < 3 && step !== 2 && setStep(step + 1)}
          disabled={step === 3 || step === 2}
          className={`flex items-center gap-1 ${
            step === 3 || step === 2 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-idol-gold'
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
