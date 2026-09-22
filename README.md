# Melina Diaz Fotografía 📸

Sitio web profesional para **Melina Diaz Fotografía**: portfolio y reserva de sesiones de fotografía — Book Infantil, 15 Años y Bodas — en Zona Sur, Buenos Aires.

🌐 **Producción:** https://melinadiazfotografia.com.ar

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend local | Flask (Python) + Cloudflare R2 para imágenes |
| Backend producción | Cloudflare Worker + D1 + R2 |
| Deploy frontend | Cloudflare Pages |
| Chatbot | Widget [@n8n/chat](https://www.npmjs.com/package/@n8n/chat) conectado a un workflow de n8n |

## Estructura

```
Melinadiaz_Fotografia/
├── app.py                  # Backend Flask (desarrollo local)
├── requirements.txt        # Dependencias Python
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # Navbar, Footer, Layout, ChatbotN8n, WhatsAppButton...
│   │   ├── pages/          # Inicio, Categoria, TrabajoDetalle, Servicios, SobreMi, Contacto, Admin
│   │   ├── hooks/          # useApi, useSEO, useFavicon
│   │   └── context/        # ConfigContext (marca, logo, WhatsApp...)
│   └── public/assets/      # Assets estáticos (logo del chatbot, flores del footer...)
├── worker/                 # Cloudflare Worker (API de producción + D1)
└── DEVELOPMENT.md          # Guía de desarrollo local
```
## Licencia

© Melina Diaz Fotografía — Todos los derechos reservados.
