
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getTemplatesByCategory, getTemplatesByIdol, getAllIdolsByCategory } from '../data/templates';
import SEO from '../components/SEO'; 

const TemplateCategoryPage: React.FC = () => {
  const { category, idol } = useParams<{ category: string; idol?: string }>();
  // 动态生成标题和描述
  const pageTitle = idol 
    ? `${idol.charAt(0).toUpperCase() + idol.slice(1)} Photo Templates | IdolBooth.com` 
    : `${category?.charAt(0).toUpperCase() + category?.slice(1)} Photo Templates | IdolBooth.com`;
  
  const pageDescription = idol
    ? `Take photos with ${idol} using our free online photo booth. Choose from multiple templates and create stunning memories.`
    : `Browse our ${category} photo templates collection. Find the perfect template for your virtual photo experience.`;
  
    
  if (!category) {
    return <div>Category not found</div>;
  }
  
  // If we have an idol parameter, show templates for that idol
  // Otherwise, we could either show all templates in the category or show idols to choose from
  const idols = getAllIdolsByCategory(category);
  const showingIdols = !idol && idols.length > 0;
  const templates = idol 
    ? getTemplatesByIdol(idol) 
    : getTemplatesByCategory(category);

  return (
    <div className="min-h-screen">
    <SEO 
      title={pageTitle}
      description={pageDescription}
    />
      <Navbar />
      
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link 
              to={idol ? `/template/${category}` : "/template"} 
              className="flex items-center text-gray-600 hover:text-idol-gold mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Back to {idol ? category : 'categories'}</span>
            </Link>
            
            <h1 className="text-4xl font-bold text-center font-montserrat capitalize">
              {idol ? `${idol} Templates` : `${category} Templates`}
            </h1>
          </div>
          
          {showingIdols ? (
            // Show idols in this category
            <div>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Choose your favorite idol to see available templates
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {idols.map((idolName, index) => (
                  <Link 
                    key={index}
                    to={`/template/${category}/${idolName}`}
                    className="glass-panel p-4 transition-all hover:shadow-lg hover:-translate-y-1 text-center"
                  >
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full overflow-hidden mb-4">
                      <img 
                        src="/placeholder.svg" 
                        alt={idolName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2 capitalize font-montserrat">
                      {idolName}
                    </h3>
                    
                    <div className="flex items-center justify-center text-idol-gold text-sm font-medium">
                      <span>View templates</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            // Show templates for the selected category/idol
            <div>
              <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                Choose a template to start your photo booth session
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template, index) => (
                  <div key={index} className="glass-panel p-6 transition-all hover:shadow-lg">
                    <div className="aspect-video bg-gray-100 mb-4 rounded overflow-hidden">
                      <img 
                        src={template.previewUrl} 
                        alt={`Template ${template.templateId}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-2 capitalize font-montserrat">
                      {template.templateId.replace(/-/g, ' ')}
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {template.photoBoothSettings.aspectRatio}
                      </span>
                      {template.photoBoothSettings.filter && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {template.photoBoothSettings.filter}
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {template.photoBoothSettings.photoNum} photos
                      </span>
                    </div>
                    
                    <Link 
                      to={`/photo-booth?template=${template.templateId}`} 
                      className="idol-button w-full text-center py-2"
                    >
                      Use This Template
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TemplateCategoryPage;
