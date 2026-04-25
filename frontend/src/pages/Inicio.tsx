import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategorias } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';
const API_BASE = import.meta.env.VITE_API_URL || '';

const getTexto = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizarUrlImagen = (value: unknown): string => {
  const raw = getTexto(value).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? `${R2}${raw}` : `${R2}/${raw}`;
};

const conCacheBuster = (url: string, version: number): string =>
  `${url}${url.includes('?') ? '&' : '?'}v=${version}`;

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
  hero_url: '',
  hero_titulo: 'Transformo momentos en recuerdos eternos',
  hero_subtitulo: 'Books infantiles, 15 anos y bodas con una mirada artistica y emocional.',
  hero_boton_texto: 'Reservar sesion',
  favicon_url: '',
  whatsapp: '5491176348089',
};

export default function Inicio() {
  const { categorias, loading } = useCategorias();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [heroVersion, setHeroVersion] = useState<number>(() => Date.now());

  useEffect(() => {
    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        const cfg = (data && typeof data === 'object') ? data as Partial<Config> : {};
        setConfig({
          hero_url: normalizarUrlImagen(cfg.hero_url),
          hero_titulo: getTexto(cfg.hero_titulo, 'Transformo momentos en recuerdos eternos'),
          hero_subtitulo: getTexto(cfg.hero_subtitulo, 'Books infantiles, 15 anos y bodas con una mirada artistica y emocional.'),
          hero_boton_texto: getTexto(cfg.hero_boton_texto, 'Reservar sesion'),
          favicon_url: normalizarUrlImagen(cfg.favicon_url),
          whatsapp: getTexto(cfg.whatsapp, '5491176348089'),
        });
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/testimonios`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => setTestimonios(data))
      .catch(() => {
        setTestimonios([
          {
            texto: 'Fue la mejor decision. Melina nos hizo sentir comodos en todo momento y los resultados superaron todas nuestras expectativas.',
            autora: 'Sofia L.',
            tipo: '15 anos',
          },
          {
            texto: 'Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.',
            autora: 'Laura P.',
            tipo: 'Book infantil',
          },
        ]);
      });
  }, []);

  useEffect(() => {
    if (config.hero_url) setHeroVersion(Date.now());
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
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    );

    const items = document.querySelectorAll('.scroll-fade');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const heroUrl = config.hero_url ? conCacheBuster(config.hero_url, heroVersion) : '';
  const conImagen = Boolean(heroUrl);
  const categoriasHome = categorias.slice(0, 3);

  return (
    <>
      <section
        className="relative flex min-h-[calc(100vh-64px)] w-full items-center justify-center overflow-hidden text-center"
        style={
          conImagen
            ? { backgroundImage: `url(${heroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        <div className={`absolute inset-0 ${conImagen ? 'bg-black/50' : 'bg-gradient-to-br from-pink-50 via-white to-pink-100'}`} />

        {!conImagen && (
          <>
            <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/2 translate-x-1/3 rounded-full bg-pink-200/30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/2 rounded-full bg-pink-100/40 pointer-events-none" />
          </>
        )}

        <div className="relative mx-auto max-w-4xl px-6 py-24 animate-fade-in">
          <h1 className={`font-playfair mb-8 text-5xl font-light leading-tight sm:text-6xl lg:text-7xl ${conImagen ? 'text-white' : 'text-pink-950'}`}>
            {config.hero_titulo}
          </h1>

          <p className={`mx-auto mb-12 max-w-2xl text-base leading-relaxed sm:text-xl ${conImagen ? 'text-white/90' : 'text-gray-600'}`}>
            {config.hero_subtitulo}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/contacto" className="btn-premium-primary px-10 py-4 text-sm font-semibold">
              {config.hero_boton_texto}
            </Link>
            <Link
              to="/galeria/infantil"
              className={`btn-premium border px-10 py-4 text-sm font-semibold ${conImagen
                ? 'border-white/70 text-white hover:border-white hover:bg-white/10'
                : 'border-pink-300 text-pink-700 hover:border-pink-700 hover:bg-pink-50'}`}
            >
              Ver trabajos
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12 scroll-fade is-visible">
          <h2 className="font-playfair mb-3 text-center text-3xl font-light text-pink-950 sm:text-4xl">
            Galerias
          </h2>
          <p className="text-center text-xs uppercase tracking-[0.28em] text-pink-800/70">
            Explora mis trabajos
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-7">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] rounded-[28px] bg-pink-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-7">
            {categoriasHome.map(cat => (
              <Link
                key={cat.slug}
                to={`/galeria/${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-pink-100 shadow-[0_18px_45px_rgba(141,26,68,0.12)] ring-1 ring-pink-100/80 scroll-fade is-visible"
              >
                <img
                  src={`${R2}/${cat.portada}`}
                  alt={cat.nombre}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <p className="font-playfair text-[1.7rem] font-light tracking-wide text-white sm:text-[1.9rem]">
                    {cat.nombre}
                  </p>
                  <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-white/85">
                    Una mirada delicada y emocional para recordar cada etapa.
                  </p>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    Ver galeria
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {testimonios.length > 0 && (
        <section className="w-full bg-gradient-to-b from-pink-50 to-white py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6 scroll-fade">
            <h2 className="font-playfair mb-10 text-center text-3xl font-light text-pink-950 sm:mb-12">
              Lo que dicen mis clientes
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-7">
              {testimonios.map((t, i) => (
                <div key={i} className="rounded-[24px] border border-pink-100 bg-white p-7 shadow-[0_16px_36px_rgba(141,26,68,0.08)] sm:p-8">
                  <div className="mb-4 text-sm tracking-widest text-pink-500">*****</div>
                  <p className="mb-6 text-sm font-light italic leading-relaxed text-gray-600">"{t.texto}"</p>
                  <div className="text-xs uppercase tracking-widest">
                    <span className="font-semibold text-pink-800">{t.autora}</span>
                    <span className="ml-2 text-gray-400">- {t.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[32px] bg-white px-6 py-12 text-center shadow-[0_24px_60px_rgba(141,26,68,0.08)] ring-1 ring-pink-100 scroll-fade">
          <h2 className="font-playfair mb-5 text-3xl font-light text-pink-950 sm:text-4xl">
            Lista para tu sesion?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-500">
            Completa el formulario y en menos de 24 hs te contacto para coordinar tu sesion.
          </p>
          <Link to="/contacto" className="btn-premium-primary inline-block px-12 py-4 text-sm font-semibold">
            Reservar sesion
          </Link>
        </div>
      </section>
    </>
  );
}
