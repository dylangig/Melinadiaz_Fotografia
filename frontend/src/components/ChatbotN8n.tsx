import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '@n8n/chat/style.css';
import './Chatbot.css';

const FALLBACK_WEBHOOK =
  'https://dylangig.app.n8n.cloud/webhook/ef178df2-307b-4a0f-a8fc-a02d3db14a6c/chat';

// Evita doble montaje en StrictMode / navegación SPA
let chatInicializado = false;

// Logo fijo del chat (foto en public/assets). Va con object-cover en círculo,
// así que una foto apaisada como esta se recorta a los costados sin problema.
const CHAT_LOGO = '/assets/chatbot-logo.jpg';

function aplicarLogoChat() {
  document
    .querySelector<HTMLElement>('.n8n-chat')
    ?.style.setProperty('--chatbot-logo-url', `url("${CHAT_LOGO}")`);
}

export default function ChatbotN8n() {
  const location = useLocation();
  const pathname = location.pathname;

  // Ocultar en contacto (tiene formulario propio) y en admin
  const oculto = pathname === '/contacto' || pathname.startsWith('/admin');

  useEffect(() => {
    if (oculto) return;

    const webhookUrl =
      import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || FALLBACK_WEBHOOK;
    if (!webhookUrl) return;

    // Si ya existe el widget en el DOM, no volver a crearlo
    if (chatInicializado && document.querySelector('.n8n-chat')) return;

    let cancelado = false;
    (async () => {
      try {
        // Import dinámico para no inflar el bundle inicial
        const { createChat } = await import('@n8n/chat');
        if (cancelado) return;
        createChat({
          webhookUrl,
          mode: 'window',
          showWelcomeScreen: false,
          loadPreviousSession: true,
          chatInputKey: 'chatInput',
          chatSessionKey: 'sessionId',
          defaultLanguage: 'en',
          initialMessages: [
            '¡Hola! Soy el asistente de Melina Diaz Fotografía 📸',
            '¿Te ayudo a elegir tu sesión? Hacemos Book Infantil, 15 Años y Bodas en Zona Sur de Buenos Aires.',
          ],
          i18n: {
            en: {
              title: 'Melina Diaz 📸',
              subtitle: 'Online · Te respondemos hoy',
              footer: '',
              getStarted: 'Nueva conversación',
              inputPlaceholder: 'Escribí tu consulta...',
              closeButtonTooltip: 'Cerrar',
            },
          },
          metadata: {
            fuente: 'web-melinadiazfotografia',
            pagina: window.location.pathname,
          },
        });
        chatInicializado = true;
        aplicarLogoChat();
      } catch (error) {
        console.error('Error cargando chatbot n8n:', error);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [oculto]);

  // Ocultar/mostrar el launcher cuando cambia la ruta sin desmontar el widget
  useEffect(() => {
    const wrapper = document.querySelector<HTMLElement>('.chat-window-wrapper');
    if (wrapper) wrapper.style.display = oculto ? 'none' : '';
    if (!oculto) aplicarLogoChat();
  }, [oculto, pathname]);

  return null;
}
