import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const DEFAULT_LOGO = 'https://imagenes.melinadiazfotografia.com.ar/logo.webp';
const API_BASE     = import.meta.env.VITE_API_URL || '';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [nombreMarca, setNombreMarca] = useState('Melina Diaz Fotografía');
  const [whatsapp, setWhatsapp] = useState('5491176348089');
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const TOP_LOCK = 80;
    const ENTER_SCROLL = 170;
    const LEAVE_SCROLL = 110;
    const MIN_DELTA = 10;

    lastScrollY.current = Math.max(window.scrollY, 0);
    setScrolled(lastScrollY.current > ENTER_SCROLL);

    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        const delta = y - lastScrollY.current;

        if (y < TOP_LOCK) {
          setScrolled(false);
          lastScrollY.current = y;
        } else if (Math.abs(delta) >= MIN_DELTA) {
          if (delta > 0 && y > ENTER_SCROLL) setScrolled(prev => prev ? prev : true);
          if (delta < 0 && y < LEAVE_SCROLL) setScrolled(prev => prev ? false : prev);
          lastScrollY.current = y;
        }

        rafId.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if (data?.nombre_marca) setNombreMarca(data.nombre_marca);
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/contacto') return null;

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/galeria/infantil', label: 'Book Infantil' },
    { to: '/galeria/quince', label: '15 Años' },
    { to: '/galeria/bodas', label: 'Bodas' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/contacto', label: 'Contacto' },
  ];

  return (
    <header
      className={`sticky top-0 w-full z-50 bg-[#FFF6F8]/95 backdrop-blur-md border-b border-[#ead2d9] shadow-[0_8px_26px_rgba(138,79,100,0.08)] transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_12px_32px_rgba(138,79,100,0.13)]' : 'shadow-[0_8px_26px_rgba(138,79,100,0.08)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop top state: logo centrado arriba, menu abajo */}
        <div
          aria-hidden={scrolled}
          className={`hidden md:flex flex-col items-center justify-center overflow-hidden transition-[max-height,opacity,padding] duration-500 ease-out will-change-[max-height,opacity] ${
          scrolled ? 'max-h-0 opacity-0 py-0 pointer-events-none' : 'max-h-72 opacity-100 py-3'
        }`}>
          <Link to="/" className="mb-2 transition-all duration-300">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-24 lg:h-28 w-auto object-contain"
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
                    isActive ? 'text-[#8A4F64]' : 'text-[#9B5F73] hover:text-[#C76B8A]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Desktop scrolled: fila horizontal, logo izquierda y menu derecha */}
        <div
          aria-hidden={!scrolled}
          className={`hidden md:flex items-center justify-between overflow-hidden transition-[max-height,height,opacity] duration-500 ease-out will-change-[max-height,opacity] ${
          scrolled ? 'max-h-16 h-14 opacity-100' : 'max-h-0 h-0 opacity-0 pointer-events-none'
        }`}>
          <Link to="/" className="transition-all duration-300 pl-1">
            <img
              src={logoUrl}
              alt={nombreMarca}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-10 lg:h-11 w-auto max-w-[190px] object-contain"
            />
          </Link>
          <div className="flex items-center gap-5">
            <nav className="flex items-center gap-4 lg:gap-5">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                      isActive ? 'text-[#8A4F64]' : 'text-[#9B5F73] hover:text-[#C76B8A]'
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
              className="bg-[#E96F9A] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_12px_24px_rgba(201,80,124,0.22)] hover:bg-[#D95F89] transition-all duration-300"
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
            className="p-2 text-[#8A4F64] hover:text-[#C76B8A] transition-colors"
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

      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-[#FFF6F8] border-t border-[#ead2d9] ${
        open ? 'max-h-96' : 'max-h-0'
      }`}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-8 py-4 text-xs font-bold uppercase tracking-widest border-b border-gray-50 transition-colors ${
                isActive ? 'text-[#8A4F64] bg-[#F8EDEE]' : 'text-[#9B5F73] hover:bg-[#F8EDEE] hover:text-[#C76B8A]'
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
          className="block px-8 py-4 text-xs font-bold uppercase tracking-widest text-[#C76B8A] hover:bg-[#F8EDEE]"
        >
          Reservar sesión
        </a>
      </div>
    </header>
  );
}
