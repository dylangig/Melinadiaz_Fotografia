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

## Inicio rápido

### Windows
```bat
START_LOCAL.bat
```

### macOS / Linux
```bash
chmod +x START_LOCAL.sh
./START_LOCAL.sh
```

### Manual

**Backend Flask** (http://localhost:5000):
```bash
python -m venv venv
venv\Scripts\activate.bat   # Windows
pip install -r requirements.txt
flask run --debug
```

**Frontend** (http://localhost:5173, en otra terminal):
```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

**Backend** (`.env` en la raíz): `SECRET_KEY`, `ADMIN_PASSWORD`, `DOMINIO`, credenciales R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`).

**Frontend** (`frontend/.env.local`):
```bash
VITE_API_URL=                                   # vacío en local (usa el proxy de Vite)
VITE_N8N_CHAT_WEBHOOK_URL=https://<tu-instancia>.app.n8n.cloud/webhook/<id>/chat
```

> En producción, `VITE_N8N_CHAT_WEBHOOK_URL` se configura como variable de entorno en Cloudflare Pages y requiere redeploy (Vite la incrusta en el build).

## API

El frontend consume estos endpoints JSON (Flask en local, Worker en producción):

```
GET  /api/categorias
GET  /api/trabajos/:categoria
GET  /api/trabajos/:categoria/:trabajo
GET  /api/servicios
GET  /api/testimonios
GET  /api/configuracion
GET  /api/sobre-mi
POST /api/admin/login
```

## Chatbot n8n 🤖

Burbuja de chat abajo a la derecha, con la temática del sitio (degradado rosa `#880e4f → #d81b60`, Playfair Display + Inter, logo propio, efecto glow).

- Componente: `frontend/src/components/ChatbotN8n.tsx`
- Estilos: `frontend/src/components/Chatbot.css`
- Logo: `frontend/public/assets/chatbot-logo.jpg`
- Se oculta en `/contacto` y `/admin`.

**Requisitos del workflow en n8n:**
- Nodo inicial **Chat Trigger** en modo *Embedded Chat*, workflow en **Active**.
- Usar la URL de **producción** del webhook.
- **Allowed Origins (CORS):** `http://localhost:5173`, `https://melinadiazfotografia.pages.dev`, `https://melinadiazfotografia.com.ar`.
- Response mode: *When last node finishes*.
- Recomendado: memoria con ventana de 10+ keyeada por `sessionId`, tool HTTP a la API propia (`/api/servicios`, `/api/trabajos/:categoria`) y derivación a WhatsApp (`https://wa.me/5491176348089`) con mensaje pre-armado.

## Deploy

```bash
# Frontend → Cloudflare Pages
cd frontend
npm run build        # genera dist/

# Backend → Cloudflare Worker
cd worker
npx wrangler deploy
```

## Licencia

© Melina Diaz Fotografía — Todos los derechos reservados.
