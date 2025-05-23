import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Download, Mail, Twitter, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const SharePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accessKey = searchParams.get('accessKey');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageShareUrl, setPageShareUrl] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setPageShareUrl(window.location.href);

    if (!accessKey) {
      toast.error("No access key found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await fetch(`https://api.idolbooth.com/api/image/${accessKey}`);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        const data = await response.json();
        
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          throw new Error('No image URL in response');
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        toast.error("Failed to load image.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [accessKey]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    // 动画完成后再显示其他内容
    setTimeout(() => setShowContent(true), 1500);
  };

  const handleCopyLink = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(pageShareUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error("Failed to copy link.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleDownload = async () => {
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `idolbooth_com_${Date.now()}.jpg`;
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("Download started!");
      } catch (error) {
        console.error('Download failed:', error);
        toast.error("Failed to download image.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <SEO 
        title="Share Your Photo Strip | IdolBooth.com"
        description="Share your unique photo strip created with IdolBooth."
      />
      <Navbar />
      
      <main className="flex-grow pt-28 pb-20 px-4 flex flex-col items-center justify-center">
        <style>{`
          /* 照片入场动画：由小到大、由远及近、旋转 */
          @keyframes photoEntrance {
            0% {
              transform: perspective(1000px) translateZ(-800px) scale(0.1) rotateY(180deg) rotateX(20deg);
              opacity: 0;
              filter: blur(10px);
            }
            30% {
              transform: perspective(1000px) translateZ(-300px) scale(0.4) rotateY(90deg) rotateX(10deg);
              opacity: 0.3;
              filter: blur(5px);
            }
            60% {
              transform: perspective(1000px) translateZ(-100px) scale(0.8) rotateY(45deg) rotateX(5deg);
              opacity: 0.7;
              filter: blur(2px);
            }
            80% {
              transform: perspective(1000px) translateZ(0px) scale(1.1) rotateY(10deg) rotateX(0deg);
              opacity: 0.9;
              filter: blur(0px);
            }
            100% {
              transform: perspective(1000px) translateZ(0px) scale(1) rotateY(0deg) rotateX(0deg);
              opacity: 1;
              filter: blur(0px);
            }
          }

          /* 照片容器动画 */
          .photo-entrance {
            animation: photoEntrance 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            transform-origin: center center;
            backface-visibility: hidden;
          }

          /* 光晕效果 */
          @keyframes glowPulse {
            0%, 100% {
              box-shadow: 
                0 0 20px rgba(255, 215, 0, 0.3),
                0 0 40px rgba(255, 215, 0, 0.2),
                0 0 60px rgba(255, 215, 0, 0.1),
                0 5px 15px rgba(0, 0, 0, 0.1);
            }
            50% {
              box-shadow: 
                0 0 30px rgba(255, 215, 0, 0.5),
                0 0 60px rgba(255, 215, 0, 0.3),
                0 0 90px rgba(255, 215, 0, 0.2),
                0 8px 25px rgba(0, 0, 0, 0.15);
            }
          }

          .glowing {
            animation: glowPulse 3s ease-in-out infinite;
          }

          /* 悬浮效果 */
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            33% {
              transform: translateY(-8px) rotate(1deg);
            }
            66% {
              transform: translateY(-4px) rotate(-1deg);
            }
          }

          .floating {
            animation: float 4s ease-in-out infinite;
          }

          /* 内容渐入动画 */
          @keyframes contentSlideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .content-fade {
            animation: contentSlideUp 0.8s ease-out forwards;
            opacity: 0;
          }

          /* 装饰元素动画 */
          @keyframes decorFloat {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-15px) rotate(180deg);
            }
          }

          .decor-float {
            animation: decorFloat 3s ease-in-out infinite;
          }

          /* 延迟类 */
          .delay-1 { animation-delay: 0.2s; }
          .delay-2 { animation-delay: 0.4s; }
          .delay-3 { animation-delay: 0.6s; }
          .delay-4 { animation-delay: 0.8s; }

          /* 按钮悬停动画 */
          .button-hover {
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .button-hover:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          }

          /* 背景粒子效果 */
          @keyframes particle {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 0.8;
            }
          }

          .particle {
            animation: particle 4s ease-in-out infinite;
          }
        `}</style>

        {isLoading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-idol-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your photo strip...</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl relative">
            {imageUrl ? (
              <>
                {/* 背景装饰粒子 */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-10 left-1/4 w-2 h-2 bg-idol-gold rounded-full particle delay-1 opacity-30"></div>
                  <div className="absolute top-32 right-1/4 w-3 h-3 bg-pink-400 rounded-full particle delay-2 opacity-40"></div>
                  <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-purple-400 rounded-full particle delay-3 opacity-35"></div>
                  <div className="absolute bottom-20 right-1/3 w-4 h-4 bg-yellow-400 rounded-full particle delay-4 opacity-25"></div>
                </div>

                {/* 照片展示区域 */}
                <div className="mb-8 relative perspective-1000">
                  <div className={`overflow-hidden mx-auto max-w-md relative ${
                    imageLoaded ? 'photo-entrance floating glowing' : 'opacity-0'
                  }`}>
                    <img 
                      src={imageUrl} 
                      alt="Your Photo Strip" 
                      className="w-full h-auto"
                      onLoad={handleImageLoad}
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transformStyle: 'preserve-3d'
                      }}
                    />
                    
                    {/* 照片边框光效 */}
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-idol-gold via-pink-400 to-purple-400 opacity-20"></div>
                  </div>
                  
                  {/* 装饰性元素 - 只在内容显示后出现 */}
                  {showContent && (
                    <>
                      <div className="absolute -top-6 -left-6 w-8 h-8 bg-idol-gold rounded-full opacity-60 decor-float delay-1"></div>
                      <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-pink-400 rounded-full opacity-40 decor-float delay-2"></div>
                      <div className="absolute top-1/2 -left-10 w-6 h-6 bg-purple-400 rounded-full opacity-50 decor-float delay-3"></div>
                      <div className="absolute top-1/4 -right-8 w-10 h-10 bg-yellow-400 rounded-full opacity-30 decor-float delay-4"></div>
                    </>
                  )}
                </div>

                {/* 其他内容 - 只在动画完成后显示 */}
                {showContent && (
                  <>
                    {/* 标题 */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 font-montserrat text-center content-fade delay-1">
                      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-idol-gold bg-clip-text text-transparent">
                        IdolBooth moment
                      </span>
                    </h1>
                    
                    {/* 日期 */}
                    <p className="text-gray-600 text-center mb-8 content-fade delay-2">
                      {new Date().toLocaleDateString('en-US', { 
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>

                    {/* 分享面板 */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mx-auto max-w-md content-fade delay-3 border border-idol-gold/20">
                      <h2 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-idol-gold via-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Share Your Creation
                      </h2>
                      
                      <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-lg text-sm text-gray-600 break-all backdrop-blur-sm border border-idol-gold/10">
                        {pageShareUrl}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button
                          onClick={() => {
                            window.open(`https://twitter.com/intent/tweet?text=Check out my IdolBooth photo strip!&url=${encodeURIComponent(pageShareUrl)}`, '_blank');
                          }}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-idol-gold to-pink-600 hover:from-idol-gold/90 hover:to-pink-600/90 text-white button-hover"
                        >
                          <X className="w-4 h-4" />
                          Tweet
                        </Button>

                        <Button
                          onClick={() => {
                            window.location.href = `mailto:?subject=My IdolBooth Photo Strip&body=Check out my photo strip: ${encodeURIComponent(pageShareUrl)}`;
                          }}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-600/90 hover:to-purple-600/90 text-white button-hover"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          onClick={handleCopyLink}
                          disabled={isCopying}
                          className="w-full bg-gradient-to-r from-idol-gold via-pink-600 to-purple-600 hover:from-idol-gold/90 hover:via-pink-600/90 hover:to-purple-600/90 text-white flex items-center justify-center gap-2 button-hover"
                        >
                          <Copy className="w-5 h-5" />
                          {isCopying ? "Copying..." : "Copy Link"}
                        </Button>

                        <Button 
                          onClick={handleDownload}
                          variant="outline"
                          className="w-full border-2 border-idol-gold/30 hover:border-idol-gold/50 hover:bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center gap-2 button-hover text-gray-700"
                        >
                          <Download className="w-5 h-5" />
                          Download Image
                        </Button>
                      </div>
                    </div>

                    {/* 品牌标识 */}
                    <p className="text-center mt-8 text-sm text-gray-500 content-fade delay-4">
                      <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        IdolBooth
                      </span>
                    </p>
                  </>
                )}
              </>
            ) : (
              <div className="text-center bg-white rounded-lg shadow-lg p-8">
                <p className="text-red-500 text-lg">Could not load image for sharing.</p>
                <p className="text-gray-600 mt-2">Please check the URL and try again.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default SharePage;