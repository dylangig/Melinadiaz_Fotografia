import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategorias } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';
const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_HERO_URL = `${R2}/assets/hero.webp`;
const HERO_PRIORITY_ATTRS = { fetchpriority: 'high' };

const getTexto = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizarUrlImagen = (value: unknown): string => {
  const raw = getTexto(value).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? `${R2}${raw}` : `${R2}/${raw}`;
};

interface Config {
  hero_url: string;
  hero_titulo: string;
  hero_subtitulo: string;
  hero_boton_texto: string;
  favicon_url: string;
  whatsapp: string;
}

interface Testimonio {
  texto: string;
  autora: string;
  tipo: string;
}

const DEFAULT_CONFIG: Config = {
  hero_url: DEFAULT_HERO_URL,
  hero_titulo: 'Transformo momentos en recuerdos eternos',
  hero_subtitulo: 'Books infantiles, 15 años y bodas con una mirada artística y emocional.',
  hero_boton_texto: 'Reservar sesión',
  favicon_url: '',
  whatsapp: '5491176348089',
};

const TESTIMONIOS_FALLBACK: Testimonio[] = [
  {
    texto: 'Cada foto transmitió exactamente lo que vivimos ese día. Todo se sintió natural, cuidado y muy emotivo.',
    autora: 'Sofía L.',
    tipo: '15 años',
  },
  {
    texto: 'Nos encantó la calidez del proceso y el resultado final. Las imágenes tienen una sensibilidad preciosa.',
    autora: 'Carla y Tomas',
    tipo: 'Boda',
  },
  {
    texto: 'Mi hija se sintió cómoda desde el primer minuto y eso se nota en cada imagen. Una experiencia hermosa.',
    autora: 'Laura P.',
    tipo: 'Book infantil',
  },
];

export default function Inicio() {
  const { categorias, loading } = useCategorias();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [testimonios, setTestimonios] = useState<Testimonio[]>(TESTIMONIOS_FALLBACK);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        const cfg = (data && typeof data === 'object') ? data as Partial<Config> : {};
        setConfig({
          hero_url: normalizarUrlImagen(cfg.hero_url) || DEFAULT_HERO_URL,
          hero_titulo: getTexto(cfg.hero_titulo, 'Transformo momentos en recuerdos eternos'),
          hero_subtitulo: getTexto(cfg.hero_subtitulo, 'Books infantiles, 15 años y bodas con una mirada artística y emocional.'),
          hero_boton_texto: getTexto(cfg.hero_boton_texto, 'Reservar sesión'),
          favicon_url: normalizarUrlImagen(cfg.favicon_url),
          whatsapp: getTexto(cfg.whatsapp, '5491176348089'),
        });
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/testimonios`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        const items = Array.isArray(data)
          ? data.filter((item): item is Testimonio =>
              Boolean(item && typeof item.texto === 'string' && typeof item.autora === 'string' && typeof item.tipo === 'string')
            )
          : [];
        setTestimonios(items.length > 0 ? items : TESTIMONIOS_FALLBACK);
      })
      .catch(() => {
        setTestimonios(TESTIMONIOS_FALLBACK);
      });
  }, []);

  useEffect(() => {
    setHeroImageError(false);
  }, [config.hero_url]);

  useEffect(() => {
    if (!config.favicon_url) return;
    const link = document.getElementById('favicon') as HTMLLinkElement | null;
    if (link) link.href = config.favicon_url;
  }, [config.favicon_url]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    const items = document.querySelectorAll('.scroll-fade');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [loading]);

  const heroUrl = config.hero_url;
  const conImagen = Boolean(heroUrl && !heroImageError);
  const categoriasHome = categorias.slice(0, 3);

  return (
    <>
      <section
        className="relative flex h-[calc(100vh-64px)] max-h-[720px] min-h-[500px] w-full flex-col items-center justify-end overflow-hidden text-center sm:h-auto sm:max-h-none sm:min-h-[calc(100vh-64px)] sm:justify-center"
      >
        {conImagen && (
          <img
            src={heroUrl}
            alt=""
            loading="eager"
            decoding="async"
            {...HERO_PRIORITY_ATTRS}
            onError={() => setHeroImageError(true)}
            className="absolute inset-0 h-full w-full object-cover object-[50%_20%] sm:object-center"
            aria-hidden="true"
          />
        )}
        <div className={`absolute inset-0 ${conImagen ? 'bg-black/60 sm:bg-black/50' : 'bg-gradient-to-br from-pink-50 via-white to-pink-100'}`} />

        {!conImagen && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-pink-200/30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-pink-100/40 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          </>
        )}

        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-16 sm:px-6 sm:py-24 animate-fade-in">
          <h1 className={`font-playfair text-4xl sm:text-6xl lg:text-7xl font-light leading-tight mb-5 sm:mb-8 ${conImagen ? 'text-white' : 'text-pink-950'}`}>
            {config.hero_titulo}
          </h1>

          <p className={`mx-auto mb-8 max-w-[20rem] text-sm leading-relaxed sm:mb-12 sm:max-w-2xl sm:text-xl ${conImagen ? 'text-white/90' : 'text-gray-600'}`}>
            {config.hero_subtitulo}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contacto" className="btn-premium-primary px-8 py-3.5 text-xs font-semibold sm:px-10 sm:py-4 sm:text-sm">
              {config.hero_boton_texto}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 scroll-fade">
        <h2 className="font-playfair text-3xl sm:text-4xl text-center text-pink-950 font-light mb-3">
          Galerías
        </h2>
        <p className="text-center text-pink-800/70 text-xs tracking-[0.28em] uppercase mb-10 sm:mb-12">
          Explorá mis trabajos
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] rounded-[26px] bg-pink-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {categoriasHome.map(cat => (
              <Link
                key={cat.slug}
                to={`/galeria/${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[26px] bg-pink-100 shadow-[0_18px_40px_rgba(141,26,68,0.12)] ring-1 ring-pink-100/80"
              >
                <img
                  src={`${R2}/${cat.portada}`}
                  alt={cat.nombre}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                  <p className="font-playfair text-white text-[1.75rem] font-light tracking-wide">
                    {cat.nombre}
                  </p>
                  <p className="text-white/90 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity tracking-[0.28em] uppercase">
                    Ver galería
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="w-full bg-gradient-to-b from-pink-50 to-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6 scroll-fade">
          <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-10 sm:mb-12">
            Lo que dicen mis clientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {testimonios.map((t, i) => (
              <div key={i} className="bg-white rounded-[24px] p-7 border border-pink-100 shadow-[0_16px_36px_rgba(141,26,68,0.08)]">
                <div className="text-pink-500 text-sm mb-4 tracking-widest">*****</div>
                <p className="text-gray-600 italic text-sm leading-relaxed mb-6 font-light min-h-[112px]">"{t.texto}"</p>
                <div className="text-xs tracking-widest uppercase">
                  <span className="text-pink-800 font-semibold">{t.autora}</span>
                  <span className="text-gray-400 ml-2">- {t.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center scroll-fade">
        <h2 className="font-playfair text-3xl sm:text-4xl text-pink-950 font-light mb-5">
          ¿Lista para tu sesión?
        </h2>
        <p className="text-gray-500 text-base mb-10 max-w-xl mx-auto leading-relaxed">
          Completá el formulario y en menos de 24 hs te contacto para coordinar tu sesión.
        </p>
        <Link to="/contacto" className="btn-premium-primary px-12 py-4 text-sm font-semibold inline-block">
          Reservar sesión
        </Link>
      </section>
    </>
  );
}
