#!/bin/bash

echo "🚀 Iniciando CODEX en modo optimizado..."

# Cargar variables de entorno de producción
export $(cat .env.production | xargs)

# Configurar Node.js para alto rendimiento
export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"
export UV_THREADPOOL_SIZE=16

# Iniciar con PM2 en modo producción
pm2 start ecosystem.production.config.js

# Esperar a que los servicios estén listos
sleep 10

# Verificar estado
pm2 status

echo "✅ CODEX iniciado en modo optimizado"
echo "📊 Monitorear con: pm2 monit"
echo "📈 Ver logs con: pm2 logs"
