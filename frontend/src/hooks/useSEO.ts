import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  imageUrl?: string;
}

export function useSEO({ title, description, imageUrl }: SEOConfig) {
  useEffect(() => {
    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // URL canónica de la página actual (SPA: se recalcula en cada cambio de ruta)
    const pageUrl = window.location.origin + window.location.pathname;

    // El canonical debe ser un <link>, no una meta
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'es_AR');
    setMeta('meta[property="twitter:card"]', 'property', 'twitter:card', 'summary_large_image');
    if (imageUrl) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    }
  }, [title, description, imageUrl]);
}
