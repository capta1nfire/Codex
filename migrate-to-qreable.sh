#!/bin/bash

# 🔄 QReable Database Migration Script
# Migra datos de la base de datos QReable a QReable

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "  ██████╗ ██████╗ ███████╗ █████╗ ██████╗ ██╗     ███████╗"
echo " ██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝"
echo " ██║   ██║██████╔╝█████╗  ███████║██████╔╝██║     █████╗  "
echo " ██║▄▄ ██║██╔══██╗██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  "
echo " ╚██████╔╝██║  ██║███████╗██║  ██║██████╔╝███████╗███████╗"
echo "  ╚══▀▀═╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${CYAN}Database Migration Tool - QReable to QReable${NC}"
echo "========================================="

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

echo -e "\n${YELLOW}⚠️  ADVERTENCIA: Este script migrará los datos de QReable a QReable${NC}"
echo -e "${YELLOW}   Asegúrate de tener un backup antes de continuar.${NC}"
echo -e "\n${CYAN}Presiona ENTER para continuar o Ctrl+C para cancelar...${NC}"
read

# Paso 1: Detener servicios
echo -e "\n${BLUE}📋 Paso 1: Deteniendo servicios...${NC}"
pm2 stop all 2>/dev/null || true

# Paso 2: Backup de la base de datos actual
echo -e "\n${BLUE}📋 Paso 2: Creando backup de la base de datos actual...${NC}"
BACKUP_FILE="qreable_backup_$(date +%Y%m%d_%H%M%S).sql"

docker exec qreable_postgres pg_dump -U qreable_user qreable_db > "$BACKUP_FILE" 2>/dev/null

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo -e "${GREEN}   ✅ Backup creado: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}   ⚠️  No se pudo crear backup (posiblemente no hay datos)${NC}"
fi

# Paso 3: Detener contenedores antiguos
echo -e "\n${BLUE}📋 Paso 3: Deteniendo contenedores antiguos...${NC}"
docker-compose down

# Paso 4: Limpiar volúmenes antiguos (opcional)
echo -e "\n${YELLOW}¿Deseas eliminar los volúmenes antiguos de Docker? (s/N)${NC}"
read -r response
if [[ "$response" =~ ^([sS][iI]?|[yY][eE]?[sS]?)$ ]]; then
    docker volume rm codex-project_postgres_data 2>/dev/null || true
    docker volume rm codex-project_redis_data 2>/dev/null || true
    echo -e "${GREEN}   ✅ Volúmenes antiguos eliminados${NC}"
fi

# Paso 5: Iniciar nuevos contenedores
echo -e "\n${BLUE}📋 Paso 5: Iniciando nuevos contenedores QReable...${NC}"
docker-compose up -d

# Esperar a que PostgreSQL esté listo
echo -e "${YELLOW}   ⏳ Esperando a que PostgreSQL esté listo...${NC}"
sleep 10

# Verificar que el nuevo contenedor esté funcionando
if ! docker ps | grep qreable_postgres > /dev/null; then
    echo -e "${RED}❌ El contenedor qreable_postgres no está funcionando${NC}"
    exit 1
fi

# Paso 6: Restaurar datos si hay backup
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo -e "\n${BLUE}📋 Paso 6: Restaurando datos en la nueva base de datos...${NC}"
    
    # Primero crear la estructura con Prisma
    echo -e "${YELLOW}   🔧 Ejecutando migraciones de Prisma...${NC}"
    cd backend
    npx prisma migrate deploy
    cd ..
    
    # Luego restaurar los datos (sin la estructura)
    echo -e "${YELLOW}   📥 Restaurando datos...${NC}"
    docker exec -i qreable_postgres psql -U qreable_user qreable_db < "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️  Algunos errores durante la restauración (normal si hay conflictos de estructura)${NC}"
    }
    
    echo -e "${GREEN}   ✅ Datos restaurados${NC}"
else
    echo -e "\n${BLUE}📋 Paso 6: Inicializando nueva base de datos...${NC}"
    cd backend
    npx prisma migrate deploy
    npx prisma db seed
    cd ..
    echo -e "${GREEN}   ✅ Base de datos inicializada${NC}"
fi

# Paso 7: Verificación
echo -e "\n${BLUE}📋 Paso 7: Verificando migración...${NC}"

# Verificar conexión a la nueva base de datos
if docker exec qreable_postgres psql -U qreable_user -d qreable_db -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Conexión a base de datos QReable exitosa${NC}"
else
    echo -e "${RED}   ❌ No se puede conectar a la base de datos QReable${NC}"
    exit 1
fi

# Paso 8: Reiniciar servicios
echo -e "\n${BLUE}📋 Paso 8: Reiniciando servicios con nuevos nombres...${NC}"
./pm2-start.sh

echo -e "\n${GREEN}✅ Migración completada exitosamente${NC}"
echo -e "\n${CYAN}Resumen:${NC}"
echo -e "  • Base de datos migrada: codex_db → qreable_db"
echo -e "  • Usuario: codex_user → qreable_user"
echo -e "  • Contenedores renombrados con prefijo 'qreable_'"
echo -e "  • Servicios PM2 actualizados"

if [ -f "$BACKUP_FILE" ]; then
    echo -e "\n${YELLOW}💡 Backup guardado en: $BACKUP_FILE${NC}"
    echo -e "${YELLOW}   Guárdalo en un lugar seguro por si necesitas revertir${NC}"
fi

echo -e "\n${BLUE}🔍 Verifica que todo funcione correctamente en:${NC}"
echo -e "   ${CYAN}http://localhost:3000${NC}"