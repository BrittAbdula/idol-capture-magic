// src/pages/TermsOfService.tsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const TermsOfService: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-gray-500 text-center mb-8">Last Updated: March 2025</p>
          
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing or using IdolBooth, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Service Description</h2>
            <p className="mb-4">
              IdolBooth is a web application that allows users to take photos using their device's camera and apply various filters and effects to those photos.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-idol-gold font-bold mr-2 text-lg">✓</span>
                <span><strong>Local Processing:</strong> All photo processing occurs locally on your device.</span>
              </li>
              <li className="flex items-start">
                <span className="text-idol-gold font-bold mr-2 text-lg">✓</span>
                <span><strong>No Account Required:</strong> You can use our service without creating an account.</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">User Responsibilities</h2>
            <p className="mb-4">
              When using IdolBooth, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not attempt to interfere with or disrupt the service or its servers</li>
              <li>Not attempt to access features or areas of the service that you are not authorized to access</li>
            </ul>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Intellectual Property</h2>
            <p className="mb-4">
              The IdolBooth application, including its design, logo, and code, is the property of IdolBooth and is protected by copyright and other intellectual property laws.
            </p>
            <p className="mb-6">
              Photos taken by users using our application belong to the users. We do not claim any ownership rights over these photos.
            </p>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Limitation of Liability</h2>
            <p className="mb-4">
              IdolBooth is provided "as is" without any warranties, expressed or implied. We do not guarantee that the service will be error-free or uninterrupted.
            </p>
            <p className="mb-6">
              In no event shall IdolBooth be liable for any damages arising out of the use or inability to use the service.
            </p>
            
            <h2 className="text-2xl font-bold mb-4 font-montserrat">Related Policies</h2>
            <p className="mb-6">
              Please also review our <a href="/privacy" className="text-idol-gold hover:underline">Privacy Policy</a>, which outlines our practices regarding the collection and use of your information.
            </p>
            
            <p className="mt-8 text-gray-600">
              By using IdolBooth, you agree to these Terms of Service.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;