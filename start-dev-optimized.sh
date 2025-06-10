#!/bin/bash

echo "🚀 Iniciando CODEX con optimizaciones de rendimiento..."

# Configurar Node.js para alto rendimiento
export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"
export UV_THREADPOOL_SIZE=16

# Configurar timeouts más largos
export RUST_SERVICE_TIMEOUT_MS=30000

# Configurar rate limiting más alto
export RATE_LIMIT_MAX=10000

# Configurar cache
export CACHE_MAX_AGE=600

# Iniciar con PM2
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
pm2 status

echo "✅ CODEX iniciado con optimizaciones"
echo "📊 Monitorear con: pm2 monit"
echo "📈 Ver logs con: pm2 logs"
echo ""
echo "🔧 Optimizaciones aplicadas:"
echo "  - Thread pool aumentado a 16"
echo "  - Memoria heap aumentada a 4GB"
echo "  - Timeout de Rust aumentado a 30s"
echo "  - Rate limit aumentado a 10000 req/15min"
echo "  - Cache TTL aumentado a 10 minutos"