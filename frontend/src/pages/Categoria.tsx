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
      <h1 className="font-playfair text-pink-700 text-center tracking-[3px] uppercase text-3xl mb-10">
        {nombre}
      </h1>

      {/* Grilla */}
      {loading ? (
        <div className="grid grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square rounded-lg bg-pink-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <p className="font-playfair text-white text-xl tracking-[2px] uppercase">{t.nombre}</p>
                    <p className="text-pink-300 text-xs mt-1">{t.año}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="my-20 py-16 px-10 bg-gradient-to-br from-pink-50 to-pink-100 rounded-3xl text-center">
        <h3 className="font-playfair text-pink-700 text-3xl font-light mb-3">
          ¿Querés una sesión como estas?
        </h3>
        <p className="text-gray-600 text-base mb-7 leading-relaxed">
          Consultá disponibilidad y coordinamos tu sesión de {DESCRIPCIONES[categoriaSlug] ?? nombre.toLowerCase()} en Zona Sur Buenos Aires.
        </p>
        <Link
          to="/contacto"
          className="inline-block px-10 py-4 bg-pink-700 text-white rounded-full font-bold text-sm tracking-wide uppercase hover:bg-pink-900 transition-all hover:-translate-y-0.5 shadow-lg shadow-pink-700/30"
        >
          Reservar mi sesión →
        </Link>
      </div>
    </div>
  );
}
