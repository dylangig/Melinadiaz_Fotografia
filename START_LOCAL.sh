#!/bin/bash
# ═════════════════════════════════════════════════════════════════════════════
# Script para levantar el proyecto en local (macOS/Linux)
# ═════════════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║  Iniciando Melina Diaz Fotografia - Desarrollo Local                  ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si existe el venv
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment no encontrado"
    echo "✅ Creando venv..."
    python3 -m venv venv
fi

# Activar venv
echo "✅ Activando virtual environment..."
source venv/bin/activate

# Instalar dependencias del backend
echo "✅ Instalando dependencias del backend..."
pip install -r requirements.txt -q

# Instalar dependencias del frontend
cd frontend
echo "✅ Instalando dependencias del frontend..."
npm install -q
cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Configuración completada                                           ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Ahora abre 3 terminales y ejecuta:"
echo ""
echo "   Terminal 1 (Backend Flask):"
echo "   ────────────────────────────"
echo "   source venv/bin/activate"
echo "   flask run --debug"
echo "   → Acceder en: http://localhost:5000"
echo ""
echo "   Terminal 2 (Frontend Vite):"
echo "   ────────────────────────────"
echo "   cd frontend"
echo "   npm run dev"
echo "   → Acceder en: http://localhost:5173"
echo ""
echo "   (Opcional) Terminal 3 (Worker Cloudflare):"
echo "   ────────────────────────────────────────"
echo "   cd worker"
echo "   npm install"
echo "   npx wrangler dev"
echo "   → Acceder en: http://localhost:8787"
echo ""
echo "✨ El frontend (5173) proxeará automáticamente al backend (5000)"
echo "✨ No necesitas el worker en desarrollo local"
echo ""
