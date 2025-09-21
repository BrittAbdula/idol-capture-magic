import React, { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Sparkles, Users, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PhotoUpload from '@/components/PhotoUpload';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';

// 撒花效果组件
const ConfettiEffect = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'][Math.floor(Math.random() * 8)],
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            borderRadius: '50%',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const PhotoWithIdol = () => {
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [idolPhoto, setIdolPhoto] = useState<File | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [idolPhotoUrl, setIdolPhotoUrl] = useState<string | null>(null);
  const [isUploadingUser, setIsUploadingUser] = useState(false);
  const [isUploadingIdol, setIsUploadingIdol] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Add ideas keywords
  const allIdeas = [
    'fan meeting booth',
    'red carpet event',
    'backstage dressing room',
    'concert stage',
    'idol practice room',
    'cafe date vibe',
    'airport fashion',
    'street night neon',
    'finger heart',
    'V sign',
    'cheek heart',
    'hand wave',
    'peace pose',
    'shoulder touch',
    'back-to-back',
    'ending fairy look'
  ];

  const [displayedIdeas, setDisplayedIdeas] = useState<string[]>([]);

  // Initialize displayed ideas on component mount
  React.useEffect(() => {
    refreshIdeas();
  }, []);

  const refreshIdeas = () => {
    const shuffled = [...allIdeas].sort(() => Math.random() - 0.5);
    setDisplayedIdeas(shuffled.slice(0, 5));
  };

  const addIdeaToPrompt = (idea: string) => {
    setPrompt(idea);
  };

  const sizeOptions = [
    { label: '1:1', value: '1:1', description: 'Square' },
    { label: '3:2', value: '3:2', description: 'Landscape' },
    { label: '2:3', value: '2:3', description: 'Portrait' }
  ];

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('uploadPath', 'user-uploads');
      formData.append('fileName', `${Date.now()}-${file.name}`);
      formData.append('originalName', file.name);

      const response = await fetch('https://api.idolbooth.com/api/ai/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response:', errorText);
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.data?.downloadUrl) {
        return result.data.data.downloadUrl;
      } else {
        console.error('Upload response structure:', result);
        throw new Error(result.message || 'Upload failed - invalid response structure');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to upload image');
      }
    }
  };

  const handleUserPhotoUpload = async (file: File) => {
    setUserPhoto(file);
    setIsUploadingUser(true);
    try {
      const url = await uploadImage(file);
      setUserPhotoUrl(url);
      toast.success('Your photo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload your photo. Please try again.');
      setUserPhoto(null);
    } finally {
      setIsUploadingUser(false);
    }
  };

  const handleIdolPhotoUpload = async (file: File) => {
    setIdolPhoto(file);
    setIsUploadingIdol(true);
    try {
      const url = await uploadImage(file);
      setIdolPhotoUrl(url);
      toast.success('Idol photo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload idol photo. Please try again.');
      setIdolPhoto(null);
    } finally {
      setIsUploadingIdol(false);
    }
  };

  interface TaskResult {
    success: boolean;
    data?: {
      taskId: string;
      state: string; // Changed from 'status' to 'state'
      model: string;
      createTime: number;
      completeTime?: number;
      costTime?: number;
      params: Record<string, unknown>;
      resultUrls: string[];
      failCode?: string;
      failMsg?: string;
      statusDescription: string;
    };
    message?: string;
  }

  const checkTaskResult = async (taskId: string): Promise<TaskResult> => {
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
    const maxAttempts = 90; // 30 attempts with 2 second intervals = 1 minute max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const result = await checkTaskResult(taskId);

        // Updated condition to check for 'success' state and resultUrls
        if (result.data?.state === 'success' && result.data?.resultUrls && result.data.resultUrls.length > 0) {
          setGeneratedImage(result.data.resultUrls[0]);
          setIsGenerating(false);
          toast.success('Photo generated successfully!');
          
          // 触发撒花效果
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000); // 3秒后停止撒花
          
          return;
        } else if (result.data?.state === 'failed' || result.data?.failCode) {
          setIsGenerating(false);
          const errorMsg = result.data?.failMsg || 'Failed to generate photo. Please try again.';
          toast.error(errorMsg);
          return;
        } else if (attempts < maxAttempts) {
          // Show progress information based on state
          if (result.data?.state === 'waiting') {
            setGenerationProgress(10);
            console.log('Task is waiting to be processed...');
          } else if (result.data?.state === 'processing') {
            setGenerationProgress(50);
            console.log('Task is being processed...');
          }
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
    if (!userPhotoUrl || !idolPhotoUrl || !prompt.trim()) {
      toast.error('Please upload both photos and enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationProgress(0);

    try {
      const response = await fetch('https://api.idolbooth.com/api/ai/photo-with-idol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image1Url: userPhotoUrl,
          image2Url: idolPhotoUrl,
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
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to generate photo. Please try again.');
      } else {
        toast.error('Failed to generate photo. Please try again.');
      }
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
        title="Free AI Idol Photo Generator | Create Photos with K-pop Idols & Celebrities"
        description="Create stunning photos with your favorite idols using our free AI photo generator. Upload your photo and generate realistic composite images with BTS, BLACKPINK, TWICE, and more K-pop idols. Best idol photo app, selfie generator, and picture maker online."
      />

      {/* 撒花效果 */}
      <ConfettiEffect isActive={showConfetti} />

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-idol-gold/5">
        <Navbar />

        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center mb-8 lg:mb-12">
              <div className="inline-flex items-center gap-2 bg-idol-gold/10 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-idol-gold" />
                <span className="text-sm font-medium">AI-Powered Photo Generation</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-idol-gold via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Create Photos with Your Idol
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your photo and your favorite idol's photo to generate amazing composite images using advanced AI technology.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
              {/* Upload Section */}
              <div className="space-y-10 order-1 lg:order-none">
                {/* Mobile: Combined Upload Card */}
                <Card className="glass-panel lg:hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5" />
                      Upload Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-10">
                    <div>
                      <label className="block text-sm font-medium mb-3">Your Photo</label>
                      <PhotoUpload
                        onUpload={handleUserPhotoUpload}
                        label="Upload Your Photo"
                        className="min-h-[220px] sm:min-h-[240px] h-auto"
                        isUploading={isUploadingUser}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Idol Photo</label>
                      <PhotoUpload
                        onUpload={handleIdolPhotoUpload}
                        label="Upload Idol Photo"
                        className="min-h-[220px] sm:min-h-[240px] h-auto"
                        isUploading={isUploadingIdol}
                      />
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
                  <CardContent className="space-y-10">
                    <div>
                      <label className="block text-sm font-medium mb-3">Your Photo</label>
                      <PhotoUpload
                        onUpload={handleUserPhotoUpload}
                        label="Upload Your Photo"
                        className="min-h-[280px] h-auto"
                        isUploading={isUploadingUser}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Idol Photo</label>
                      <PhotoUpload
                        onUpload={handleIdolPhotoUpload}
                        label="Upload Idol Photo"
                        className="min-h-[280px] h-auto"
                        isUploading={isUploadingIdol}
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

                      {/* Ideas Section */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Ideas</span>
                          <button
                            onClick={refreshIdeas}
                            className="p-1 hover:bg-idol-gold/10 rounded transition-colors"
                            title="Refresh ideas"
                          >
                            <RefreshCw className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {displayedIdeas.map((idea, index) => (
                            <button
                              key={index}
                              onClick={() => addIdeaToPrompt(idea)}
                              className="px-2 py-1 text-xs bg-idol-gold/10 hover:bg-idol-gold/20 text-idol-gold rounded-md transition-colors border border-idol-gold/20 hover:border-idol-gold/40"
                            >
                              {idea}
                            </button>
                          ))}
                        </div>
                      </div>
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
                                ? 'border-idol-gold bg-idol-gold/10 text-idol-gold shadow-md'
                                : 'border-border hover:border-idol-gold/50 hover:bg-idol-gold/5'
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
                      disabled={!userPhotoUrl || !idolPhotoUrl || !prompt.trim() || isGenerating || isUploadingUser || isUploadingIdol}
                      className="w-full animate-fade-in idol-button"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          {generationProgress > 0 ? `Generating... ${generationProgress}%` : 'Generating...'}
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
                <Card className="glass-panel min-h-[400px] lg:h-full">
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
                              size="sm"
                              className="animate-scale-in idol-button"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={downloadImage}
                          className="w-full idol-button-outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Image
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 lg:h-96 text-center px-4">
                        {isGenerating ? (
                          <div className="animate-fade-in flex flex-col items-center">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-idol-gold border-t-transparent rounded-full animate-spin mb-4 flex items-center justify-center" />
                            <h3 className="text-base lg:text-lg font-medium mb-2">Generating Your Photo</h3>
                            <p className="text-sm lg:text-base text-muted-foreground">
                              {generationProgress > 0 ? `Progress: ${generationProgress}%` : 'This may take up to a minute...'}
                            </p>
                          </div>
                        ) : (
                          <div className="animate-fade-in flex flex-col items-center">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                              <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-base lg:text-lg font-medium mb-2">Upload Photos to Get Started</h3>
                            <p className="text-sm lg:text-base text-muted-foreground max-w-sm">
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

        {/* SEO Content Section */}
        <section className="bg-gradient-to-b from-background/50 to-background py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* How To Generate Section */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-idol-gold to-orange-400 bg-clip-text text-transparent">
                  How To Generate Photos with Your Favorite Idols
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="text-lg leading-relaxed">
                    Create stunning photos with your favorite K-pop idols, celebrities, and stars using our advanced AI technology.
                    Our free online photo generator makes it easy to create realistic composite images in just a few simple steps.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-idol-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-idol-gold font-bold text-sm">1</span>
                      </div>
                      <p>Upload your personal photo and your favorite idol's image</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-idol-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-idol-gold font-bold text-sm">2</span>
                      </div>
                      <p>Describe how you want the photos combined with a creative prompt</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-idol-gold/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-idol-gold font-bold text-sm">3</span>
                      </div>
                      <p>Choose your preferred aspect ratio and generate your dream photo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Idols Section */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">
                  Popular Idol Photo Combinations
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-idol-gold">K-pop Idols</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• BTS photo generator</li>
                      <li>• BLACKPINK selfie app</li>
                      <li>• TWICE picture maker</li>
                      <li>• EXO photo editor</li>
                      <li>• Red Velvet online tool</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-idol-gold">International Stars</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Taylor Swift photo app</li>
                      <li>• Justin Bieber selfie tool</li>
                      <li>• Ariana Grande picture maker</li>
                      <li>• Ed Sheeran photo generator</li>
                      <li>• Beyoncé online editor</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Photos Section */}
            <div className="mt-16 space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-idol-gold to-orange-400 bg-clip-text text-transparent mb-4">
                  Discover Other Popular Combinations
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  See what's possible with our AI photo generator. These samples showcase the quality and creativity you can achieve.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img
                      src="/sample/samplej-1.jpg"
                      alt="Sample idol photo combination 1"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">BTS Concert Photo</p>
                    </div>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img
                      src="/sample/sample-2.jpg"
                      alt="Sample idol photo combination 2"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">BLACKPINK Selfie</p>
                    </div>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img
                      src="/sample/sample-3.jpg"
                      alt="Sample idol photo combination 3"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">TWICE Group Photo</p>
                    </div>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <img
                      src="/sample/sample-4.jpg"
                      alt="Sample idol photo combination 4"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm font-medium">EXO Studio Session</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO Keywords Section */}
                         {/* FAQ Section */}
 <div className="mt-16 p-8 bg-gradient-to-r from-idol-gold/5 to-orange-400/5 rounded-2xl">
   <h3 className="text-2xl font-bold bg-gradient-to-r from-idol-gold to-orange-400 bg-clip-text text-transparent mb-6">FAQ — Photo with Idol</h3>

  <div className="grid md:grid-cols-2 gap-6">
    {/* Q1 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        How does this work?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        Upload/paste two images (you + idol) and pick quick-select chips (scene, pose, lighting).
        We combine your choices with a default prompt to keep results photorealistic and natural.
      </div>
    </details>

    {/* Q2 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        What image sizes/aspect ratios are supported?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        We support <span className="font-medium">1:1</span>, <span className="font-medium">2:3</span>, and <span className="font-medium">3:2</span>.
        Square is best for avatars; 2:3 is great for portraits; 3:2 suits landscape scenes.
      </div>
    </details>

    {/* Q3 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        Do I need to write a prompt?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        Not required. You can just pick chips like <em>fan meeting booth</em>, <em>selfie close-up</em>, <em>warm tone</em>.
        If you add a prompt, we’ll merge it with a default safety/quality prompt.
      </div>
    </details>

    {/* Q4 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        How to get the most realistic result?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        Use frontal photos with similar angle, lighting, and resolution. Avoid heavy filters.
        Choose matching scenes (e.g., indoor to indoor) and enable subtle depth-of-field.
      </div>
    </details>

    {/* Q5 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        Is it safe and private?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        We process only the images/links you provide for generation.
        Avoid uploading sensitive data. Results may be moderated to prevent NSFW or misuse.
      </div>
    </details>

    {/* Q6 */}
    <details className="group rounded-xl border border-idol-gold/20 bg-background/60 p-4 open:shadow-sm hover:border-idol-gold/40 transition-colors">
      <summary className="flex items-center justify-between cursor-pointer select-none text-foreground font-medium group-open:text-idol-gold">
        Can I use any idol's image?
        <span className="ml-2 transition-transform group-open:rotate-180 text-idol-gold">▾</span>
      </summary>
      <div className="mt-3 text-sm text-muted-foreground leading-6">
        Please respect portrait and publicity rights and local laws. Personal/non-commercial use only.
        We block minors and disallow explicit or misleading content.
      </div>
    </details>
  </div>
</div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default PhotoWithIdol;