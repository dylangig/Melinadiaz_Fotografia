import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface Config {
  logo_url: string;
  nombre_marca: string;
  whatsapp: string;
  email: string;
  hero_url: string;
  hero_titulo: string;
  hero_subtitulo: string;
  hero_boton_texto: string;
  favicon_url: string;
  seo_descripcion: string;
}

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

const DEFAULT_CONFIG: Config = {
  logo_url: 'https://imagenes.melinadiazfotografia.com.ar/logo.webp',
  nombre_marca: 'Melina Diaz Fotografía',
  whatsapp: '5491176348089',
  email: '',
  hero_url: 'https://imagenes.melinadiazfotografia.com.ar/assets/hero.webp',
  hero_titulo: 'Transformo momentos en recuerdos eternos',
  hero_subtitulo: 'Books infantiles, 15 años y bodas con una mirada artística y emocional.',
  hero_boton_texto: 'Reservar sesión',
  favicon_url: '',
  seo_descripcion: 'Fotografía profesional de books infantiles, 15 años y bodas en Zona Sur Buenos Aires.',
};

export interface ConfigContextValue extends Config {
  // Refresca la config desde la API (cambios hechos en el admin se ven
  // sin recargar la página). Las llamadas simultáneas comparten un request.
  recargar: () => Promise<void>;
}

export const ConfigContext = createContext<ConfigContextValue>({
  ...DEFAULT_CONFIG,
  recargar: () => Promise.resolve(),
});

const normalizarUrlImagen = (value: string): string => {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? `${R2}${raw}` : `${R2}/${raw}`;
};

const pickConfig = (data: unknown): Config => {
  const source = (data && typeof data === 'object') ? data as Partial<Record<keyof Config, unknown>> : {};
  const next = { ...DEFAULT_CONFIG };

  (Object.keys(DEFAULT_CONFIG) as Array<keyof Config>).forEach(key => {
    const value = source[key];
    if (typeof value !== 'string') return;
    if (key === 'logo_url' || key === 'hero_url' || key === 'favicon_url') {
      next[key] = normalizarUrlImagen(value) || DEFAULT_CONFIG[key];
      return;
    }
    next[key] = value || DEFAULT_CONFIG[key];
  });

  return next;
};

let configPromise: Promise<void> | null = null;

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  const recargar = useCallback(() => {
    if (configPromise) return configPromise;
    configPromise = fetch(`${import.meta.env.VITE_API_URL || ''}/api/configuracion`, { cache: 'no-store' })
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        const next = pickConfig(data);
        setConfig(next);

        const faviconUrl = next.favicon_url || next.logo_url;
        if (!faviconUrl) return;
        const link = document.getElementById('favicon') as HTMLLinkElement | null;
        if (link) link.href = faviconUrl;
        const appleLink = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
        if (appleLink) appleLink.href = faviconUrl;
      })
      .catch(() => { /* sin red seguimos con la config actual */ })
      .finally(() => { configPromise = null; });
    return configPromise;
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  // Al volver a la pestaña: refrescar cambios hechos desde el admin en otra pestaña
  useEffect(() => {
    const alVolver = () => { if (!document.hidden) recargar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [recargar]);

  const value = useMemo(() => ({ ...config, recargar }), [config, recargar]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
