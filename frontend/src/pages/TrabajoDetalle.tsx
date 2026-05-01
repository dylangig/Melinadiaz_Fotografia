import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTrabajoDetalle, useTrabajos } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

const NOMBRES: Record<string, string> = {
  infantil: 'Book Infantil',
  quince:   '15 Años',
  bodas:    'Bodas',
};

export default function TrabajoDetalle() {
  const { categoriaSlug = '', trabajoSlug = '' } = useParams();
  const { trabajo, loading, error } = useTrabajoDetalle(categoriaSlug, trabajoSlug);
  const { trabajos } = useTrabajos(categoriaSlug);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const nombre = NOMBRES[categoriaSlug] ?? categoriaSlug;
  const totalFotos = trabajo?.fotos.length ?? 0;

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

  useEffect(() => {
    if (lightbox === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightbox(null);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setLightbox(current => (current !== null && current > 0 ? current - 1 : current));
        return;
      }

      if (event.key === 'ArrowRight') {
        setLightbox(current => (current !== null && current < totalFotos - 1 ? current + 1 : current));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, totalFotos]);

  useEffect(() => {
    if (!trabajo) return;

    const title = `${trabajo.nombre} – ${nombre} | Melina Diaz Fotografía`;
    const description = trabajo.descripcion?.trim()
      || `Sesión ${trabajo.nombre} de ${nombre} en Zona Sur, Buenos Aires.`;
    const firstPhoto = trabajo.fotos[0]
      ? `${R2}/${categoriaSlug}/${trabajoSlug}/${trabajo.fotos[0]}`
      : '';

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    if (firstPhoto) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', firstPhoto);
    }
  }, [trabajo, nombre, categoriaSlug, trabajoSlug]);

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
  const subtituloSesion = `${trabajo.nombre} - ${nombre}${trabajo.locacion ? ` - ${trabajo.locacion}` : ''}`;
  const fotosVisibles = trabajo.fotos.slice(0, visibleCount);
  const otrasSesiones = trabajos
    .filter(item => item.slug !== trabajo.slug && item.fotos.length > 0)
    .slice(0, 3);
  const cerrarLightbox = () => setLightbox(null);
  const irFotoAnterior = () => setLightbox(current => (current !== null && current > 0 ? current - 1 : current));
  const irFotoSiguiente = () => setLightbox(current => (current !== null && current < trabajo.fotos.length - 1 ? current + 1 : current));

  const handleLightboxClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    cerrarLightbox();
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const isHorizontalSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (!isHorizontalSwipe) return;
    didSwipeRef.current = true;
    event.stopPropagation();

    if (deltaX > 0) {
      irFotoAnterior();
    } else {
      irFotoSiguiente();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10">

      {/* Encabezado */}
      <div className="text-center mb-10">
        <nav className="mb-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700" aria-label="Breadcrumb">
          <Link to="/" className="text-gray-700 transition-colors hover:text-pink-700">
            Inicio
          </Link>
          <span className="text-pink-300" aria-hidden="true">&gt;</span>
          <Link to={`/galeria/${categoriaSlug}`} className="text-gray-700 transition-colors hover:text-pink-700">
            {nombre}
          </Link>
          <span className="text-pink-300" aria-hidden="true">&gt;</span>
          <span className="text-pink-700">{trabajo.nombre}</span>
        </nav>
        <h1 className="font-playfair text-pink-700 font-light tracking-[3px] uppercase text-3xl mb-2">
          {trabajo.nombre}
        </h1>
        <p className="text-pink-700/70 text-xs uppercase tracking-[0.24em] mb-4">
          {subtituloSesion}
        </p>
        <Link
          to={`/galeria/${categoriaSlug}`}
          className="text-pink-300 text-xs uppercase tracking-widest hover:text-pink-700 transition-colors"
        >
          ← Volver a {nombre}
        </Link>
      </div>

      {desc && (
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-gray-600 text-sm leading-relaxed sm:text-base">
            {desc}
          </p>
        </div>
      )}

      {/* Grilla de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {fotosVisibles.map((foto, i) => (
          <div
            key={foto}
            className="group relative aspect-square overflow-hidden rounded bg-pink-50 cursor-pointer transition-all duration-200 hover:shadow-xl"
            onClick={() => setLightbox(i)}
          >
            <img
              src={imgUrl(foto)}
              alt={`Foto de sesión ${trabajo.nombre} – ${nombre} - ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </div>
        ))}
      </div>

      {visibleCount < trabajo.fotos.length && (
        <div ref={sentinelRef} className="h-12" aria-hidden="true" />
      )}

      {/* CTA */}
      <div className="my-20 py-16 px-10 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 shadow-[0_18px_42px_rgba(141,26,68,0.08)] rounded-3xl text-center">
        <h3 className="font-playfair text-pink-700 text-3xl font-light mb-4">
          ¿Querés una sesión igual de mágica?
        </h3>
        <Link
          to="/contacto"
          className="btn-premium-primary mt-4 inline-block px-10 py-4 text-sm font-semibold"
        >
          Reservá tu sesión
        </Link>
      </div>

      {otrasSesiones.length > 0 && (
        <section className="mb-20">
          <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mb-8">
            Otras sesiones que te pueden gustar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {otrasSesiones.map(item => (
              <Link
                key={item.slug}
                to={`/galeria/${categoriaSlug}/${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-[0_14px_32px_rgba(141,26,68,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden bg-pink-50">
                  <img
                    src={`${R2}/${categoriaSlug}/${item.slug}/${item.fotos[0]}`}
                    alt={`Foto de sesión ${item.nombre} – ${nombre}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 text-center">
                  <p className="font-playfair text-lg text-pink-700 font-light">
                    {item.nombre}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={handleLightboxClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="absolute top-5 left-6 text-white text-5xl font-thin leading-none hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={cerrarLightbox}
          >×</button>

          <div className="absolute top-5 right-6 rounded-full bg-black/35 px-4 py-2 text-sm text-white/80 text-shadow-md">
            {lightbox + 1} / {trabajo.fotos.length}
          </div>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-6xl font-thin hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={e => { e.stopPropagation(); irFotoAnterior(); }}
          >‹</button>

          <img
            src={imgUrl(trabajo.fotos[lightbox])}
            alt={`Foto de sesión ${trabajo.nombre} – ${nombre} - ${lightbox + 1}`}
            loading="eager"
            decoding="async"
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            onClick={e => {
              didSwipeRef.current = false;
              e.stopPropagation();
            }}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-6xl font-thin hover:text-pink-300 transition-colors text-shadow-lg"
            onClick={e => { e.stopPropagation(); irFotoSiguiente(); }}
          >›</button>

        </div>
      )}
    </div>
  );
}
