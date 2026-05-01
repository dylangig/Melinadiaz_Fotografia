import { Link, useParams } from 'react-router-dom';
import { useTrabajos } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

const NOMBRES: Record<string, string> = {
  infantil: 'Book Infantil',
  quince:   '15 Años',
  bodas:    'Bodas',
};

const DESCRIPCIONES: Record<string, string> = {
  infantil: 'books infantiles',
  quince:   '15 años',
  bodas:    'bodas',
};

export default function Categoria() {
  const { categoriaSlug = '' } = useParams();
  const { trabajos, loading }  = useTrabajos(categoriaSlug);
  const nombre = NOMBRES[categoriaSlug] ?? categoriaSlug;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10">

      {/* Título */}
      <h1 className="font-playfair text-pink-700 text-center tracking-[3px] uppercase lining-nums text-3xl mb-10">
        {nombre}
      </h1>

      {/* Grilla */}
      {loading ? (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square rounded-lg bg-pink-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {trabajos.map((t, idx) => {
            const isLast = idx === trabajos.length - 1;
            const isOdd  = trabajos.length % 2 !== 0;
            return (
              <Link
                key={t.slug}
                to={`/galeria/${categoriaSlug}/${t.slug}`}
                style={{ textDecoration: 'none' }}
                className={isLast && isOdd ? 'col-span-2 max-w-[calc(50%-10px)] mx-auto w-full' : ''}
              >
                <div className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer">
                  <img
                    src={`${R2}/${categoriaSlug}/${t.slug}/${t.fotos[0] ?? ''}`}
                    alt={`Portada ${t.nombre} — ${nombre} en Zona Sur Buenos Aires`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <p className="font-playfair text-white text-xl tracking-[2px] uppercase lining-nums text-shadow-lg">{t.nombre}</p>
                    <p className="text-pink-300 text-xs mt-2">{t.año}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="my-20 py-16 px-10 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 shadow-[0_18px_42px_rgba(141,26,68,0.08)] rounded-3xl text-center">
        <h3 className="font-playfair text-pink-700 text-3xl font-light mb-4">
          ¿Querés una sesión como estas?
        </h3>
        <p className="text-gray-600 text-base mb-8 leading-relaxed">
          Consultá disponibilidad y coordinamos tu sesión de {DESCRIPCIONES[categoriaSlug] ?? nombre.toLowerCase()} en Zona Sur Buenos Aires.
        </p>
        <Link
          to="/contacto"
          className="btn-premium-primary inline-block px-10 py-4 text-sm font-semibold"
        >
          Reservar sesión
        </Link>
      </div>
    </div>
  );
}
