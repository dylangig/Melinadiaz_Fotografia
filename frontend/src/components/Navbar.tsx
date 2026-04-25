import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const DEFAULT_LOGO = 'https://imagenes.melinadiazfotografia.com.ar/logo.webp';
const API_BASE     = import.meta.env.VITE_API_URL || '';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [nombreMarca, setNombreMarca] = useState('Melina Diaz Fotografia');
  const [whatsapp, setWhatsapp] = useState('5491176348089');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });

    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if (data?.nombre_marca) setNombreMarca(data.nombre_marca);
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
      })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/contacto') return null;

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/galeria/infantil', label: 'Book Infantil' },
    { to: '/galeria/quince', label: '15 Anos' },
    { to: '/galeria/bodas', label: 'Bodas' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/contacto', label: 'Contacto' },
  ];

  return (
    <header
      className={`sticky top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-pink-100 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop top state: logo centrado arriba, menu abajo */}
        <div className={`hidden md:flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${
          scrolled ? 'max-h-0 opacity-0 py-0 pointer-events-none' : 'max-h-60 opacity-100 py-4'
        }`}>
          <Link to="/" className="mb-4 transition-all duration-300">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-16 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-8">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-500'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Desktop scrolled: fila horizontal, logo izquierda y menu derecha */}
        <div className={`hidden md:flex items-center justify-between transition-all duration-300 overflow-hidden ${
          scrolled ? 'max-h-20 h-16 opacity-100' : 'max-h-0 h-0 opacity-0 pointer-events-none'
        }`}>
          <Link to="/" className="transition-all duration-300">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-7">
            <nav className="flex items-center gap-6">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                      isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-500'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-700 text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-pink-900 transition-all duration-300"
            >
              Reservar
            </a>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden h-16 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-10 w-auto object-contain"
            />
          </Link>

          <button
            className="p-2 text-gray-700"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-pink-50 ${
        open ? 'max-h-96' : 'max-h-0'
      }`}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-8 py-4 text-xs font-bold uppercase tracking-widest border-b border-gray-50 transition-colors ${
                isActive ? 'text-pink-600 bg-pink-50' : 'text-gray-700 hover:bg-pink-50'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-8 py-4 text-xs font-bold uppercase tracking-widest text-pink-700 hover:bg-pink-50"
        >
          Reservar sesion
        </a>
      </div>
    </header>
  );
}
