import { useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useFavicon() {
  useEffect(() => {
    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        const faviconUrl = data?.favicon_url || data?.logo_url;
        if (!faviconUrl) return;
        const link = document.getElementById('favicon') as HTMLLinkElement;
        if (link) link.href = faviconUrl;
      })
      .catch(() => {});
  }, []);
}
