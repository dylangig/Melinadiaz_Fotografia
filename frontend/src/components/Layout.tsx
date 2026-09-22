import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotN8n from './ChatbotN8n';
import { useConfig } from '../context/ConfigContext';

export default function Layout() {
  const { recargar } = useConfig();
  const location = useLocation();

  // Refrescar la config al navegar: cambios hechos en el admin (WhatsApp,
  // hero, nombre) se ven sin recargar la página. Al montar comparte el
  // mismo request que ya dispara ConfigProvider.
  useEffect(() => {
    recargar();
  }, [location.pathname, recargar]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <ChatbotN8n />
    </div>
  );
}
