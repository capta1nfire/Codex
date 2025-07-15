#!/bin/bash

# 🚀 QReable Project - PM2 Production-Grade Development Manager
# Maneja servicios con reinicio automático y monitoreo robusto

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "  ██████╗ ██████╗ ███████╗ █████╗ ██████╗ ██╗     ███████╗"
echo " ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝"
echo " ██║  ██║██████╔╝█████╗  ███████║██████╔╝██║     █████╗  "
echo " ██║ ██╔╝██╔══██╗██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  "
echo " ╚████╔╝ ██║  ██║███████╗██║  ██║██████╔╝███████╗███████╗"
echo "  ╚███╔╝  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${WHITE}🚀 PM2 Development Manager - Robust & Auto-Restart${NC}"
echo -e "${CYAN}=================================================${NC}"

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 PM2 no está instalado. Instalando...${NC}"
    npm install -g pm2
fi

# Detener cualquier instancia previa
echo -e "${YELLOW}🧹 Limpiando procesos anteriores...${NC}"
pm2 delete all 2>/dev/null || true

# Matar procesos en puertos
for port in 3000 3002 3004; do
    pids=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${CYAN}   • Liberando puerto $port${NC}"
        kill -9 $pids 2>/dev/null || true
    fi
done

sleep 2

# Verificar Docker
echo -e "${BLUE}🔍 Verificando servicios Docker...${NC}"
if ! docker ps | grep qreable_postgres > /dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Iniciando infraestructura Docker...${NC}"
    docker-compose up -d
    sleep 5
fi

# Iniciar con PM2
echo -e "${GREEN}🚀 Iniciando servicios con PM2...${NC}"
pm2 start ecosystem.config.cjs

# Esperar a que los servicios inicien
echo -e "${YELLOW}⏳ Esperando que los servicios inicien...${NC}"
sleep 5

# Mostrar estado
echo -e "${GREEN}✅ Servicios iniciados con PM2${NC}"
echo ""
pm2 status
echo ""
echo -e "${CYAN}====================================${NC}"
echo -e "${WHITE}📱 Frontend:     ${BLUE}http://localhost:3000${NC}"
echo -e "${WHITE}🔧 Backend:      ${BLUE}http://localhost:3004${NC}"
echo -e "${WHITE}⚡ Rust Gen:     ${BLUE}http://localhost:3002${NC}"
echo ""
echo -e "${WHITE}📋 Comandos útiles:${NC}"
echo -e "${CYAN}   pm2 status      ${NC}# Ver estado de servicios"
echo -e "${CYAN}   pm2 logs        ${NC}# Ver todos los logs"
echo -e "${CYAN}   pm2 logs qreable-backend${NC}# Ver logs específicos"
echo -e "${CYAN}   pm2 restart all ${NC}# Reiniciar todos"
echo -e "${CYAN}   pm2 stop all    ${NC}# Detener todos"
echo -e "${CYAN}   pm2 monit       ${NC}# Monitor en tiempo real"
echo ""
echo -e "${YELLOW}💡 Los servicios se reiniciarán automáticamente si fallan${NC}"
echo -e "${WHITE}💡 Presiona ${RED}Ctrl+C${WHITE} y luego ejecuta ${CYAN}pm2 stop all${WHITE} para detener${NC}"