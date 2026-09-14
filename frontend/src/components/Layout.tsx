import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
// WhatsAppButton desactivado a pedido: el chatbot de n8n es ahora el único
// canal flotante y deriva a WhatsApp con mensaje pre-armado.
// import WhatsAppButton from './WhatsAppButton';
import ChatbotN8n from './ChatbotN8n';

export default function Layout() {
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
