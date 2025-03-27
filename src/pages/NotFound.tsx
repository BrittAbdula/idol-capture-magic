
import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-lg">
          <div className="w-20 h-20 bg-idol-gold/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle className="w-10 h-10 text-idol-gold" />
          </div>
          
          <h1 className="text-6xl font-bold mb-4 font-montserrat">404</h1>
          <p className="text-xl text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
          
          <Link to="/" className="idol-button inline-flex items-center justify-center">
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
