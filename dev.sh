#!/bin/bash

# 🚀 Codex Project - Enhanced Development Server Manager
# Autor: Codex Team
# Versión: 1.1.1 (Fixed zsh compatibility)

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
echo "  ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗"
echo " ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝"
echo " ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ "
echo " ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ "
echo " ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗"
echo "  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${WHITE}🚀 Development Server Manager v1.1.0${NC}"
echo -e "${CYAN}=================================================${NC}"

# Variables
PIDS=()
LOG_DIR="logs"

# Crear directorio de logs si no existe
mkdir -p $LOG_DIR

# Función de limpieza
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Señal de interrupción recibida...${NC}"
    echo -e "${BLUE}📊 Deteniendo servidores:${NC}"
    
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            echo -e "   ${CYAN}• Deteniendo PID: $pid${NC}"
            kill -TERM $pid 2>/dev/null
        fi
    done
    
    # Esperar a que se detengan
    sleep 2
    
    # Forzar si es necesario
    for pid in "${PIDS[@]}"; do
        if kill -0 $pid 2>/dev/null; then
            echo -e "   ${RED}• Forzando detención de PID: $pid${NC}"
            kill -KILL $pid 2>/dev/null
        fi
    done
    
    echo -e "${GREEN}✅ Todos los servidores han sido detenidos${NC}"
    echo -e "${WHITE}👋 ¡Hasta luego!${NC}"
    exit 0
}

# Configurar trap
trap cleanup SIGINT SIGTERM

# Función para verificar dependencias
check_dependencies() {
    echo -e "${BLUE}🔍 Verificando dependencias...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Rust/Cargo
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}❌ Rust/Cargo no está instalado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Todas las dependencias están disponibles${NC}"
}

# Función para verificar estructura
check_structure() {
    echo -e "${BLUE}📁 Verificando estructura del proyecto...${NC}"
    
    local errors=0
    
    if [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Carpeta 'frontend' no encontrada${NC}"
        errors=$((errors + 1))
    fi
    
    if [ ! -d "backend" ]; then
        echo -e "${RED}❌ Carpeta 'backend' no encontrada${NC}"
        errors=$((errors + 1))
    fi
    
    if [ ! -d "rust_generator" ]; then
        echo -e "${RED}❌ Carpeta 'rust_generator' no encontrada${NC}"
        errors=$((errors + 1))
    fi
    
    if [ $errors -gt 0 ]; then
        echo -e "${RED}💥 Estructura del proyecto incompleta${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Estructura del proyecto válida${NC}"
}

# Función para iniciar servidor
start_server() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    local icon=$5
    
    echo -e "${CYAN}${icon} Iniciando ${name} (Puerto ${port})...${NC}"
    
    # Convertir nombre a minúsculas de forma compatible
    local log_name=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    
    cd $dir
    $cmd > "../$LOG_DIR/${log_name}.log" 2>&1 &
    local pid=$!
    PIDS+=($pid)
    cd ..
    
    # Verificar que se inició correctamente
    sleep 1
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}   ✅ ${name} iniciado (PID: $pid)${NC}"
    else
        echo -e "${RED}   ❌ Error al iniciar ${name}${NC}"
        echo -e "${YELLOW}   📋 Revisa el log: $LOG_DIR/${log_name}.log${NC}"
    fi
}

# Función principal
main() {
    # Verificaciones
    check_dependencies
    check_structure
    
    echo ""
    echo -e "${WHITE}🚀 Iniciando servidores de desarrollo...${NC}"
    echo ""
    
    # Iniciar servidores
    start_server "Backend" "backend" "npm run dev" "3004" "🔧"
    sleep 3
    
    start_server "Frontend" "frontend" "npm run dev" "3000" "🎨"
    sleep 3
    
    start_server "Rust-Generator" "rust_generator" "cargo run" "3002" "⚡"
    
    echo ""
    echo -e "${GREEN}🎯 ¡Todos los servidores iniciados!${NC}"
    echo -e "${CYAN}====================================${NC}"
    echo -e "${WHITE}📱 Frontend:     ${BLUE}http://localhost:3000${NC}"
    echo -e "${WHITE}🔧 Backend:      ${BLUE}http://localhost:3004${NC}"
    echo -e "${WHITE}⚡ Rust Gen:     ${BLUE}http://localhost:3002${NC}"
    echo ""
    echo -e "${WHITE}📋 Logs guardados en: ${YELLOW}$LOG_DIR/${NC}"
    echo -e "${WHITE}💡 Presiona ${RED}Ctrl+C${WHITE} para detener todos los servidores${NC}"
    echo ""
    
    # Mostrar estado en tiempo real
    while true; do
        sleep 10
        local running=0
        for pid in "${PIDS[@]}"; do
            if kill -0 $pid 2>/dev/null; then
                running=$((running + 1))
            fi
        done
        
        if [ $running -eq 0 ]; then
            echo -e "${RED}❌ Todos los servidores se han detenido${NC}"
            break
        fi
        
        echo -e "${GREEN}💚 Servidores activos: $running/${#PIDS[@]}${NC}"
    done
    
    echo -e "${YELLOW}🔄 Reinicia el script para volver a intentar${NC}"
}

# Ejecutar función principal
main 