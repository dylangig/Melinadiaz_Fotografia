# 🚀 Guía de Desarrollo Local - Melina Diaz Fotografía

## ⚡ Inicio Rápido

### Windows
Ejecuta el script de inicio (descarga todas las dependencias automáticamente):
```bash
START_LOCAL.bat
```

### macOS/Linux
```bash
chmod +x START_LOCAL.sh
./START_LOCAL.sh
```

---

## 🔧 Instalación Manual

Si el script no funciona, sigue estos pasos:

### 1️⃣ Backend Flask (Puerto 5000)

```bash
# Crear y activar virtual environment
python -m venv venv

# Windows
venv\Scripts\activate.bat

# macOS/Linux
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar con auto-reload
flask run --debug
```

**Variables de entorno** (ya configuradas en `.env`):
- `SECRET_KEY` → Clave de sesión
- `ADMIN_PASSWORD` → Contraseña del admin
- `DOMINIO` → URL local
- `FLASK_DEBUG=1` → Auto-reload activado

### 2️⃣ Frontend React + Vite (Puerto 5173)

En **otra terminal**:

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend proxeará automáticamente a `http://localhost:5000` via `vite.config.ts`.

### 3️⃣ Worker Cloudflare (Opcional - Puerto 8787)

En **otra terminal**:

```bash
cd worker

# Instalar dependencias
npm install

# Ejecutar worker
npx wrangler dev
```

**⚠️ Nota**: El worker necesita credenciales de Cloudflare D1 y R2. En desarrollo inicial, puedes saltarlo.

---

## 📂 Estructura del Proyecto

```
Melinadiaz_Fotografia/
├── app.py                    # Backend Flask
├── requirements.txt          # Dependencias Python
├── .env                      # Variables de entorno (LOCAL)
├── venv/                     # Virtual environment
│
├── frontend/                 # React + TypeScript + Tailwind
│   ├── package.json
│   ├── .env.local            # Variables del frontend
│   ├── vite.config.ts        # Proxy configurado a localhost:5000
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Páginas (rutas)
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # App principal
│   └── public/               # Archivos estáticos
│
└── worker/                   # Cloudflare Worker (API alternativa)
    ├── package.json
    ├── wrangler.toml         # Configuración Cloudflare
    └── src/
        ├── index.js          # Punto de entrada
        ├── routes/           # Rutas API
        └── migrations/       # Migraciones D1
```

---

## 🌐 URLs de Acceso

| Servicio | URL | Estado |
|----------|-----|--------|
| Frontend | http://localhost:5173 | ✅ Abierto en navegador |
| Backend Flask | http://localhost:5000 | ✅ API local |
| Worker (opcional) | http://localhost:8787 | ❌ Solo si ejecutas wrangler |

---

## 🔌 API Endpoints Disponibles

El frontend hace requests a `/api/*` que son redirigidas automáticamente a `http://localhost:5000/api/*` por Vite.

### Endpoints principales:

```
GET  /api/categorias           # Obtener categorías
GET  /api/trabajos/:categoria  # Trabajos por categoría
GET  /api/trabajo/:id          # Detalle del trabajo
POST /api/admin/login          # Autenticación admin
GET  /api/configuracion        # Config del sitio
```

---

## 🛠️ Troubleshooting

### Error: `pip install -r requirements.txt` falla

**Problema**: Pillow no compila en Python 3.14

**Solución**: Ya está arreglado en `requirements.txt` (Pillow==12.3.0)

```bash
pip install -r requirements.txt
```

### Error: `npm install` no encuentra `package.json` en worker

**Problema**: Faltaba `worker/package.json`

**Solución**: Ya está creado. Ejecuta:

```bash
cd worker
npm install
```

### Frontend no conecta con Backend

**Verificar**:
1. Backend corriendo en `http://localhost:5000` ✅
2. Frontend corriendo en `http://localhost:5173` ✅
3. Abre DevTools (F12) → Network → Verifica que `/api/*` vaya a `localhost:5000`

Si el proxy no funciona:
```bash
# En frontend/
npm run dev -- --reset-cache
```

### Puerto 5000/5173 ya está en uso

```bash
# Flask en otro puerto
flask run --port 5001 --debug

# Vite en otro puerto
npm run dev -- --port 5174
```

---

## 📝 Desarrollo

### Editar componentes React
- Archivos en `frontend/src/components/`
- Cambios se guardan automáticamente (HMR habilitado)

### Editar rutas del backend
- Archivos en `app.py`
- Cambios se cargan automáticamente (FLASK_DEBUG=1)

### Añadir variables de entorno
- Editar `.env` (backend)
- Editar `frontend/.env.local` (frontend)
- Reiniciar servidores para que se carguen

---

## 🚀 Deploy

Cuando esté listo para producción:

1. **Frontend → Cloudflare Pages**:
   ```bash
   cd frontend
   npm run build
   # Subir contenido de dist/ a Cloudflare Pages
   ```

2. **Backend → Cloudflare Worker** (opcional):
   ```bash
   cd worker
   wrangler deploy
   ```

---

## ✅ Checklist antes de empezar

- [ ] Python 3.13+ instalado
- [ ] Node.js 18+ instalado
- [ ] `.env` existe en la raíz
- [ ] `frontend/.env.local` existe
- [ ] `venv/` creado y activado
- [ ] `pip install -r requirements.txt` completado
- [ ] `npm install` en `frontend/` completado
- [ ] Puerto 5000 disponible (Flask)
- [ ] Puerto 5173 disponible (Vite)

---

## 💡 Tips

- Mantén 2-3 terminales abiertas (backend, frontend, worker)
- Usa `git status` para ver qué archivos cambiar
- Edita `.env` para cambiar credenciales sin commitar
- El `venv/` no se debe commitear (está en `.gitignore`)

---

¿Problemas? Revisa la terminal donde corres el servidor para ver los errores completos.
