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
import MakeupLight from '../components/MakeupLight';
import { extractSubject, applyFilter } from '../lib/imageProcessing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LightColor = 'white' | 'pink' | 'warm' | 'cool' | 'gold' | 'off';

const PhotoBooth = () => {
  const [step, setStep] = useState(1);
  const [idolPhoto, setIdolPhoto] = useState<string | null>(null);
  const [photoStripImages, setPhotoStripImages] = useState<string[]>([]);
  const [filter, setFilter] = useState('Normal');
  const [captureMethod, setCaptureMethod] = useState<'webcam' | 'upload'>('webcam');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [lightColor, setLightColor] = useState<LightColor>('white');
  const navigate = useNavigate();
  
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
  
  const handlePhotoStripCapture = (images: string[], selectedAspectRatio?: string) => {
    setPhotoStripImages(images);
    if (selectedAspectRatio) {
      setAspectRatio(selectedAspectRatio);
    }
    
    if (images.length === 4) {
      navigate('/photo-booth/result', { 
        state: { 
          images,
          filter,
          aspectRatio: selectedAspectRatio || aspectRatio
        } 
      });
    }
  };
  
  const handleUserPhotoUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const imageUrl = URL.createObjectURL(file);
      const images = Array(4).fill(imageUrl);
      setPhotoStripImages(images);
      navigate('/photo-booth/result', { 
        state: { 
          images,
          filter,
          aspectRatio
        } 
      });
    } catch (error) {
      console.error("Error processing user photo:", error);
      toast.error("Failed to process user photo");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReset = () => {
    setIdolPhoto(null);
    setPhotoStripImages([]);
    setFilter('Normal');
    setStep(1);
    setCaptureMethod('webcam');
  };
  
  const renderPolaroidPhotos = () => {
    if (photoStripImages.length === 0) {
      return (
        <div className="text-center text-gray-400 p-4">
          <p>Take photos to see them here</p>
        </div>
      );
    }
    
    return (
      <div className="flex justify-center mt-6 overflow-x-auto py-4">
        <div className={`flex ${photoStripImages.length > 1 ? 'justify-center' : 'justify-center'} gap-4 transition-all duration-300`}>
          {photoStripImages.map((image, index) => (
            <div 
              key={index} 
              className="polaroid-frame bg-white shadow-lg p-2 pb-6 transform transition-transform hover:rotate-1"
              style={{ 
                maxWidth: '180px',
                order: photoStripImages.length - index
              }}
            >
              <div className="mb-2 overflow-hidden">
                <img 
                  src={image} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-auto" 
                />
              </div>
              <div className="text-center text-xs text-gray-600">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
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
              <div className="w-full max-w-xl mx-auto mb-6 relative">
                {lightColor !== 'off' && (
                  <div 
                    className={`absolute light-beam -z-10 opacity-40 transition-opacity duration-300 light-beam-${lightColor}`}
                    style={{
                      width: '200vw',
                      height: '200vh',
                      top: '25%',
                      right: '25%',
                      transform: 'translate(25%, -25%) rotate(45deg)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
                
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
                      lightColor={lightColor}
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
