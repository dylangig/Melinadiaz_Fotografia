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
  const compactRef = useRef(false);
  const rafId = useRef<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const NORMAL_UNTIL = 80;
    const COMPACT_FROM = 140;
    const MIN_DELTA = 12;
    const getScrollTop = () => Math.max(
      window.scrollY || 0,
      document.documentElement?.scrollTop || 0,
      document.body?.scrollTop || 0
    );

    lastScrollY.current = getScrollTop();
    compactRef.current = lastScrollY.current > COMPACT_FROM;
    setScrolled(compactRef.current);

    const updateCompactState = () => {
      const y = getScrollTop();
      const delta = y - lastScrollY.current;

      if (y > COMPACT_FROM && !compactRef.current) {
        compactRef.current = true;
        setScrolled(true);
      } else if (y < NORMAL_UNTIL && compactRef.current) {
        compactRef.current = false;
        setScrolled(false);
      }

      if (Math.abs(delta) >= MIN_DELTA || y > COMPACT_FROM || y < NORMAL_UNTIL) {
        lastScrollY.current = y;
      }
    };

    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        updateCompactState();
        rafId.current = null;
      });
    };

    const scrollOptions: AddEventListenerOptions = { passive: true, capture: true };
    const scrollTargets: EventTarget[] = [
      window,
      document,
      document.documentElement,
      document.body,
    ].filter(Boolean);

    scrollTargets.forEach(target => {
      target.addEventListener('scroll', handleScroll, scrollOptions);
    });
    updateCompactState();

    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if (data?.nombre_marca) setNombreMarca(data.nombre_marca);
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
      })
      .catch(() => {});

    return () => {
      scrollTargets.forEach(target => {
        target.removeEventListener('scroll', handleScroll, scrollOptions);
      });
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
    <>
    <div className="hidden h-40 md:block" aria-hidden="true" />
    <div className="h-16 md:hidden" aria-hidden="true" />
    <header
      className={`fixed top-0 left-0 w-full z-50 bg-[#FFF6F8]/75 backdrop-blur-md border-b border-rose-100 transition-[box-shadow,background-color] duration-300 ease-out ${
        scrolled ? 'shadow-[0_14px_34px_rgba(138,79,100,0.14)]' : 'shadow-none'
      }`}
    >
      <div className={`mx-auto transition-[max-width,padding] duration-300 ease-out ${
        scrolled ? 'max-w-none px-6 sm:px-8 lg:px-10' : 'max-w-7xl px-4 sm:px-6'
      }`}>
        {/* Desktop */}
        <div
          className={`hidden md:flex overflow-hidden transition-[height,padding] duration-300 ease-out ${
            scrolled
              ? 'h-16 flex-row items-center justify-between py-2'
              : 'h-40 flex-col items-center justify-center py-3'
          }`}
        >
          <Link to="/" className={`flex items-center transition-all duration-300 ${scrolled ? '' : 'mb-2'}`}>
            <img
              src={logoUrl}
              alt={nombreMarca}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className={`w-auto object-contain transition-[height,max-width] duration-300 ease-out ${
                scrolled ? 'h-12 lg:h-14 max-w-[110px]' : 'h-24 lg:h-28 max-w-none'
              }`}
            />
          </Link>
          <div className={`flex items-center transition-all duration-300 ${scrolled ? 'justify-end gap-6' : 'justify-center'}`}>
            <nav className={`flex items-center ${scrolled ? 'gap-5 lg:gap-7' : 'gap-8'}`}>
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `${scrolled ? 'text-[10px] lg:text-[11px] tracking-[0.15em]' : 'text-[11px] tracking-[0.18em]'} font-bold uppercase transition-colors ${
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
              className={`bg-[#E96F9A] text-white rounded-full font-bold uppercase tracking-widest shadow-[0_12px_24px_rgba(201,80,124,0.22)] hover:bg-[#D95F89] transition-all duration-300 ${
                scrolled ? 'px-5 py-2.5 text-[10px]' : 'hidden'
              }`}
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
              loading="eager"
              decoding="async"
              fetchPriority="high"
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
    </>
  );
}
