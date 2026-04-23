import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      {/* Eliminado el max-w para permitir secciones full-width */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}