// src/components/SEO.tsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const location = useLocation();
  const baseUrl = 'https://idolbooth.com'; // 确保这是你的实际域名
  const canonicalUrl = `${baseUrl}${location.pathname}`;
  
  useEffect(() => {
    // 更新 canonical 标签
    let canonical = document.querySelector('link[rel="canonical"]');
    
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonical);
    }
    
    // 如果提供了标题和描述，也更新它们
    if (title) document.title = title;
    
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
    
    // 清理函数
    return () => {
      // 可选：在组件卸载时移除 canonical 标签
      // document.head.removeChild(canonical);
    };
  }, [canonicalUrl, title, description]);
  
  return null;
};

export default SEO;