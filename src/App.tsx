
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PhotoStripProvider } from "./contexts/PhotoStripContext";

import Index from "./pages/Index";
import PhotoBooth from "./pages/PhotoBooth";
import PhotoStrip from "./pages/PhotoStrip";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateCategoryPage from "./pages/TemplateCategoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PhotoStripProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/photo-booth" element={<PhotoBooth />} />
              <Route path="/photo-booth/:category/:idol/:templateId" element={<PhotoBooth />} />
              <Route path="/photo-strip" element={<PhotoStrip />} />
              <Route path="/template" element={<TemplateGallery />} />
              <Route path="/template/:category" element={<TemplateCategoryPage />} />
              <Route path="/template/:category/:idol" element={<TemplateCategoryPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PhotoStripProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
