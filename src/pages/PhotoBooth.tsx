
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebcamCapture from '../components/WebcamCapture';
import PhotoUpload from '../components/PhotoUpload';
import PhotoFrame from '../components/PhotoFrame';
import PhotoStrip from '../components/PhotoStrip';
import { extractSubject, applyFilter } from '../lib/imageProcessing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PhotoBooth = () => {
  // State for photo booth
  const [step, setStep] = useState(1);
  const [idolPhoto, setIdolPhoto] = useState<string | null>(null);
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [filter, setFilter] = useState('Normal');
  const [captureMethod, setCaptureMethod] = useState<'webcam' | 'upload'>('webcam');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  
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
      // Navigate to results page with the images and filter
      navigate('/photo-booth/result', { 
        state: { 
          images,
          filter 
        } 
      });
    }
  };
  
  // Handle user photo upload
  const handleUserPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      const images = Array(4).fill(imageUrl);
      setPhotoStripImages(images);
      // Navigate to results page with the images and filter
      navigate('/photo-booth/result', { 
        state: { 
          images,
          filter
        } 
      });
    } catch (error) {
      console.error("Error processing user photo:", error);
      toast.error("Failed to process user photo");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset the photo booth
  const handleReset = () => {
    setIdolPhoto(null);
    setPhotoStripImages([]);
    setFilter('Normal');
    setStep(1);
    setCaptureMethod('webcam');
  };
  
  // Render polaroid photo display
  const renderPolaroidPhotos = () => {
    if (photoStripImages.length === 0) {
      return (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see them here</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {photoStripImages.map((image, index) => (
          <div 
            key={index} 
            className="polaroid-frame bg-white shadow-lg p-2 pb-6 transform transition-transform hover:rotate-1"
            style={{ maxWidth: '180px' }}
          >
            <div className={`mb-2 overflow-hidden`}>
              <img 
                src={image} 
                alt={`Photo ${index + 1}`} 
                className="w-full h-auto" 
              />
            </div>
            <div className="text-center text-xs text-gray-600">
              Photo {index + 1}
            </div>
          </div>
        ))}
      </div>
    );
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
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xl mx-auto mb-6">
                <Tabs 
                  defaultValue={captureMethod} 
                  onValueChange={(value) => setCaptureMethod(value as 'webcam' | 'upload')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="webcam" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Use Camera</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photos</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="webcam" className="overflow-hidden rounded-lg shadow-md">
                    <WebcamCapture 
                      onCapture={handlePhotoStripCapture} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload">
                    <PhotoUpload
                      onUpload={handleUserPhotoUpload}
                      label="Upload Your Photos"
                    />
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="w-full max-w-4xl">
                {renderPolaroidPhotos()}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4">
        {renderStepContent()}
      </main>
      
      <Footer />
    </div>
  );
};

export default PhotoBooth;
