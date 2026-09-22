# Melina Diaz Fotografía 📸

Sitio web profesional para **Melina Diaz Fotografía**: portfolio y reserva de sesiones de fotografía — Book Infantil, 15 Años y Bodas — en Zona Sur, Buenos Aires.

🌐 **Producción:** https://melinadiazfotografia.com.ar

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| API | Cloudflare Worker + D1 + R2 (dev local con `wrangler dev`) |
| Deploy frontend | Cloudflare Pages (auto-deploy desde `main`) |
| Chatbot | Widget [@n8n/chat](https://www.npmjs.com/package/@n8n/chat) conectado a un workflow de n8n |

## Estructura

```
Melinadiaz_Fotografia/
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # Navbar, Footer, Layout, ChatbotN8n
│   │   ├── pages/          # Inicio, Categoria, TrabajoDetalle, Servicios, SobreMi, Contacto, Admin
│   │   ├── hooks/          # useApi, useSEO, useFavicon
│   │   └── context/        # ConfigContext (marca, logo, WhatsApp...)
│   └── public/             # Assets estáticos (fallbacks, flores del footer...)
├── worker/                 # Cloudflare Worker (API + D1 + R2)
│   └── migrations/         # Migraciones de D1
└── DEVELOPMENT.md          # Guía de desarrollo local
```
## Licencia

© Melina Diaz Fotografía — Todos los derechos reservados.
