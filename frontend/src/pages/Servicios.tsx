import { Link } from 'react-router-dom';
import { useServicios } from '../hooks/useApi';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

export default function Servicios() {
  const { servicios, loading } = useServicios();

  return (
    <>
      <h2 className="font-playfair text-3xl text-center text-pink-950 font-light mt-10 mb-2">
        Nuestros Servicios ✨
      </h2>
      <p className="text-center text-gray-400 text-xs tracking-[3px] uppercase mb-12">
        Todo lo que ofrecemos
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-pink-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {servicios.map((s, idx) => {
            const isLast = idx === servicios.length - 1;
            const isOdd  = servicios.length % 2 !== 0;
            return (
              <div
                key={s.nombre}
                className={`group flex flex-col rounded-[26px] border border-pink-100 bg-[#fffdfd] p-8 shadow-[0_16px_36px_rgba(141,26,68,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(141,26,68,0.14)] sm:p-8
                  ${isLast && isOdd ? 'sm:col-span-2 sm:max-w-[430px] sm:mx-auto' : ''}`}
              >
                {/* Fotos del servicio */}
                {s.fotos.length > 0 && (
                  <div
                    className="grid gap-2 mb-6 h-40"
                    style={{ gridTemplateColumns: `repeat(${Math.min(s.fotos.length, 3)}, 1fr)` }}
                  >
                    {s.fotos.slice(0, 3).map(foto => (
                      <img
                        key={foto}
                        src={`${R2}/${foto}`}
                        alt={s.nombre}
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                )}

                <div className="mb-4 h-px w-12 bg-pink-200 transition-all duration-300 ease-out group-hover:w-16 group-hover:bg-pink-400" />
                <h3 className="font-playfair text-pink-950 text-2xl font-light mb-4">{s.nombre}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light flex-grow">{s.descripcion}</p>
                <Link
                  to="/contacto"
                  className="btn-premium-primary mt-8 px-10 py-4 text-center text-sm font-semibold"
                >
                  Reservar sesión
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
