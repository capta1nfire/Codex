#!/bin/bash

# 🚀 Codex Project - Development Server Starter
# Este script inicia todos los servidores de desarrollo en paralelo
# Versión: 1.1.1 (Fixed ports and process management)

echo "🔥 Iniciando Codex Project - Modo Desarrollo"
echo "================================================="

# Función para manejar la limpieza cuando se presiona Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Deteniendo todos los servidores..."
    kill $(jobs -p) 2>/dev/null
    echo "✅ Todos los servidores han sido detenidos."
    exit 0
}

# Configurar trap para capturar Ctrl+C
trap cleanup SIGINT

# Verificar que las carpetas existan
if [ ! -d "frontend" ]; then
    echo "❌ Error: Carpeta 'frontend' no encontrada"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ Error: Carpeta 'backend' no encontrada"
    exit 1
fi

if [ ! -d "rust_generator" ]; then
    echo "❌ Error: Carpeta 'rust_generator' no encontrada"
    exit 1
fi

# Iniciar Backend (Puerto 3001)
echo "🔧 Iniciando Backend (Puerto 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Esperar un momento
sleep 3

# Iniciar Frontend (Puerto 3000)
echo "🎨 Iniciando Frontend (Puerto 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# Esperar un momento
sleep 3

# Iniciar Rust Generator (Puerto 3002)
echo "⚡ Iniciando Rust Generator (Puerto 3002)..."
cd rust_generator && cargo run &
RUST_PID=$!
cd ..

echo ""
echo "🎯 ¡Todos los servidores iniciados!"
echo "=================================="
echo "📱 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:3001"
echo "⚡ Rust Gen:  http://localhost:3002"
echo ""
echo "💡 Presiona Ctrl+C para detener todos los servidores"
echo ""

# Esperar a que todos los procesos terminen
wait 