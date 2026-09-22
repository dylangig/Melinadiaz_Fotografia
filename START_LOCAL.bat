@echo off
REM ═════════════════════════════════════════════════════════════════════════════
REM Script para levantar el proyecto en local (Windows)
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║  Iniciando Melina Diaz Fotografia - Desarrollo Local                  ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si existe el venv
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment no encontrado
    echo ✅ Creando venv...
    python -m venv venv
)

REM Activar venv
echo ✅ Activando virtual environment...
call venv\Scripts\activate.bat

REM Instalar dependencias del backend
echo ✅ Instalando dependencias del backend...
pip install -r requirements.txt -q

REM Instalar dependencias del frontend
cd frontend
echo ✅ Instalando dependencias del frontend...
npm install -q
cd ..

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║  ✅ Configuración completada                                           ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Ahora abre 3 terminales y ejecuta:
echo.
echo   Terminal 1 (Backend Flask):
echo   ────────────────────────────
echo   cd c:\Users\Dylan\Documents\GitHub\Melinadiaz_Fotografia
echo   venv\Scripts\activate.bat
echo   flask run --debug
echo   → Acceder en: http://localhost:5000
echo.
echo   Terminal 2 (Frontend Vite):
echo   ────────────────────────────
echo   cd c:\Users\Dylan\Documents\GitHub\Melinadiaz_Fotografia\frontend
echo   npm run dev
echo   → Acceder en: http://localhost:5173
echo.
echo   (Opcional) Terminal 3 (Worker Cloudflare):
echo   ────────────────────────────────────────
echo   cd c:\Users\Dylan\Documents\GitHub\Melinadiaz_Fotografia\worker
echo   npm install
echo   npx wrangler dev
echo   → Acceder en: http://localhost:8787
echo.
echo ✨ El frontend (5173) proxeará automáticamente al backend (5000)
echo ✨ No necesitas el worker en desarrollo local
echo.
