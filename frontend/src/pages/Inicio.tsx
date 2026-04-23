import { Link } from 'react-router-dom';
import { useCategorias } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

export default function Inicio() {
  const { categorias, loading } = useCategorias();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative -mx-4 sm:-mx-6 overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100 py-24 px-6 text-center">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-pink-200/30 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-pink-100/40 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <p className="text-xs tracking-[4px] uppercase text-pink-800 font-semibold mb-4">
          Fotografía Profesional · Zona Sur Buenos Aires
        </p>
        <h1 className="font-playfair text-4xl sm:text-6xl font-light text-pink-950 leading-tight mb-6">
          Capturando momentos<br />
          <em className="italic font-normal text-pink-700">que duran toda la vida</em>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora,
          Quilmes y toda la Zona Sur.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/contacto"
            className="bg-pink-700 text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase hover:bg-pink-900 transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-700/30"
          >
            Reservar sesión →
          </Link>
          <Link
            to="/galeria/infantil"
            className="border-2 border-pink-200 text-pink-700 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide uppercase hover:border-pink-700 transition-colors"
          >
            Ver galerías
          </Link>
        </div>
      </section>

      {/* ── GRILLA DE CATEGORÍAS ─────────────────────────────────────── */}
      <section className="py-20">
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

      {/* ── TESTIMONIOS ──────────────────────────────────────────────── */}
      <section className="py-16 -mx-4 sm:-mx-6 bg-gradient-to-br from-pink-50 to-pink-100 px-6">
        <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-12">
          Lo que dicen mis clientes
        </h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              texto: 'Fue la mejor decisión. Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas.',
              autora: 'Sofía L.',
              tipo: '15 años',
            },
            {
              texto: 'Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.',
              autora: 'Laura P.',
              tipo: 'Book infantil',
            },
          ].map((t, i) => (
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
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
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
