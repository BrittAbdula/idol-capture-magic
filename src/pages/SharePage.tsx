import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const SharePage: React.FC = () => {
  const location = useLocation();
  const imageUrl = location.state?.imageUrl as string | undefined;
  const [pageShareUrl, setPageShareUrl] = useState('');

  useEffect(() => {
    // Construct the shareable URL for this page, potentially including the image identifier
    // For now, we'll just use the current window location, but you might want to append
    // a unique identifier from the upload response if the share page should be persistent.
    // Example: `${window.location.origin}/share?id=${uploadId}`
    // For this implementation, we'll just pass the image URL in state, which is only
    // available immediately after navigation. A persistent share link would require
    // storing the upload ID and fetching the image URL on page load.
    setPageShareUrl(window.location.href);

    if (!imageUrl) {
      toast.error("No image URL found for sharing.");
    }
  }, [imageUrl]);

  const handleCopyImageUrl = async () => {
    if (imageUrl) {
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Image URL copied to clipboard!");
      } catch (err) {
        console.error('Failed to copy image URL:', err);
        toast.error("Failed to copy image URL.");
      }
    } else {
      toast.error("No image URL to copy.");
    }
  };

  const handleSharePage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My IdolBooth Photo Strip',
          text: 'Check out my photo strip from IdolBooth!',
          url: pageShareUrl,
        });
        toast.success("Share menu opened!");
      } catch (error) {
        console.error('Error sharing page:', error);
        if (error instanceof Error && error.name === 'AbortError') {
          toast.info("Share operation was cancelled");
        } else {
          toast.error("Failed to share page.");
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      try {
        await navigator.clipboard.writeText(pageShareUrl);
        toast.info("Sharing not supported on this browser. Page link copied instead.");
      } catch (err) {
        console.error('Failed to copy page URL:', err);
        toast.error("Failed to copy page URL.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Share Your Photo Strip | IdolBooth.com"
        description="Share your unique photo strip created with IdolBooth."
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-20 px-4 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-6 rounded-lg shadow-xl text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 font-montserrat">Share Your Photo Strip</h1>

          {imageUrl ? (
            <div className="mb-6">
              <img 
                src={imageUrl} 
                alt="Your Photo Strip" 
                className="max-w-full h-auto rounded-md mx-auto"
              />
            </div>
          ) : (
            <p className="text-red-500">Could not load image for sharing.</p>
          )}

          <div className="flex flex-col space-y-4">
            <Button 
              onClick={handleCopyImageUrl} 
              disabled={!imageUrl} 
              className="w-full idol-button-secondary flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Image Link
            </Button>
            <Button 
              onClick={handleSharePage} 
              disabled={!imageUrl} 
              className="w-full idol-button-primary flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Page Link
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharePage; 