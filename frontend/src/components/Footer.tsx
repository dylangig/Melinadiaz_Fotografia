import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  if (location.pathname === '/contacto') return null;

  return (
    <footer className="bg-pink-950 text-pink-50 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 min-[769px]:grid-cols-3 gap-10">

        {/* Marca */}
        <div>
          <h3 className="font-playfair text-2xl font-light mb-4 text-white">Melina Diaz</h3>
          <p className="text-pink-100 text-sm leading-relaxed">
            Fotografía profesional en Zona Sur Buenos Aires.<br />
            Capturando momentos únicos con sensibilidad y pasión.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-bold tracking-widest uppercase text-pink-50 mb-4">Galerías</h4>
          <ul className="space-y-2 text-sm text-pink-100">
            {[
              { to: '/galeria/infantil', label: 'Book Infantil' },
              { to: '/galeria/quince',   label: '15 Años' },
              { to: '/galeria/bodas',    label: 'Bodas' },
              { to: '/servicios',        label: 'Servicios' },
              { to: '/contacto',         label: 'Contacto' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="lining-nums hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h4 className="text-xs font-bold tracking-widest uppercase text-pink-50 mb-4">Contacto</h4>
          <ul className="space-y-4 text-sm text-pink-100">
            <li>
              <a
                href="https://wa.me/5491176348089"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                +54 9 11 7634-8089
              </a>
            </li>
            <li className="text-pink-100 text-xs">📍 Zona Sur, Buenos Aires</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rose-deep text-center py-4 text-pink-100/80 text-xs">
        © {new Date().getFullYear()} Melina Diaz Fotografía — Todos los derechos reservados
      </div>
    </footer>
  );
}
