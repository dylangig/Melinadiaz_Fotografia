import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTrabajoDetalle } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

const NOMBRES: Record<string, string> = {
  infantil: 'Book Infantil',
  quince:   '15 Años',
  bodas:    'Bodas',
};

export default function TrabajoDetalle() {
  const { categoriaSlug = '', trabajoSlug = '' } = useParams();
  const { trabajo, loading, error } = useTrabajoDetalle(categoriaSlug, trabajoSlug);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const nombre = NOMBRES[categoriaSlug] ?? categoriaSlug;

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2.5 mt-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-pink-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Trabajo no encontrado</p>
        <Link to={`/galeria/${categoriaSlug}`} className="text-pink-700 text-sm mt-4 inline-block">
          ← Volver a {nombre}
        </Link>
      </div>
    );
  }

  const imgUrl = (foto: string) => `${R2}/${categoriaSlug}/${trabajoSlug}/${foto}`;
  const desc = trabajo.descripcion_evento ?? trabajo.descripcion;

  return (
    <>
      {/* Encabezado */}
      <div className="text-center mt-10 mb-8">
        <h1 className="font-playfair text-pink-700 font-light tracking-[3px] uppercase text-3xl mb-2">
          {trabajo.nombre}
        </h1>
        {desc && (
          <p className="text-gray-400 text-sm italic tracking-wide mb-3">{desc}</p>
        )}
        <Link
          to={`/galeria/${categoriaSlug}`}
          className="text-pink-300 text-xs uppercase tracking-widest hover:text-pink-700 transition-colors"
        >
          ← Volver a {nombre}
        </Link>
      </div>

      {/* Grilla de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {trabajo.fotos.map((foto, i) => (
          <div
            key={foto}
            className="aspect-square overflow-hidden rounded bg-pink-50 cursor-pointer"
            onClick={() => setLightbox(i)}
          >
            <img
              src={imgUrl(foto)}
              alt={`${nombre} ${trabajo.nombre} en Zona Sur Buenos Aires - Foto ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-400 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="my-20 py-16 px-10 bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl text-center">
        <h3 className="font-playfair text-pink-700 text-3xl font-light mb-3">
          ¿Te gustó lo que viste?
        </h3>
        <p className="text-rose-dark text-base mb-7 leading-relaxed">
          Reservá tu sesión de {nombre.toLowerCase()} y capturemos juntas tu momento especial en Zona Sur Buenos Aires.
        </p>
        <Link
          to="/contacto"
          className="inline-block px-10 py-4 bg-pink-700 text-white rounded-full font-bold text-sm tracking-wide uppercase hover:bg-pink-900 transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-700/30"
        >
          Quiero una sesión así →
        </Link>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Cerrar */}
          <button
            className="absolute top-4 right-5 text-white text-4xl font-thin leading-none hover:text-pink-300 transition-colors"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>

          {/* Anterior */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-thin hover:text-pink-300 transition-colors"
            onClick={e => { e.stopPropagation(); setLightbox(l => l !== null && l > 0 ? l - 1 : l); }}
          >
            ‹
          </button>

          <img
            src={imgUrl(trabajo.fotos[lightbox])}
            alt={`Foto ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />

          {/* Siguiente */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-thin hover:text-pink-300 transition-colors"
            onClick={e => { e.stopPropagation(); setLightbox(l => l !== null && l < trabajo.fotos.length - 1 ? l + 1 : l); }}
          >
            ›
          </button>

          <div className="absolute bottom-4 text-white/50 text-sm">
            {lightbox + 1} / {trabajo.fotos.length}
          </div>
        </div>
      )}
    </>
  );
}
