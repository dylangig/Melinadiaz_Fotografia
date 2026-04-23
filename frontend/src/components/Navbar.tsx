import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Ocultar navbar en la página de contacto (mantiene el diseño lead original)
  if (location.pathname === '/contacto') return null;

  const links = [
    { to: '/',          label: 'Inicio' },
    { to: '/galeria/infantil', label: 'Book Infantil' },
    { to: '/galeria/quince',   label: '15 Años' },
    { to: '/galeria/bodas',    label: 'Bodas' },
    { to: '/servicios',        label: 'Servicios' },
    { to: '/contacto',         label: 'Contacto' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-pink-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://imagenes.melinadiazfotografia.com.ar/logo.webp"
            alt="Melina Diaz Fotografía"
            className="h-10 w-auto"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-playfair text-pink-700 text-lg hidden sm:block">
            Melina Diaz
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-colors
                ${isActive
                  ? 'bg-pink-50 text-pink-700'
                  : 'text-gray-600 hover:text-pink-700 hover:bg-pink-50'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* WhatsApp rápido desktop */}
        <a
          href="https://wa.me/5491176348089"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 bg-pink-700 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-pink-900 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Reservar
        </a>

        {/* Botón hamburguesa mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-pink-50"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            }
          </svg>
        </button>
      </div>

      {/* Menú mobile */}
      {open && (
        <div className="md:hidden bg-white border-t border-pink-100 px-6 py-4 flex flex-col gap-2">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `py-2 px-3 rounded-lg text-sm font-semibold transition-colors
                ${isActive ? 'bg-pink-50 text-pink-700' : 'text-gray-600'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
