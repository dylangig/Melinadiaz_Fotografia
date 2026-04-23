# Melina Diaz Fotografía — Frontend React

Frontend migrado a **React + TypeScript + Vite + TailwindCSS**.

## Stack

| Capa       | Tecnología                        |
|------------|-----------------------------------|
| Frontend   | React 18 + TypeScript + Vite      |
| Estilos    | TailwindCSS 3                     |
| Routing    | React Router v6                   |
| Backend    | Flask (Python) — sin cambios      |
| Imágenes   | Cloudflare R2                     |

---

## Setup local

### 1. Frontend

```bash
# Clonar e instalar
npm install

# Correr en desarrollo (necesita el backend corriendo en :5000)
npm run dev

# Build para producción
npm run build
```

### 2. Backend — agregar endpoints JSON al `app.py`

Primero instalar flask-cors:

```bash
pip install flask-cors
```

Agregar al inicio del `app.py` existente (después de `from flask import ...`):

```python
from flask_cors import CORS
CORS(app, origins=["http://localhost:5173", "https://melinadiazfotografia.com.ar"], supports_credentials=True)
```

Luego copiar todo el contenido de `API_ENDPOINTS_AGREGAR_A_APP_PY.py` al final del `app.py`.

---

## Estructura del proyecto

```
src/
├── components/
│   ├── Layout.tsx          # Wrapper general (Navbar + Footer + WhatsApp)
│   ├── Navbar.tsx          # Navbar sticky con menú mobile
│   ├── Footer.tsx          # Footer con links
│   └── WhatsAppButton.tsx  # Botón flotante de WhatsApp
├── hooks/
│   └── useApi.ts           # Hooks para fetch a la API Flask
├── pages/
│   ├── Inicio.tsx          # Landing page (reemplaza inicio.html)
│   ├── Categoria.tsx       # Grilla de trabajos (reemplaza categoria.html)
│   ├── TrabajoDetalle.tsx  # Galería + lightbox (reemplaza trabajo_detalle.html)
│   ├── Servicios.tsx       # Servicios (reemplaza servicios.html)
│   ├── Contacto.tsx        # Formulario → WhatsApp (reemplaza contacto.html)
│   ├── Admin.tsx           # Panel admin React (reemplaza admin.html)
│   └── NotFound.tsx        # 404 (reemplaza 404.html)
├── types/
│   └── index.ts            # Tipos TypeScript: Categoria, Trabajo, Servicio
├── App.tsx                 # Rutas con React Router
├── main.tsx                # Entry point
└── index.css               # TailwindCSS base + animaciones globales
```

---

## Rutas

| URL                                      | Página            |
|------------------------------------------|-------------------|
| `/`                                      | Inicio            |
| `/galeria/:categoriaSlug`                | Categoría         |
| `/galeria/:categoriaSlug/:trabajoSlug`   | Detalle trabajo   |
| `/servicios`                             | Servicios         |
| `/contacto`                              | Formulario        |
| `/admin`                                 | Panel admin       |

---

## Deploy en Vercel (frontend estático)

1. Subir el frontend a un repo de GitHub
2. Importar en Vercel
3. En Vercel → Settings → Environment Variables agregar:
   ```
   VITE_API_URL=https://tu-backend.railway.app
   ```
4. En `vercel.json` agregar rewrite para SPA:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

El backend Flask se mantiene en Railway como está.

---

## Próximos pasos (opcionales)

- [ ] Migrar backend a **Supabase** (base de datos) + **Cloudflare Workers** (API)
- [ ] Agregar drag & drop para reordenar fotos en el admin
- [ ] SEO: agregar `react-helmet-async` para meta tags dinámicos
- [ ] Lazy loading mejorado con `react-intersection-observer`
