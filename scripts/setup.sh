#!/bin/bash
# LigaStatsGame - Setup rápido
echo "🏆 LigaStatsGame - Setup rápido"
echo "================================"

# Crear directorios
mkdir -p data/raw data/images players public/sounds

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Inicializar git
echo "🔧 Inicializando Git..."
git init
git add .
git commit -m "feat: initial project structure"

# Crear ramas
git checkout -b develop
git checkout main

echo ""
echo "✅ Setup completado!"
echo ""
echo "Próximos pasos:"
echo "1. cd LigastatsGame"
echo "2. npm run dev        # Arrancar en desarrollo"
echo "3. npm run build      # Build de producción"
echo "4. npm start          # Iniciar en producción"
echo ""
echo "Backend:"
echo "1. cd backend"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo "Documentación completa:"
echo "- README.md (overview)"
echo "- app/frontend-guide.md (detalles frontend)"
echo "- backend-guide.md (detalles backend)"
echo ""
echo "¡Suerte! 🚀"
