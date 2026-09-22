import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useCategorias } from '../hooks/useApi';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lastScrollY = useRef(0);
  const compactRef = useRef(false);
  const rafId = useRef<number | null>(null);
  const galeriasRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { logo_url, nombre_marca, whatsapp } = useConfig();
  const { categorias } = useCategorias();
  const [galeriasOpen, setGaleriasOpen] = useState(false);

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

    return () => {
      scrollTargets.forEach(target => {
        target.removeEventListener('scroll', handleScroll, scrollOptions);
      });
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setGaleriasOpen(false);
  }, [location.pathname]);

  // Cerrar el desplegable de Galerías al hacer click afuera o con Escape
  useEffect(() => {
    if (!galeriasOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (galeriasRef.current && !galeriasRef.current.contains(e.target as Node)) {
        setGaleriasOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGaleriasOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [galeriasOpen]);

  // Isolated landing: en contacto no se muestra la navbar global
  if (location.pathname === '/contacto') return null;
  const isHome = location.pathname === '/';

  const staticLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/sobre-mi', label: 'Sobre mí' },
    { to: '/contacto', label: 'Contacto' },
  ];

  // Menú mobile: estáticas + todas las categorías desde la API
  const links = [
    { to: '/', label: 'Inicio' },
    ...categorias.map(cat => ({ to: `/galeria/${cat.slug}`, label: cat.nombre })),
    { to: '/servicios', label: 'Servicios' },
    { to: '/sobre-mi', label: 'Sobre mí' },
    { to: '/contacto', label: 'Contacto' },
  ];

  const galeriasActiva = location.pathname.startsWith('/galeria');

  return (
    <>
    <div className="hidden h-36 min-[769px]:block" aria-hidden="true" />
    <div className="h-16 min-[769px]:hidden" aria-hidden="true" />
    <header
      className={`fixed top-0 left-0 w-full z-50 border-b border-[#F3B8CA] transition-all duration-300 ease-out ${
        scrolled
          ? 'bg-[#FFF3F6]/85 backdrop-blur-md shadow-[0_10px_30px_rgba(159,18,57,0.08)]'
          : 'bg-[#FFF3F6] shadow-none'
      }`}
    >
      <div className={`mx-auto transition-[max-width,padding] duration-300 ease-out ${
        scrolled ? 'max-w-none px-6 sm:px-8 lg:px-10' : 'max-w-7xl px-4 sm:px-6'
      }`}>
        {/* Desktop */}
        <div
          className={`hidden min-[769px]:flex overflow-hidden transition-[height,padding] duration-300 ease-out ${
            scrolled
              ? 'h-16 flex-row items-center justify-between py-2'
              : 'h-36 flex-col items-center justify-center py-2'
          }`}
        >
          <Link to="/" className={`flex items-center transition-all duration-300 ease-out ${scrolled ? '' : 'mb-1'}`}>
            <img
              src={logo_url}
              alt={nombre_marca}
              loading="eager"
              decoding="async"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className={`w-auto object-contain transition-[height,max-width] duration-300 ease-out ${
                scrolled ? 'h-12 lg:h-14 max-w-[110px]' : 'h-22 lg:h-24 max-w-none'
              }`}
            />
          </Link>
          <div className={`flex items-center transition-all duration-300 ease-out ${scrolled ? 'justify-end gap-6' : 'justify-center'}`}>
            <nav className={`flex items-center transition-[gap] duration-300 ease-out ${scrolled ? 'gap-6 lg:gap-8' : 'gap-8'}`}>
              {staticLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `relative pb-1 leading-tight font-medium uppercase tracking-wide lining-nums transition-colors duration-300 ease-out after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-pink-500 after:transition-all after:duration-300 after:ease-out ${
                      scrolled ? 'text-sm lg:text-base' : 'text-base'
                    } ${
                      isActive
                        ? 'text-pink-500 after:w-full'
                        : 'text-[#2A2A2A] after:w-0 hover:text-pink-500 hover:after:w-full'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}

              {/* Desplegable de Galerías (categorías dinámicas desde la API) */}
              {categorias.length > 0 && (
                <div className="relative" ref={galeriasRef}>
                  <button
                    type="button"
                    onClick={() => setGaleriasOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={galeriasOpen}
                    className={`relative pb-1 leading-tight font-medium uppercase tracking-wide lining-nums transition-colors duration-300 ease-out after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-pink-500 after:transition-all after:duration-300 after:ease-out cursor-pointer ${
                      scrolled ? 'text-sm lg:text-base' : 'text-base'
                    } ${
                      galeriasActiva
                        ? 'text-pink-500 after:w-full'
                        : 'text-[#2A2A2A] after:w-0 hover:text-pink-500 hover:after:w-full'
                    }`}
                  >
                    Galerías
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 10 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`inline-block ml-1 h-2.5 w-2.5 transition-transform duration-200 ${galeriasOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {galeriasOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-xl border border-[#F3B8CA] bg-[#FFF3F6] shadow-[0_12px_32px_rgba(159,18,57,0.15)]"
                    >
                      {categorias.map(cat => (
                        <Link
                          key={cat.slug}
                          to={`/galeria/${cat.slug}`}
                          role="menuitem"
                          className={`block px-5 py-3 text-xs font-bold uppercase tracking-widest lining-nums transition-colors ${
                            location.pathname === `/galeria/${cat.slug}`
                              ? 'bg-[#F8EDEE] text-[#D81B60]'
                              : 'text-[#8A3D5A]/85 hover:bg-[#F8EDEE] hover:text-[#D81B60]'
                          }`}
                        >
                          {cat.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-[#E96F9A] text-white rounded-full font-bold uppercase tracking-widest shadow-md hover:bg-[#D95F89] hover:shadow-lg transition-all duration-300 ease-out ${
                scrolled && !isHome ? 'px-6 py-2 text-[10px]' : 'hidden'
              }`}
            >
              Reservar sesión
            </a>
          </div>
        </div>

        {/* Mobile */}
        <div className="h-16 flex items-center justify-between min-[769px]:hidden">
          <Link to="/" className="flex-shrink-0">
            <img
              src={logo_url}
              alt={nombre_marca}
              loading="eager"
              decoding="async"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-10 w-auto object-contain"
            />
          </Link>

          <button
            className="p-2 text-[#8A3D5A] hover:text-[#D81B60] transition-colors"
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

      <div className={`overflow-hidden transition-all duration-300 bg-[#FFF3F6] border-t border-[#F3B8CA] min-[769px]:hidden ${
        open ? 'max-h-[760px]' : 'max-h-0'
      }`}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `block px-8 py-4 text-xs font-bold uppercase tracking-widest lining-nums border-b border-gray-50 transition-colors ${
                isActive ? 'text-[#8A3D5A] bg-[#F8EDEE]' : 'text-[#8A3D5A]/85 hover:bg-[#F8EDEE] hover:text-[#D81B60]'
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
          className="block px-8 py-4 text-xs font-bold uppercase tracking-widest text-[#8A3D5A] hover:bg-[#F8EDEE] hover:text-[#D81B60]"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </header>
    </>
  );
}
