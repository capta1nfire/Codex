#!/bin/bash

# 🚀 Codex Project - Enhanced Development Server Manager
# Autor: Codex Team
# Versión: 1.3.0 (Environment validation + Auto-cleanup)

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
echo -e "${WHITE}🚀 Development Server Manager v1.3.0${NC}"
echo -e "${CYAN}=================================================${NC}"

# Variables
PIDS=()
LOG_DIR="logs"

# Crear directorio de logs si no existe
mkdir -p $LOG_DIR

# Función de validación del entorno (NUEVA)
validate_environment() {
    echo -e "${BLUE}🔍 Validando entorno de desarrollo...${NC}"
    
    local issues=0
    
    # Verificar múltiples instancias de PostgreSQL
    local brew_pg=$(brew services list 2>/dev/null | grep postgresql | grep started | wc -l | tr -d ' ')
    local docker_pg=$(docker ps 2>/dev/null | grep postgres | wc -l | tr -d ' ')
    
    if [ "$brew_pg" -gt 0 ] && [ "$docker_pg" -gt 0 ]; then
        echo -e "${RED}   ❌ CRITICAL: Multiple PostgreSQL instances detected!${NC}"
        echo -e "${YELLOW}   💡 Fix: brew services stop postgresql@14${NC}"
        issues=$((issues + 1))
    elif [ "$brew_pg" -gt 0 ] && [ "$docker_pg" -eq 0 ]; then
        echo -e "${YELLOW}   ⚠️  WARNING: Using local PostgreSQL, project expects Docker${NC}"
        echo -e "${YELLOW}   💡 Starting Docker infrastructure...${NC}"
        docker-compose up -d > /dev/null 2>&1
        sleep 5
    elif [ "$docker_pg" -eq 0 ]; then
        echo -e "${YELLOW}   ⚠️  No PostgreSQL running, starting Docker infrastructure...${NC}"
        docker-compose up -d > /dev/null 2>&1
        sleep 5
    fi
    
    # Verificar conectividad a la BD Docker
    if docker exec qreable_postgres psql -U qreable_user -d qreable_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Docker database accessible${NC}"
    else
        echo -e "${RED}   ❌ Cannot connect to Docker database${NC}"
        echo -e "${YELLOW}   💡 Trying to start Docker services...${NC}"
        docker-compose up -d > /dev/null 2>&1
        sleep 10
        
        if docker exec qreable_postgres psql -U qreable_user -d qreable_db -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Docker database now accessible${NC}"
        else
            echo -e "${RED}   ❌ CRITICAL: Still cannot connect to database${NC}"
            issues=$((issues + 1))
        fi
    fi
    
    # Verificar archivos de configuración
    if [ ! -f "backend/.env" ]; then
        echo -e "${RED}   ❌ backend/.env missing${NC}"
        echo -e "${YELLOW}   💡 Copying from example...${NC}"
        cp backend/.env.example backend/.env 2>/dev/null || issues=$((issues + 1))
    fi
    
    if [ $issues -gt 0 ]; then
        echo -e "${RED}❌ Found $issues critical issue(s)${NC}"
        echo -e "${YELLOW}Please fix the issues above and run the script again${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Environment validation passed${NC}"
    fi
    
    echo ""
}

