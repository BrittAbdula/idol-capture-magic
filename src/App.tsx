import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PhotoStripProvider } from "./contexts/PhotoStripContext";

// Import the new component
import ScrollToTop from '@/components/ScrollToTop';

import Index from "./pages/Index";
import PhotoBooth from "./pages/PhotoBooth";
import PhotoStrip from "./pages/PhotoStrip";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateCategoryPage from "./pages/TemplateCategoryPage";
import TemplateCreator from "./pages/TemplateCreator";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SharePage from "./pages/SharePage";

// Create a client
const queryClient = new QueryClient();

// Title update component
const TitleUpdater = () => {
  const location = useLocation();
  
  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      let title = "Free Idol Photo Booth Online | IdolBooth";
      let description = "Use our free Idol Photo Booth online to take stunning virtual photos with your favorite Kpop idols. Capture special moments instantly!";
      
      if (path === "/") {
        title = "Free Idol Photo Booth: Take Photos with Your Idol | IdolBooth";
        description = "Use our free Idol Photo Booth online to take stunning photos with your favorite Kpop idols. Capture your special moments. Try IdolBooth now!";
      } else if (path === "/photo-booth") {
        title = "Take Photos with Your Favorite Idols | Free Online Photo Booth | IdolBooth";
        description = "Our free online Kpop photo booth lets you take virtual photos with your favorite idols. Easy to use, instant results. Try now at IdolBooth.com!";
      } else if (path === "/photo-strip") {
        title = "Create Stunning Photo Strips with Idols | IdolBooth";
        description = "Make beautiful photo strips with your idol photos. Download, share, and print your memories with our free online photo strip creator.";
      } else if (path.includes("/template")) {
        title = "Idol Photo Templates | Choose from Kpop & Anime Templates | IdolBooth";
        description = "Browse our collection of Kpop idol, anime, and celebrity photo templates. Find the perfect template for your virtual photo booth experience.";
      } else if (path === "/privacy") {
        title = "Privacy Policy | IdolBooth";
        description = "Read our privacy policy to understand how we collect and use your data. Your privacy is important to us.";
      } else if (path === "/terms") {
        title = "Terms of Service | IdolBooth";
        description = "Read our terms of service to understand how we operate our service. By using IdolBooth, you agree to these terms.";
      }
      
      document.title = title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      }
    };
    
    updateTitle();
  }, [location]);
  
  return null;
};

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <PhotoStripProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <TitleUpdater />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/photo-booth" element={<PhotoBooth />} />
                <Route path="/photo-strip" element={<PhotoStrip />} />
                <Route path="/template" element={<TemplateGallery />} />
                <Route path="/template/:category" element={<TemplateCategoryPage />} />
                <Route path="/template/:category/:idol" element={<TemplateCategoryPage />} />
                {/* <Route path="/template-creator" element={<TemplateCreator />} /> */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/share" element={<SharePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PhotoStripProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
