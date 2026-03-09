import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
}

export const useSEO = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterTitle,
  twitterDescription,
  twitterImage,
  noIndex = false,
}: SEOProps) => {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Helper function to set link tags
    const setLinkTag = (rel: string, href: string) => {
      if (!href) return;
      
      let link = document.querySelector(`link[rel="${rel}"]`);
      
      if (link) {
        link.setAttribute('href', href);
      } else {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        document.head.appendChild(link);
      }
    };

    // Basic meta tags
    if (description) {
      setMetaTag('description', description);
    }
    
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Canonical URL
    if (canonical) {
      setLinkTag('canonical', canonical);
    }

    // Open Graph tags
    setMetaTag('og:title', ogTitle || title || '', true);
    setMetaTag('og:description', ogDescription || description || '', true);
    setMetaTag('og:type', ogType, true);
    
    if (ogImage) {
      setMetaTag('og:image', ogImage, true);
    }
    
    if (canonical) {
      setMetaTag('og:url', canonical, true);
    }

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', twitterTitle || ogTitle || title || '');
    setMetaTag('twitter:description', twitterDescription || ogDescription || description || '');
    
    if (twitterImage || ogImage) {
      setMetaTag('twitter:image', twitterImage || ogImage || '');
    }

  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, twitterTitle, twitterDescription, twitterImage, noIndex]);
};