// src/pages/PrivacyPolicy.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen">
      <SEO 
        title="Privacy Policy | IdolBooth.com"
        description="IdolBooth privacy policy. Learn about how we handle your data when using our virtual photo booth service."
      />
      <Navbar />
      
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center font-montserrat">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-center mb-8">Last Updated: March 2025</p>
          
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold mb-6 font-montserrat">Our Commitment to Privacy</h2>
            <p className="mb-6">
              At IdolBooth, your privacy is our top priority. We've designed our application with privacy in mind from the ground up.
            </p>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Data Collection</h2>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-idol-gold font-bold mr-2 text-lg">✓</span>
                <span><strong>No Personal Data Collection:</strong> We do not track, collect, or store any personal data.</span>
              </li>
              <li className="flex items-start">
                <span className="text-idol-gold font-bold mr-2 text-lg">✓</span>
                <span><strong>Local Processing:</strong> All photos taken are processed locally on your device and are not uploaded or saved to any external server.</span>
              </li>
              <li className="flex items-start">
                <span className="text-idol-gold font-bold mr-2 text-lg">✓</span>
                <span><strong>No Cookies or Trackers:</strong> We do not use cookies, tracking pixels, or any other tracking technologies on our site.</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Camera Access</h2>
            <p className="mb-4">
              Our application requires access to your device's camera to function. This access is used solely for the purpose of capturing photos within the application. Camera access is:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Only active when you're using the photo booth feature</li>
              <li>Automatically disabled when you leave the photo booth or close the application</li>
              <li>Never used to record or transmit video/images without your knowledge</li>
            </ul>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Additional Information</h2>
            <p className="mb-4">
              For more details about how we operate our service, please review our <a href="/terms" className="text-idol-gold hover:underline">Terms of Service</a>.
            </p>
            
            <p className="mt-8 text-gray-600">
              By using IdolBooth, you agree to the privacy practices described in this policy.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;