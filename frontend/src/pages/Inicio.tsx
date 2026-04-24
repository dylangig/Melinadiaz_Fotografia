import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategorias } from '../hooks/useApi';

const R2       = 'https://imagenes.melinadiazfotografia.com.ar';
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
  hero_url:         string;
  hero_titulo:      string;
  hero_subtitulo:   string;
  hero_boton_texto: string;
  favicon_url:      string;
  whatsapp:         string;
}

interface Testimonio {
  texto:  string;
  autora: string;
  tipo:   string;
}

const DEFAULT_CONFIG: Config = {
  hero_url:         '',
  hero_titulo:      'Transformo momentos en recuerdos eternos',
  hero_subtitulo:   'Books infantiles, 15 años y bodas con una mirada artística y emocional.',
  hero_boton_texto: 'Reservar sesión',
  favicon_url:      '',
  whatsapp:         '5491176348089',
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
          hero_url:         normalizarUrlImagen(cfg.hero_url),
          hero_titulo:      getTexto(cfg.hero_titulo, 'Transformo momentos en recuerdos eternos'),
          hero_subtitulo:   getTexto(cfg.hero_subtitulo, 'Books infantiles, 15 años y bodas con una mirada artística y emocional.'),
          hero_boton_texto: getTexto(cfg.hero_boton_texto, 'Reservar sesión'),
          favicon_url:      normalizarUrlImagen(cfg.favicon_url),
          whatsapp:         getTexto(cfg.whatsapp, '5491176348089'),
        });
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/testimonios`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => setTestimonios(data))
      .catch(() => {
        setTestimonios([
          { texto: 'Fue la mejor decisión. Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas.', autora: 'Sofía L.', tipo: '15 años' },
          { texto: 'Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.', autora: 'Laura P.', tipo: 'Book infantil' },
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

  const heroUrl = config.hero_url ? conCacheBuster(config.hero_url, heroVersion) : '';
  const conImagen = Boolean(heroUrl);

  return (
    <>
      <section
        className="relative w-full overflow-hidden text-center flex flex-col items-center justify-center"
        style={{
          minHeight: 'calc(100vh - 64px)',
          ...(conImagen
            ? { backgroundImage: `url(${heroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}),
        }}
      >
        <div className={`absolute inset-0 ${conImagen ? 'bg-black/50' : 'bg-gradient-to-br from-pink-50 via-white to-pink-100'}`} />

        {!conImagen && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-pink-200/30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-pink-100/40 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          </>
        )}

        <div className="relative max-w-4xl mx-auto px-6 py-24 animate-fade-in">
          <h1 className={`font-playfair text-5xl sm:text-6xl lg:text-7xl font-light leading-tight mb-8 ${conImagen ? 'text-white' : 'text-pink-950'}`}>
            {config.hero_titulo}
          </h1>

          <p className={`text-base sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed ${conImagen ? 'text-white/90' : 'text-gray-600'}`}>
            {config.hero_subtitulo}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contacto" className="btn-premium-primary px-10 py-4 text-sm font-semibold">
              {config.hero_boton_texto}
            </Link>
            <Link
              to="/galeria/infantil"
              className={`btn-premium px-10 py-4 text-sm font-semibold border ${conImagen
                ? 'border-white/70 text-white hover:border-white hover:bg-white/10'
                : 'border-pink-300 text-pink-700 hover:border-pink-700 hover:bg-pink-50'}`}
            >
              Ver trabajos
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white" />
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-3">
          Galerías
        </h2>
        <p className="text-center text-gray-400 text-xs tracking-[3px] uppercase mb-14">
          Explorá mis trabajos
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-pink-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
            {categorias.map(cat => (
              <Link
                key={cat.slug}
                to={`/galeria/${cat.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl block shadow-sm"
              >
                <img
                  src={`${R2}/${cat.portada}`}
                  alt={cat.nombre}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="font-playfair text-white text-2xl font-light tracking-wide uppercase">
                    {cat.nombre}
                  </p>
                  <p className="text-white/85 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity tracking-[3px] uppercase">
                    Ver galería
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {testimonios.length > 0 && (
        <section className="w-full bg-gradient-to-b from-pink-50 to-white py-24">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-14">
              Lo que dicen mis clientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              {testimonios.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-pink-100 shadow-md shadow-pink-100/50">
                  <div className="text-pink-500 text-sm mb-4 tracking-widest">★★★★★</div>
                  <p className="text-gray-600 italic text-sm leading-relaxed mb-6 font-light">"{t.texto}"</p>
                  <div className="text-xs tracking-widest uppercase">
                    <span className="text-pink-800 font-semibold">{t.autora}</span>
                    <span className="text-gray-400 ml-2">— {t.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
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
