import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      {/* Sin padding ni max-width — cada página gestiona su propio contenedor.
          El Navbar es fixed, así que el Hero de Inicio puede mostrarse debajo
          del navbar transparente intencionalmente. */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
