
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getAllCategories } from '../data/templates';

const TemplateGallery: React.FC = () => {
  const categories = getAllCategories();

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center font-montserrat">
            Choose a Template Category
          </h1>
          
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Browse our selection of photo booth templates organized by category. 
            Select a category to see all available templates.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link 
                key={index}
                to={`/template/${category}`}
                className="glass-panel p-6 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="aspect-video bg-gray-100 mb-4 rounded overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt={`${category} templates`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h2 className="text-xl font-semibold mb-2 capitalize font-montserrat">
                  {category}
                </h2>
                
                <p className="text-gray-600 mb-4">
                  Browse {category} themed photo booth templates
                </p>
                
                <div className="flex items-center text-idol-gold font-medium">
                  <span>View templates</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TemplateGallery;
