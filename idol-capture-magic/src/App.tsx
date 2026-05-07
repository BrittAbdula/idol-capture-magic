import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PhotoStripProvider } from "./contexts/PhotoStripContext";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";

// Import the new component
import ScrollToTop from '@/components/ScrollToTop';

import Index from "./pages/Index";
import PhotoStrip from "./pages/PhotoStrip";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateCategoryPage from "./pages/TemplateCategoryPage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SharePage from "./pages/SharePage";
import GroupHub from "./pages/group/GroupHub";
import MemberHub from "./pages/group/MemberHub";
import CampaignPage from "./pages/campaign/CampaignPage";
import CalendarPage from "./pages/CalendarPage";
import SelcaPage from "./pages/generate/SelcaPage";
import PhotocardPage from "./pages/generate/PhotocardPage";
import StripPage from "./pages/generate/StripPage";
import Dashboard from "./pages/me/Dashboard";
import MyBinder from "./pages/me/MyBinder";
import Settings from "./pages/me/Settings";
import PublicBinder from "./pages/share/PublicBinder";
import ShareById from "./pages/share/ShareById";
import Pricing from "./pages/pricing/Pricing";
import SafetyPage from "./pages/legal/SafetyPage";
import TakedownPage from "./pages/legal/TakedownPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1
    }
  }
});

const ROUTE_META: Array<{ match: RegExp; title: string; description: string }> = [
  {
    match: /^\/$/,
    title: "Free K-pop AI Selca, Photocard & Photobooth | IdolBooth",
    description: "Make a selca, photocard, or 4-cut strip with your bias in seconds."
  },
  {
    match: /^\/g\/[^/]+$/,
    title: "K-pop Group AI Photo Hub | IdolBooth",
    description: "Pick a member and start a fan-safe AI photo generation flow."
  },
  {
    match: /^\/g\/[^/]+\/[^/]+$/,
    title: "AI Photo with Your Bias | IdolBooth",
    description: "Create an AI selca, photocard, or strip with a fan-safe companion silhouette."
  },
  {
    match: /^\/selca$/,
    title: "AI Selca Maker | IdolBooth",
    description: "Upload a photo and create a watermarked AI selca."
  },
  {
    match: /^\/photocard$/,
    title: "AI Photocard Maker | IdolBooth",
    description: "Generate collectible photocard-style fan images."
  },
  {
    match: /^\/strip$/,
    title: "4-cut AI Photo Strip | IdolBooth",
    description: "Create a K-pop inspired four-cut photo strip."
  },
  {
    match: /^\/c\/[^/]+$/,
    title: "K-pop Concept Photo Maker | IdolBooth",
    description: "Explore campaign-inspired AI selca and photocard presets."
  },
  {
    match: /^\/calendar$/,
    title: "K-pop Calendar | IdolBooth",
    description: "Browse upcoming IdolBooth concept campaigns and group dates."
  },
  {
    match: /^\/me$/,
    title: "My IdolBooth Dashboard | IdolBooth",
    description: "Review quota, recent generations, and Binder shortcuts."
  },
  {
    match: /^\/me\/binder$/,
    title: "My Binder | IdolBooth",
    description: "Manage saved IdolBooth photocards and generations."
  },
  {
    match: /^\/binder\/[^/]+$/,
    title: "Public Binder | IdolBooth",
    description: "View a public IdolBooth fan Binder."
  },
  {
    match: /^\/share\/[^/]+$/,
    title: "Shared AI Photo | IdolBooth",
    description: "View a public watermarked IdolBooth generation."
  },
  {
    match: /^\/pricing$/,
    title: "Pricing | IdolBooth",
    description: "Compare Free, Plus, and Pro generation plans."
  },
  {
    match: /^\/legal\/safety$/,
    title: "Safety | IdolBooth",
    description: "Learn how IdolBooth handles fan-safe AI outputs and watermarking."
  },
  {
    match: /^\/legal\/takedown$/,
    title: "Takedown | IdolBooth",
    description: "Request review or removal of generated IdolBooth content."
  }
];

// Title update component
const TitleUpdater = () => {
  const location = useLocation();
  
  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      const routeMeta = ROUTE_META.find((item) => item.match.test(path));
      const title = routeMeta?.title ?? "IdolBooth | K-pop AI Photo Maker";
      const description =
        routeMeta?.description ??
        "Create fan-safe, watermarked K-pop AI selcas, photocards, and photo strips.";
      
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
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/g/:groupSlug" element={<GroupHub />} />
                  <Route path="/g/:groupSlug/:memberSlug" element={<MemberHub />} />
                  <Route path="/c/:slug" element={<CampaignPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/selca" element={<SelcaPage />} />
                  <Route path="/photocard" element={<PhotocardPage />} />
                  <Route path="/strip" element={<StripPage />} />
                  <Route path="/photo-strip" element={<PhotoStrip />} />
                  <Route path="/templates" element={<TemplateGallery />} />
                  <Route path="/templates/:category" element={<TemplateCategoryPage />} />
                  <Route path="/templates/:category/:idol" element={<TemplateCategoryPage />} />
                  <Route path="/template" element={<Navigate to="/templates" replace />} />
                  <Route path="/template/:category" element={<TemplateCategoryPage />} />
                  <Route path="/me" element={<Dashboard />} />
                  <Route path="/me/binder" element={<MyBinder />} />
                  <Route path="/me/settings" element={<Settings />} />
                  <Route path="/binder/:handle" element={<PublicBinder />} />
                  <Route path="/share/:id" element={<ShareById />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/legal/safety" element={<SafetyPage />} />
                  <Route path="/legal/takedown" element={<TakedownPage />} />
                  <Route path="/photo-booth" element={<Navigate to="/strip" replace />} />
                  <Route path="/photo-with-idol" element={<Navigate to="/selca" replace />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/share" element={<SharePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </PhotoStripProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
