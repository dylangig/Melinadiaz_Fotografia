import { useEffect, useRef, useState } from 'react';
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
  const [visibleCount, setVisibleCount] = useState(8);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nombre = NOMBRES[categoriaSlug] ?? categoriaSlug;

  useEffect(() => {
    setVisibleCount(8);
    setLightbox(null);
  }, [categoriaSlug, trabajoSlug]);

  useEffect(() => {
    if (!trabajo || visibleCount >= trabajo.fotos.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisibleCount(count => Math.min(count + 6, trabajo.fotos.length));
        }
      },
      { rootMargin: '600px 0px', threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [trabajo, visibleCount]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-pink-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !trabajo) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 text-center py-20">
        <p className="text-gray-400">Trabajo no encontrado</p>
        <Link to={`/galeria/${categoriaSlug}`} className="text-pink-700 text-sm mt-4 inline-block">
          ← Volver a {nombre}
        </Link>
      </div>
    );
  }

  const imgUrl = (foto: string) => `${R2}/${categoriaSlug}/${trabajoSlug}/${foto}`;
  const desc   = trabajo.descripcion_evento ?? trabajo.descripcion;
  const fotosVisibles = trabajo.fotos.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10">

      {/* Encabezado */}
      <div className="text-center mb-10">
        <h1 className="font-playfair text-pink-700 font-light tracking-[3px] uppercase text-3xl mb-2">
          {trabajo.nombre}
        </h1>
        {desc && (
          <p className="text-gray-400 text-sm italic tracking-wide mb-4">{desc}</p>
        )}
        <Link
          to={`/galeria/${categoriaSlug}`}
          className="text-pink-300 text-xs uppercase tracking-widest hover:text-pink-700 transition-colors"
        >
          ← Volver a {nombre}
        </Link>
      </div>

      {/* Grilla de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {fotosVisibles.map((foto, i) => (
          <div
            key={foto}
            className="aspect-square overflow-hidden rounded bg-pink-50 cursor-pointer"
            onClick={() => setLightbox(i)}
          >
            <img
              src={imgUrl(foto)}
              alt={`${nombre} ${trabajo.nombre} en Zona Sur Buenos Aires - Foto ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {visibleCount < trabajo.fotos.length && (
        <div ref={sentinelRef} className="h-12" aria-hidden="true" />
      )}

      {/* CTA */}
      <div className="my-20 py-16 px-10 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 shadow-[0_18px_42px_rgba(141,26,68,0.08)] rounded-3xl text-center">
        <h3 className="font-playfair text-pink-700 text-3xl font-light mb-4">
          ¿Te gustó lo que viste?
        </h3>
        <p className="text-gray-600 text-base mb-8 leading-relaxed">
          Reservá tu sesión de {nombre.toLowerCase()} y capturemos juntas tu momento especial en Zona Sur Buenos Aires.
        </p>
        <Link
          to="/contacto"
          className="btn-premium-primary inline-block px-10 py-4 text-sm font-semibold"
        >
          Reservar sesión
        </Link>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-6 text-white text-5xl font-thin leading-none hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={() => setLightbox(null)}
          >×</button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl font-thin hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={e => { e.stopPropagation(); setLightbox(l => (l !== null && l > 0) ? l - 1 : l); }}
          >‹</button>

          <img
            src={imgUrl(trabajo.fotos[lightbox])}
            alt={`Foto ${lightbox + 1}`}
            loading="eager"
            decoding="async"
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl font-thin hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={e => { e.stopPropagation(); setLightbox(l => (l !== null && l < trabajo.fotos.length - 1) ? l + 1 : l); }}
          >›</button>

          <div className="absolute bottom-5 text-white/50 text-sm text-shadow-md">
            {lightbox + 1} / {trabajo.fotos.length}
          </div>
        </div>
      )}
    </div>
  );
}
