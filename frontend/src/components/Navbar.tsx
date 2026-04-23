import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({ logo_url: '', nombre_marca: 'Melina Diaz' });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    fetch(`${import.meta.env.VITE_API_URL}/api/configuracion`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => console.log("Usando config por defecto"));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname === '/contacto') return null;

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/galeria/infantil', label: 'Infantil' },
    { to: '/galeria/quince', label: '15 Años' },
    { to: '/galeria/bodas', label: 'Bodas' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/contacto', label: 'Contacto' },
  ];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-8'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
        
        <div className={`transition-all duration-500 flex items-center ${
          scrolled ? 'translate-x-0' : 'absolute left-1/2 -translate-x-1/2'
        }`}>
          <Link to="/" className="flex items-center">
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt={config.nombre_marca}
                className="transition-all duration-500 object-contain"
                style={{ height: scrolled ? '40px' : '70px' }}
              />
            ) : (
              <span className={`font-playfair font-bold uppercase tracking-tighter ${
                scrolled ? 'text-xl text-gray-800' : 'text-3xl text-white drop-shadow-md'
              }`}>
                {config.nombre_marca}
              </span>
            )}
          </Link>
        </div>

        <nav className={`hidden md:flex items-center gap-8 transition-all duration-500 ${
          scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                font-montserrat text-[10px] font-bold uppercase tracking-[0.2em] transition-colors
                ${isActive ? 'text-pink-600' : 'text-gray-800 hover:text-pink-500'}
              `}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* RESERVAR */}
        <div className={`hidden md:block transition-all duration-500 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}>
          <a href="https://wa.me/5491176348089" className="bg-pink-600 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-pink-700 shadow-lg">
            Reservar
          </a>
        </div>

        {/* MOBILE TOGGLE */}
        <button onClick={() => setOpen(!open)} className={`md:hidden p-2 ${scrolled ? 'text-gray-800' : 'text-white'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? <path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/> : <path d="M4 6h16M4 12h16M4 18h16" strokeWidth={2}/>}
          </svg>
        </button>
      </div>
    </header>
  );
}