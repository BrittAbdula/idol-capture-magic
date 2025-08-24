import React, { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Sparkles, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PhotoUpload from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';

const PhotoWithIdol = () => {
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [idolPhoto, setIdolPhoto] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const sizeOptions = [
    { label: '1:1', value: '1:1', description: 'Square' },
    { label: '3:2', value: '3:2', description: 'Landscape' },
    { label: '2:3', value: '2:3', description: 'Portrait' }
  ];

  const uploadImage = async (file: File): Promise<string> => {
    // In a real implementation, you would upload the file to your server
    // For now, we'll create a temporary URL
    return URL.createObjectURL(file);
  };

  const checkTaskResult = async (taskId: string): Promise<any> => {
    try {
      const response = await fetch(`https://api.idolbooth.com/api/ai/photo-with-idol/${taskId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking task result:', error);
      throw error;
    }
  };

  const pollForResult = async (taskId: string) => {
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 1 minute max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const result = await checkTaskResult(taskId);
        
        if (result.status === 'completed' && result.data?.imageUrl) {
          setGeneratedImage(result.data.imageUrl);
          setIsGenerating(false);
          toast.success('Photo generated successfully!');
          return;
        } else if (result.status === 'failed') {
          setIsGenerating(false);
          toast.error('Failed to generate photo. Please try again.');
          return;
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Check again after 2 seconds
        } else {
          setIsGenerating(false);
          toast.error('Generation timeout. Please try again.');
        }
      } catch (error) {
        setIsGenerating(false);
        toast.error('Error checking generation status.');
      }
    };

    poll();
  };

  const handleGenerate = async () => {
    if (!userPhoto || !idolPhoto || !prompt.trim()) {
      toast.error('Please upload both photos and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Upload images (in real implementation, these would be uploaded to your server)
      const image1Url = await uploadImage(userPhoto);
      const image2Url = await uploadImage(idolPhoto);

      const response = await fetch('https://api.idolbooth.com/api/ai/photo-with-idol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image1Url,
          image2Url,
          prompt: prompt.trim(),
          size: selectedSize
        })
      });

      const result = await response.json();
      
      if (result.success && result.data?.taskId) {
        setTaskId(result.data.taskId);
        toast.success('Generation started! Please wait...');
        await pollForResult(result.data.taskId);
      } else {
        throw new Error(result.message || 'Failed to start generation');
      }
    } catch (error) {
      setIsGenerating(false);
      toast.error('Failed to generate photo. Please try again.');
      console.error('Generation error:', error);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'photo-with-idol.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <SEO 
        title="AI Photo with Idol Generator | Create Photos with Your Favorite Stars"
        description="Generate realistic photos with your favorite idols using AI. Upload your photo and an idol's photo to create amazing composite images."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <Navbar />
        
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI-Powered Photo Generation</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                Create Photos with Your Idol
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your photo and your favorite idol's photo to generate amazing composite images using advanced AI technology.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Upload Section */}
              <div className="space-y-4 lg:space-y-6 order-1">
                {/* Mobile: Combined Upload Card */}
                <Card className="glass-panel lg:hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5" />
                      Upload Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Photo</label>
                        <PhotoUpload
                          onUpload={setUserPhoto}
                          label="Upload Your Photo"
                          className="h-32 sm:h-40"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Idol Photo</label>
                        <PhotoUpload
                          onUpload={setIdolPhoto}
                          label="Upload Idol Photo"
                          className="h-32 sm:h-40"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Desktop: Separate Upload Cards */}
                <Card className="glass-panel hidden lg:block">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Upload Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Photo</label>
                      <PhotoUpload
                        onUpload={setUserPhoto}
                        label="Upload Your Photo"
                        className="h-48"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Idol Photo</label>
                      <PhotoUpload
                        onUpload={setIdolPhoto}
                        label="Upload Idol Photo"
                        className="h-48"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel">
                  <CardHeader className="pb-4 lg:pb-6">
                    <CardTitle className="text-lg lg:text-xl">Generation Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 lg:space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Prompt</label>
                      <Textarea
                        placeholder="Describe how you want the photos to be combined (e.g., 'Create a photo of me and Taylor Swift together at a concert')"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[80px] lg:min-h-[100px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {prompt.length}/100 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Aspect Ratio</label>
                      <div className="grid grid-cols-3 gap-2 lg:gap-3">
                        {sizeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedSize(option.value)}
                            className={`p-3 lg:p-4 rounded-lg border transition-all hover-scale ${
                              selectedSize === option.value
                                ? 'border-primary bg-primary/10 text-primary shadow-md'
                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            <div className="font-medium text-sm lg:text-base">{option.label}</div>
                            <div className="text-xs lg:text-sm text-muted-foreground mt-1">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={!userPhoto || !idolPhoto || !prompt.trim() || isGenerating}
                      className="w-full animate-fade-in"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Photo
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Result Section */}
              <div className="order-2 lg:order-none">
                <Card className="glass-panel h-full">
                  <CardHeader className="pb-4 lg:pb-6">
                    <CardTitle className="text-lg lg:text-xl">Generated Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedImage ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="relative group">
                          <img
                            src={generatedImage}
                            alt="Generated photo with idol"
                            className="w-full rounded-lg shadow-lg hover-scale"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              onClick={downloadImage}
                              variant="secondary"
                              size="sm"
                              className="animate-scale-in"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={downloadImage}
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Image
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 lg:h-96 text-center px-4">
                        {isGenerating ? (
                          <div className="animate-fade-in">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <h3 className="text-base lg:text-lg font-medium mb-2">Generating Your Photo</h3>
                            <p className="text-sm lg:text-base text-muted-foreground">This may take up to a minute...</p>
                          </div>
                        ) : (
                          <div className="animate-fade-in">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                              <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-base lg:text-lg font-medium mb-2">Upload Photos to Get Started</h3>
                            <p className="text-sm lg:text-base text-muted-foreground max-w-sm mx-auto">
                              Upload your photo and an idol's photo, then add a prompt to generate amazing composite images.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PhotoWithIdol;