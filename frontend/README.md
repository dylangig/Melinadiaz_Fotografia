# Melina Diaz Fotografía - Frontend React

Frontend de la web/portfolio de Melina Diaz Fotografía. La arquitectura oficial actual usa Cloudflare Pages para el frontend, Cloudflare Worker para la API, Cloudflare D1 para datos y Cloudflare R2 para imágenes.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Estilos | TailwindCSS 3 |
| Routing | React Router v6 |
| Deploy frontend | Cloudflare Pages |
| API/backend | Cloudflare Worker (`melina-worker`) |
| Base de datos | Cloudflare D1 (`melina-db`) |
| Imágenes | Cloudflare R2 (`fotosmelinaapp`) |
| Dominio público de imágenes | `https://imagenes.melinadiazfotografia.com.ar` |

## Desarrollo Local

Levantar el Worker y el frontend en dos terminales separadas.

Terminal 1 - Worker local:

```bash
cd worker
npx wrangler dev
```

Terminal 2 - Frontend local:

```bash
cd frontend
npm run dev
```

En desarrollo, `VITE_API_URL` puede quedar vacío. Vite proxyfica las llamadas a `/api` hacia `http://localhost:8787` según `frontend/vite.config.ts`.

## Scripts

Desde `frontend/`:

```bash
npm run dev
npm run build
npm run preview
```

## Variables

### Frontend

- `VITE_API_URL`: URL base de la API. En desarrollo local puede quedar vacía para usar el proxy de Vite. En producción se configura solo si la API no queda accesible bajo el mismo origen o rewrite.

### Worker

Variables no secretas configuradas en `worker/wrangler.toml`:

- `R2_PUBLIC_URL`
- `ALLOWED_ORIGINS`

Secrets configurados con Wrangler:

- `ADMIN_PASSWORD`
- `JWT_SECRET`

## Estructura del Proyecto

```text
src/
├── components/
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── WhatsAppButton.tsx
├── context/
│   └── ConfigContext.tsx
├── hooks/
│   ├── useApi.ts
│   ├── useFavicon.ts
│   └── useSEO.ts
├── pages/
│   ├── Inicio.tsx
│   ├── Categoria.tsx
│   ├── TrabajoDetalle.tsx
│   ├── Servicios.tsx
│   ├── SobreMi.tsx
│   ├── Contacto.tsx
│   ├── Admin.tsx
│   └── NotFound.tsx
├── types/
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Rutas

| URL | Página |
| --- | --- |
| `/` | Inicio |
| `/galeria/:categoriaSlug` | Categoría |
| `/galeria/:categoriaSlug/:trabajoSlug` | Detalle trabajo |
| `/servicios` | Servicios |
| `/sobre-mi` | Sobre mí |
| `/contacto` | Formulario |
| `/admin` | Panel admin |

## Deploy

El frontend se despliega en Cloudflare Pages. La API principal es el Cloudflare Worker `melina-worker`, con datos en D1 (`melina-db`) e imágenes en R2 (`fotosmelinaapp`).

El archivo `frontend/public/_redirects` contiene reglas usadas por Cloudflare Pages para la SPA y para derivar `sitemap.xml` y `robots.txt` al Worker.

## Legacy

Los siguientes archivos quedan como referencia histórica del backend anterior y no son el flujo principal actual:

- `app.py`
- `requirements.txt`
- `frontend/API_ENDPOINTS_AGREGAR_A_APP_PY.py`

No usar Flask, Railway o Vercel como referencia principal para desarrollo o deploy salvo que se indique explícitamente.
