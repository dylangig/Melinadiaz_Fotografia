@echo off
REM ═════════════════════════════════════════════════════════════════════════════
REM Script que abre 3 terminales automáticamente con todos los servicios
REM ═════════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║  Abriendo 3 terminales - Melina Diaz Fotografia                       ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

REM Terminal 1: Backend Flask
start cmd /k "cd /d %cd% && venv\Scripts\activate.bat && echo. && echo ╔══════════════════════════════════════════════════════════════╗ && echo ║ BACKEND FLASK - http://localhost:5000                    ║ && echo ╚══════════════════════════════════════════════════════════════╝ && echo. && flask run --debug"

REM Esperar un poco para que no abra todo simultáneamente
timeout /t 2 /nobreak

REM Terminal 2: Frontend Vite
start cmd /k "cd /d %cd%\frontend && echo. && echo ╔══════════════════════════════════════════════════════════════╗ && echo ║ FRONTEND VITE - http://localhost:5173                   ║ && echo ╚══════════════════════════════════════════════════════════════╝ && echo. && npm run dev"

REM Esperar un poco
timeout /t 2 /nobreak

REM Terminal 3: Worker (Opcional)
start cmd /k "cd /d %cd%\worker && echo. && echo ╔══════════════════════════════════════════════════════════════╗ && echo ║ WORKER CLOUDFLARE - http://localhost:8787 (Opcional)   ║ && echo ╚══════════════════════════════════════════════════════════════╝ && echo. && npx wrangler dev"

echo.
echo ✅ Se abrieron 3 terminales automáticamente
echo.
echo 📋 Acceso:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo    Worker:   http://localhost:8787 (si completó)
echo.
echo 💡 Todas las terminales están activas. Ciérralas cuando termines.
echo.
