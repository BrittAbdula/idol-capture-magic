
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Camera, Star, Instagram, Twitter, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-idol-gold opacity-80"></div>
                <Camera className="w-5 h-5 text-idol-gold" />
              </div>
              <span className="text-lg font-montserrat font-semibold tracking-tight">
                IdolBooth<span className="text-idol-gold">.com</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Capture the Moment, Cherish the Star
            </p>
            <p className="text-gray-400 text-sm mt-4">
              定格偶像瞬间，留住闪耀回忆
            </p>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-idol-gold transition-colors duration-300 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/photo-booth" className="text-gray-400 hover:text-idol-gold transition-colors duration-300 text-sm">
                  Photo Booth
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-idol-gold transition-colors duration-300 text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-idol-gold transition-colors duration-300 text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4">Features</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-idol-gold" />
                <span>AI Photo Extraction</span>
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-idol-gold" />
                <span>Instant Photo Booth</span>
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-idol-gold" />
                <span>Premium Filters</span>
              </li>
              <li className="text-gray-400 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-idol-gold" />
                <span>Photo Strips</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-semibold text-lg mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-idol-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-idol-gold transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-idol-gold transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} IdolBooth.com. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/" className="text-gray-500 hover:text-idol-gold transition-colors text-xs">
              Privacy Policy
            </Link>
            <Link to="/" className="text-gray-500 hover:text-idol-gold transition-colors text-xs">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
