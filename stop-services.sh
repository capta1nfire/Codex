#!/bin/bash

# 🛑 QReable - Stop Services Script
# Detiene todos los servicios del proyecto QReable de forma segura

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}"
echo "  ██████╗ ██████╗ ███████╗ █████╗ ██████╗ ██╗     ███████╗"
echo " ██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝"
echo " ██║  ██║██████╔╝█████╗  ███████║██████╔╝██║     █████╗  "
echo " ██║ ██╔╝██╔══██╗██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  "
echo " ╚████╔╝ ██║  ██║███████╗██║  ██║██████╔╝███████╗███████╗"
echo "  ╚███╔╝  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${RED}🛑 Service Stopper${NC}"
echo "========================================="

# Función para detener procesos por puerto
stop_by_port() {
    local port=$1
    local service_name=$2
    echo -e "${YELLOW}🔍 Buscando procesos en puerto $port ($service_name)...${NC}"
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo -e "${RED}   ⚠️  Encontrado proceso(s): $pids${NC}"
        for pid in $pids; do
            echo -e "${YELLOW}   🛑 Deteniendo proceso $pid...${NC}"
            kill -TERM $pid 2>/dev/null || true
        done
        sleep 2
        # Verificar si aún existe
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo -e "${RED}   ⚠️  Forzando detención...${NC}"
            for pid in $remaining; do
                kill -KILL $pid 2>/dev/null || true
            done
        fi
        echo -e "${GREEN}   ✅ Puerto $port liberado${NC}"
    else
        echo -e "${GREEN}   ✅ No hay procesos en puerto $port${NC}"
    fi
}

# Función para detener procesos por nombre
stop_by_name() {
    local process_name=$1
    echo -e "${YELLOW}🔍 Buscando procesos: $process_name...${NC}"
    
    local pids=$(pgrep -f "$process_name" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo -e "${RED}   ⚠️  Encontrado proceso(s): $pids${NC}"
        for pid in $pids; do
            echo -e "${YELLOW}   🛑 Deteniendo proceso $pid...${NC}"
            kill -TERM $pid 2>/dev/null || true
        done
        sleep 2
        # Verificar si aún existe
        local remaining=$(pgrep -f "$process_name" 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo -e "${RED}   ⚠️  Forzando detención...${NC}"
            for pid in $remaining; do
                kill -KILL $pid 2>/dev/null || true
            done
        fi
        echo -e "${GREEN}   ✅ Procesos '$process_name' detenidos${NC}"
    else
        echo -e "${GREEN}   ✅ No se encontraron procesos '$process_name'${NC}"
    fi
}

# Detener servicios por puerto
echo -e "${BLUE}📋 Deteniendo servicios por puerto...${NC}"
stop_by_port 3000 "Frontend"
stop_by_port 3004 "Backend"
stop_by_port 3002 "Rust Generator"

# Detener servicios por nombre
echo -e "\n${BLUE}📋 Deteniendo servicios por nombre...${NC}"
stop_by_name "next-server"
stop_by_name "tsx watch.*backend"
stop_by_name "qreable_generator"
stop_by_name "cargo run"

# Verificación final
echo -e "\n${BLUE}🔍 Verificación final...${NC}"
all_clear=true

for port in 3000 3004 3002; do
    if lsof -ti:$port &>/dev/null; then
        echo -e "${RED}   ❌ Puerto $port aún ocupado${NC}"
        all_clear=false
    else
        echo -e "${GREEN}   ✅ Puerto $port libre${NC}"
    fi
done

if $all_clear; then
    echo -e "\n${GREEN}✅ Todos los servicios QReable han sido detenidos exitosamente${NC}"
else
    echo -e "\n${YELLOW}⚠️  Algunos servicios pueden seguir activos${NC}"
    echo -e "${YELLOW}   Intenta ejecutar el script nuevamente o usa 'lsof -ti:PORT | xargs kill -9'${NC}"
fi

echo -e "\n${BLUE}💡 Para iniciar los servicios nuevamente, ejecuta:${NC}"
echo -e "${GREEN}   ./dev.sh${NC}"