# Función de limpieza previa (NUEVA)
cleanup_previous_processes() {
    echo -e "${YELLOW}🧹 Limpiando procesos anteriores...${NC}"
    
    local killed_any=false
    
    # Buscar y matar procesos en puertos específicos
    echo -e "${BLUE}🔍 Buscando procesos en puertos 3000, 3002, 3004...${NC}"
    
    # Puerto 3000 (Frontend)
    local port_3000_pids=$(lsof -ti :3000 2>/dev/null)
    if [ ! -z "$port_3000_pids" ]; then
        echo -e "${CYAN}   • Matando procesos en puerto 3000: $port_3000_pids${NC}"
        kill -TERM $port_3000_pids 2>/dev/null
        killed_any=true
    fi
    
    # Puerto 3002 (Rust)
    local port_3002_pids=$(lsof -ti :3002 2>/dev/null)
    if [ ! -z "$port_3002_pids" ]; then
        echo -e "${CYAN}   • Matando procesos en puerto 3002: $port_3002_pids${NC}"
        kill -TERM $port_3002_pids 2>/dev/null
        killed_any=true
    fi
    
    # Puerto 3004 (Backend)
    local port_3004_pids=$(lsof -ti :3004 2>/dev/null)
    if [ ! -z "$port_3004_pids" ]; then
        echo -e "${CYAN}   • Matando procesos en puerto 3004: $port_3004_pids${NC}"
        kill -TERM $port_3004_pids 2>/dev/null
        killed_any=true
    fi
    
    # Buscar procesos por nombre específico
    echo -e "${BLUE}🔍 Buscando procesos CODEX por nombre...${NC}"
    
    # Procesos rust_generator
    local rust_pids=$(pgrep -f "rust_generator" 2>/dev/null)
    if [ ! -z "$rust_pids" ]; then
        echo -e "${CYAN}   • Matando rust_generator: $rust_pids${NC}"
        kill -TERM $rust_pids 2>/dev/null
        killed_any=true
    fi
    
    # Procesos next-server que contengan "Codex Project"
    local next_pids=$(pgrep -f "Codex.*Project.*next" 2>/dev/null)
    if [ ! -z "$next_pids" ]; then
        echo -e "${CYAN}   • Matando next-server (CODEX): $next_pids${NC}"
        kill -TERM $next_pids 2>/dev/null
        killed_any=true
    fi
    
    # Procesos node que contengan "tsx watch" para backend
    local backend_pids=$(pgrep -f "tsx.*watch.*src" 2>/dev/null)
    if [ ! -z "$backend_pids" ]; then
        echo -e "${CYAN}   • Matando backend tsx: $backend_pids${NC}"
        kill -TERM $backend_pids 2>/dev/null
        killed_any=true
    fi
    
    if [ "$killed_any" = true ]; then
        echo -e "${YELLOW}   ⏳ Esperando 3 segundos para que terminen gracefully...${NC}"
        sleep 3
        
        # Verificar y forzar si es necesario
        echo -e "${BLUE}🔍 Verificando procesos restantes...${NC}"
        
        # Forzar puertos si siguen ocupados
        for port in 3000 3002 3004; do
            local remaining_pids=$(lsof -ti :$port 2>/dev/null)
            if [ ! -z "$remaining_pids" ]; then
                echo -e "${RED}   💀 Forzando procesos en puerto $port: $remaining_pids${NC}"
                kill -KILL $remaining_pids 2>/dev/null
            fi
        done
        
        # Forzar procesos por nombre si siguen activos
        local remaining_rust=$(pgrep -f "rust_generator" 2>/dev/null)
        if [ ! -z "$remaining_rust" ]; then
            echo -e "${RED}   💀 Forzando rust_generator: $remaining_rust${NC}"
            kill -KILL $remaining_rust 2>/dev/null
        fi
        
        echo -e "${GREEN}   ✅ Limpieza completada${NC}"
    else
        echo -e "${GREEN}   ✅ No se encontraron procesos anteriores${NC}"
    fi
    
    echo ""
}

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
    # NUEVA: Validación del entorno antes de todo
    validate_environment
    
    # NUEVA: Limpieza automática de procesos anteriores
    cleanup_previous_processes
    
    # Verificaciones
    check_dependencies
    check_structure
    
    echo ""
    echo -e "${WHITE}🚀 Iniciando servidores de desarrollo...${NC}"
    echo ""
    
    # Iniciar servidores
    start_server "Backend" "backend" "npm run dev" "3004" "🔧"
    sleep 3
    
    start_server "Frontend" "frontend" "./start-dev.sh" "3000" "🎨"
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