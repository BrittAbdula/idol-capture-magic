
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Star, Image, Sparkles, ArrowRight, Upload, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Index = () => {
  const animatedElementsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));
    
    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" ref={animatedElementsRef}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 z-10" />
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="/placeholder.svg"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-people-taking-pictures-in-a-concert-4839-large.mp4" type="video/mp4" />
          </video>
          {/* <img src="/images/hero.png" className="w-full h-full object-cover" /> */}
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full py-1 px-4 mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-idol-gold mr-2" />
              <span className="text-sm text-white/90">Free AI Idol Photo Booth Online</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-up font-montserrat">
              Capture Your Favorite 
              <span className="text-idol-gold ml-2">Idol Moments</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 leading-relaxed animate-fade-up delay-100 font-open-sans">
              Create amazing K-pop & J-pop style photo strips with our advanced 
              AI image processing for high-quality, realistic, and captivating results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-200">
              <Link to="/photo-booth" className="idol-button">
                <span className="flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  <span>选择偶像照片 & 拍照</span>
                </span>
              </Link>
              
              <Link to="/photo-booth" className="idol-button-outline">
                <span className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  <span>直接拍照</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 bg-idol-gray">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="inline-block text-3xl md:text-4xl font-bold mb-4 animate-on-scroll font-montserrat">
              <span className="relative">
                Premium Features
                <span className="absolute bottom-0 left-0 w-full h-1 bg-idol-gold opacity-70" />
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-on-scroll">
              Our cutting-edge technology makes it easy to create stunning photo booth moments with your favorite idols.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="neo-panel hover-scale animate-on-scroll">
              <div className="w-14 h-14 bg-idol-gold/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">AI Subject Extraction</h3>
              <p className="text-gray-600">
                Our advanced AI automatically extracts subjects from your idol photos for perfect composition.
              </p>
            </div>
            
            <div className="neo-panel hover-scale animate-on-scroll">
              <div className="w-14 h-14 bg-idol-gold/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">Premium Filters</h3>
              <p className="text-gray-600">
                Access a variety of filters designed specifically to enhance your idol photo strips.
              </p>
            </div>
            
            <div className="neo-panel hover-scale animate-on-scroll">
              <div className="w-14 h-14 bg-idol-gold/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">Instant Photo Strips</h3>
              <p className="text-gray-600">
                Generate beautiful photo strips instantly that you can share with friends or download.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="inline-block text-3xl md:text-4xl font-bold mb-4 animate-on-scroll font-montserrat">
              <span className="relative">
                How It Works
                <span className="absolute bottom-0 left-0 w-full h-1 bg-idol-gold opacity-70" />
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-on-scroll">
              Create stunning photo combinations with your favorite idols in just a few simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="text-center animate-on-scroll">
              <div className="w-20 h-20 bg-idol-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-idol-gold rounded-full flex items-center justify-center text-black font-bold">1</span>
                <Upload className="w-8 h-8 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">Upload Idol Photo</h3>
              <p className="text-gray-600">
                Choose your favorite idol photo or use one from our gallery.
              </p>
            </div>
            
            <div className="text-center animate-on-scroll">
              <div className="w-20 h-20 bg-idol-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-idol-gold rounded-full flex items-center justify-center text-black font-bold">2</span>
                <Camera className="w-8 h-8 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">Take Your Photo</h3>
              <p className="text-gray-600">
                Use your webcam to capture your photo or upload an existing one.
              </p>
            </div>
            
            <div className="text-center animate-on-scroll">
              <div className="w-20 h-20 bg-idol-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-idol-gold rounded-full flex items-center justify-center text-black font-bold">3</span>
                <Download className="w-8 h-8 text-idol-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-montserrat">Download & Share</h3>
              <p className="text-gray-600">
                Download your perfect photo strip and share it with friends.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12 animate-on-scroll">
            <Link to="/photo-booth" className="idol-button inline-flex items-center">
              Try Now <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/70 z-10" />
          <img
            src="/placeholder.svg"
            alt="K-pop concert"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 animate-on-scroll font-montserrat">
              定格偶像瞬间，留住闪耀回忆
            </h2>
            <p className="text-xl text-white/80 mb-8 animate-on-scroll">
              Capture the Moment, Cherish the Star
            </p>
            <Link to="/photo-booth" className="idol-button animate-on-scroll">
              Create Your Photo Strip Now
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
