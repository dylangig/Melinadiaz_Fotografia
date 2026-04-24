import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const DEFAULT_LOGO = 'https://imagenes.melinadiazfotografia.com.ar/logo.webp';
const API_BASE     = import.meta.env.VITE_API_URL || '';

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [open,        setOpen]        = useState(false);
  const [logoUrl,     setLogoUrl]     = useState(DEFAULT_LOGO);
  const [nombreMarca, setNombreMarca] = useState('Melina Diaz Fotografía');
  const [whatsapp,    setWhatsapp]    = useState('5491176348089');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });

    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        if (data?.logo_url)     setLogoUrl(data.logo_url);
        if (data?.nombre_marca) setNombreMarca(data.nombre_marca);
        if (data?.whatsapp)     setWhatsapp(data.whatsapp);
      })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname === '/contacto') return null;

  const links = [
    { to: '/',                 label: 'Inicio'        },
    { to: '/galeria/infantil', label: 'Book Infantil' },
    { to: '/galeria/quince',   label: '15 Años'       },
    { to: '/galeria/bodas',    label: 'Bodas'         },
    { to: '/servicios',        label: 'Servicios'     },
    { to: '/contacto',         label: 'Contacto'      },
  ];

  return (
    <>
      {/* ── NAVBAR ─────────────────────────────────────────────────────────
          Siempre visible con fondo blanco sólido.
          El hero empieza DEBAJO del navbar (no debajo del hero).         */}
      <header
        className={`fixed top-0 w-full z-50 bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo — siempre a la izquierda, tamaño fijo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Menú desktop */}
          <nav className="hidden md:flex items-center gap-7">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-[11px] font-bold uppercase tracking-[0.18em] transition-colors font-montserrat ${
                    isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-500'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Botón reservar desktop */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block bg-pink-700 text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-pink-900 transition-colors shadow-md shadow-pink-700/20"
          >
            Reservar
          </a>

          {/* Hamburguesa mobile */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setOpen(v => !v)}
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Menú mobile desplegable */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-pink-50 ${
          open ? 'max-h-96' : 'max-h-0'
        }`}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
          >
            Reservar sesión →
          </a>
        </div>
      </header>

      {/* Espaciador: empuja el contenido debajo del navbar fijo (h-16 = 64px) */}
      <div className="h-16" />
    </>
  );
}
