import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategorias } from '../hooks/useApi';

const R2       = 'https://imagenes.melinadiazfotografia.com.ar';
const API_BASE = import.meta.env.VITE_API_URL || '';

interface Config {
  hero_url:         string;
  hero_titulo:      string;
  hero_subtitulo:   string;
  hero_boton_texto: string;
  whatsapp:         string;
}

interface Testimonio {
  texto:  string;
  autora: string;
  tipo:   string;
}

const DEFAULT_CONFIG: Config = {
  hero_url:         '',
  hero_titulo:      'Capturando momentos que duran toda la vida',
  hero_subtitulo:   'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.',
  hero_boton_texto: 'Reservar sesión',
  whatsapp:         '5491176348089',
};

export default function Inicio() {
  const { categorias, loading } = useCategorias();
  const [config,       setConfig]       = useState<Config>(DEFAULT_CONFIG);
  const [testimonios,  setTestimonios]  = useState<Testimonio[]>([]);

  useEffect(() => {
    // Config general
    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => setConfig({
        hero_url:         data.hero_url         || '',
        hero_titulo:      data.hero_titulo      || 'Capturando momentos que duran toda la vida',
        hero_subtitulo:   data.hero_subtitulo   || 'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.',
        hero_boton_texto: data.hero_boton_texto || 'Reservar sesión',
        whatsapp:         data.whatsapp         || '5491176348089',
      }))
      .catch(() => {});

    // Testimonios desde D1
    fetch(`${API_BASE}/api/testimonios`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => setTestimonios(data))
      .catch(() => {
        // Fallback si el endpoint no existe todavía
        setTestimonios([
          { texto: 'Fue la mejor decisión. Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas.', autora: 'Sofía L.', tipo: '15 años' },
          { texto: 'Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.', autora: 'Laura P.', tipo: 'Book infantil' },
        ]);
      });
  }, []);

  const conImagen = Boolean(config.hero_url);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────────
          El navbar ya ocupa 64px fijos (h-16 spacer).
          El hero ocupa el resto del viewport: calc(100vh - 64px).
          Si hay imagen de fondo la usa; si no, usa el gradiente rosa.    */}
      <section
        className="relative w-full overflow-hidden text-center flex flex-col items-center justify-center"
        style={{
          minHeight: 'calc(100vh - 64px)',
          ...(conImagen
            ? { backgroundImage: `url(${config.hero_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}),
        }}
      >
        {/* Fondo / overlay */}
        <div
          className={`absolute inset-0 ${
            conImagen
              ? 'bg-black/40'
              : 'bg-gradient-to-br from-pink-50 via-white to-pink-100'
          }`}
        />

        {/* Burbujas decorativas (solo sin imagen) */}
        {!conImagen && (
          <>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-pink-200/30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-pink-100/40 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          </>
        )}

        {/* Contenido del hero */}
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <h1
            className={`font-playfair text-5xl sm:text-6xl font-light leading-tight mb-6 ${
              conImagen ? 'text-white' : 'text-pink-950'
            }`}
          >
            {/* El título puede tener una parte en cursiva —
                si contiene " que " separamos para el efecto */}
            {config.hero_titulo.includes(' que ')
              ? <>
                  {config.hero_titulo.split(' que ')[0]} <br />
                  <em className={`italic font-normal ${conImagen ? 'text-pink-200' : 'text-pink-700'}`}>
                    que {config.hero_titulo.split(' que ').slice(1).join(' que ')}
                  </em>
                </>
              : config.hero_titulo
            }
          </h1>

          <p className={`text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed ${
            conImagen ? 'text-white/85' : 'text-gray-500'
          }`}>
            {config.hero_subtitulo}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contacto"
              className="bg-pink-700 text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase hover:bg-pink-900 transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-700/30"
            >
              {config.hero_boton_texto} →
            </Link>
            <Link
              to="/galeria/infantil"
              className={`border-2 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase transition-colors ${
                conImagen
                  ? 'border-white/60 text-white hover:border-white'
                  : 'border-pink-200 text-pink-700 hover:border-pink-700'
              }`}
            >
              Ver galerías
            </Link>
          </div>
        </div>

        {/* Flecha scroll-down */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce ${
          conImagen ? 'text-white/60' : 'text-pink-300'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── GALERÍAS ─────────────────────────────────────────────────────────*/}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-2">
          Galerías
        </h2>
        <p className="text-center text-gray-400 text-xs tracking-[3px] uppercase mb-12">
          Explorá mis trabajos
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-pink-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {categorias.map(cat => (
              <Link
                key={cat.slug}
                to={`/galeria/${cat.slug}`}
                className="group relative aspect-square overflow-hidden rounded-xl block"
              >
                <img
                  src={`${R2}/${cat.portada}`}
                  alt={cat.nombre}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-playfair text-white text-2xl font-light tracking-widest uppercase">
                    {cat.nombre}
                  </p>
                  <p className="text-pink-200 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                    VER GALERÍA →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────────*/}
      {testimonios.length > 0 && (
        <section className="w-full bg-gradient-to-br from-pink-50 to-pink-100 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-12">
              Lo que dicen mis clientes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {testimonios.map((t, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-sm">
                  <div className="text-pink-500 text-sm mb-3 tracking-widest">★★★★★</div>
                  <p className="text-gray-600 italic text-sm leading-relaxed mb-4">"{t.texto}"</p>
                  <div>
                    <span className="text-pink-800 font-bold text-xs tracking-widest uppercase">{t.autora}</span>
                    <span className="text-gray-400 text-xs ml-2">— {t.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ────────────────────────────────────────────────────────*/}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="font-playfair text-3xl sm:text-4xl text-pink-950 font-light mb-4">
          ¿Lista para tu sesión?
        </h2>
        <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">
          Completá el formulario y en menos de 24 hs te contacto para coordinar tu sesión.
        </p>
        <Link
          to="/contacto"
          className="bg-pink-700 text-white px-10 py-4 rounded-full font-bold text-sm tracking-wide uppercase hover:bg-pink-900 transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-700/30 inline-block"
        >
          Reservar mi sesión →
        </Link>
      </section>
    </>
  );
}
