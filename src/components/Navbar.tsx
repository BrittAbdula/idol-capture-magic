
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Schema.org structured data for better SEO
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "IdolBooth.com",
      "url": "https://idolbooth.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://idolbooth.com/template?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "description": "Free online photo booth to take virtual photos with your favorite idols, anime characters, and celebrities."
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    
    // Check if the script already exists
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3 glass-panel-square bg-opacity-90' : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="IdolBooth Home">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-idol-gold opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <Camera className="w-6 h-6 text-idol-gold group-hover:scale-110 transition-transform" />
            <div className="absolute top-0 left-0 w-full h-full bg-idol-gold/20 opacity-0 group-hover:opacity-100 animate-pulse-slight transition-opacity"></div>
          </div>
          <span className="text-xl font-montserrat font-semibold tracking-tight">
            IdolBooth<span className="text-idol-gold">.com</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={`font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === '/' ? 'text-idol-gold' : ''}`}>
            Home
          </Link>
          <Link to="/photo-booth" className={`font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname.includes('/photo-booth') ? 'text-idol-gold' : ''}`}>
            Photo Booth
          </Link>
          <Link to="/template" className={`font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname.includes('/template') && !location.pathname.includes('/template-creator') ? 'text-idol-gold' : ''}`}>
            Templates
          </Link>
          <Link to="/photo-strip" className={`font-montserrat text-sm transition-colors hover:text-idol-gold ${location.pathname === '/photo-strip' ? 'text-idol-gold' : ''}`}>
            Photo Strip
          </Link>
          <Link to="/photo-booth" className="idol-button-square text-sm py-2">
            Try Now
          </Link>
        </nav>

        <button className="md:hidden" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-black/90 backdrop-blur-md z-50 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex justify-end p-4">
            <button onClick={toggleMobileMenu} aria-label="Close Menu">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <nav className="flex flex-col items-center justify-center h-[80vh] gap-8">
            <Link to="/" className={`font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === '/' ? 'text-idol-gold' : 'text-white'}`}>
              Home
            </Link>
            <Link to="/photo-booth" className={`font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname.includes('/photo-booth') ? 'text-idol-gold' : 'text-white'}`}>
              Photo Booth
            </Link>
            <Link to="/template" className={`font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname.includes('/template') && !location.pathname.includes('/template-creator') ? 'text-idol-gold' : 'text-white'}`}>
              Templates
            </Link>
            <Link to="/template-creator" className={`font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === '/template-creator' ? 'text-idol-gold' : 'text-white'}`}>
              Create Template
            </Link>
            <Link to="/photo-strip" className={`font-montserrat text-2xl transition-colors hover:text-idol-gold ${location.pathname === '/photo-strip' ? 'text-idol-gold' : 'text-white'}`}>
              Photo Strip
            </Link>
            <Link to="/photo-booth" className="idol-button-square mt-4">
              Try Now
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
