#!/bin/bash

# 🔍 QReable - Validador de Entorno de Desarrollo
# Detecta conflictos de configuración antes de que causen problemas

echo "🔍 QReable Environment Validator"
echo "================================"

ISSUES_FOUND=0

# 1. Detectar múltiples instancias de PostgreSQL
echo "📊 Checking PostgreSQL instances..."

BREW_PG=$(brew services list | grep postgresql | grep started | wc -l | tr -d ' ')
DOCKER_PG=$(docker ps | grep postgres | wc -l | tr -d ' ')

echo "   Local PostgreSQL (brew): $BREW_PG"
echo "   Docker PostgreSQL: $DOCKER_PG"

if [ "$BREW_PG" -gt 0 ] && [ "$DOCKER_PG" -gt 0 ]; then
    echo "   ⚠️  WARNING: Multiple PostgreSQL instances detected!"
    echo "   💡 Solution: brew services stop postgresql@14"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$BREW_PG" -gt 0 ]; then
    echo "   ⚠️  WARNING: Using local PostgreSQL, but project expects Docker"
    echo "   💡 Solution: docker-compose up -d && brew services stop postgresql@14"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ "$DOCKER_PG" -eq 0 ]; then
    echo "   ❌ ERROR: No PostgreSQL running"
    echo "   💡 Solution: docker-compose up -d"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "   ✅ Docker PostgreSQL running correctly"
fi

# 2. Verificar conexión a la BD correcta
echo ""
echo "🗄️  Checking database connectivity..."

if docker exec qreable_postgres psql -U qreable_user -d qreable_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Docker database accessible"
else
    echo "   ❌ ERROR: Cannot connect to Docker database"
    echo "   💡 Solution: docker-compose up -d && wait 10 seconds"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# 3. Verificar puertos ocupados
echo ""
echo "🔌 Checking port conflicts..."

PORTS=(3000 3002 3004 5432 6379)
for port in "${PORTS[@]}"; do
    if lsof -i TCP:$port > /dev/null 2>&1; then
        PROCESS=$(lsof -i TCP:$port | tail -1 | awk '{print $1}')
        echo "   Port $port: $PROCESS"
    else
        echo "   Port $port: FREE"
    fi
done

# 4. Verificar servicios Docker necesarios
echo ""
echo "🐳 Checking Docker services..."

REQUIRED_SERVICES=("qreable_postgres" "qreable_redis")
for service in "${REQUIRED_SERVICES[@]}"; do
    if docker ps | grep "$service" > /dev/null 2>&1; then
        echo "   ✅ $service running"
    else
        echo "   ❌ $service not running"
        echo "   💡 Solution: docker-compose up -d"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# 5. Verificar archivos de configuración
echo ""
echo "⚙️  Checking configuration files..."

if [ -f "backend/.env" ]; then
    echo "   ✅ backend/.env exists"
    if grep -q "DATABASE_URL.*qreable_user.*qreable_db" backend/.env; then
        echo "   ✅ DATABASE_URL configured correctly"
    else
        echo "   ⚠️  WARNING: DATABASE_URL might be misconfigured"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "   ❌ backend/.env missing"
    echo "   💡 Solution: cp backend/.env.example backend/.env"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Resumen
echo ""
echo "📋 SUMMARY"
echo "=========="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ Environment is correctly configured!"
    echo "🚀 Ready to run: ./dev.sh"
else
    echo "❌ Found $ISSUES_FOUND issue(s) that need to be resolved"
    echo "🔧 Fix the issues above before starting development"
    exit 1
fi 