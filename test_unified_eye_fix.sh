#!/bin/bash

# Test script para verificar el fix del modo unificado de eye_shape

echo "=== Test de Fix para Modo Unificado de Eye Shape ==="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base
BASE_URL="http://localhost:3004/api/v3/qr/enhanced"

# Token de autenticación (si existe)
TOKEN=$(cat ~/.codex_token 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $TOKEN"
else
    AUTH_HEADER=""
fi

echo -e "${BLUE}1. Probando modo unificado con eye_shape='circle'${NC}"
echo "   Esperado: Círculo sólido completo (no un anillo)"
echo ""

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
  -d '{
    "data": "UNIFIED_TEST",
    "options": {
      "error_correction": "M",
      "customization": {
        "eye_shape": "circle",
        "colors": {
          "foreground": "#FF0000",
          "background": "#FFFFFF"
        }
      }
    }
  }' | jq '.data.paths.eyes[0]' > unified_result.json

echo ""
echo -e "${BLUE}2. Probando modo separado con eye_border_style='circle' + eye_center_style='circle'${NC}"
echo "   Esperado: Estructura con border_path y center_path separados"
echo ""

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
  -d '{
    "data": "SEPARATED_TEST",
    "options": {
      "error_correction": "M",
      "customization": {
        "eye_border_style": "circle",
        "eye_center_style": "circle",
        "colors": {
          "foreground": "#FF0000",
          "background": "#FFFFFF"
        }
      }
    }
  }' | jq '.data.paths.eyes[0]' > separated_result.json

echo ""
echo -e "${BLUE}3. Comparando resultados...${NC}"
echo ""

# Extraer paths
UNIFIED_PATH=$(jq -r '.path' unified_result.json 2>/dev/null || echo "ERROR")
SEPARATED_BORDER=$(jq -r '.border_path' separated_result.json 2>/dev/null || echo "ERROR")
SEPARATED_CENTER=$(jq -r '.center_path' separated_result.json 2>/dev/null || echo "ERROR")

echo "Modo Unificado - Path:"
echo "$UNIFIED_PATH" | head -c 100
echo "..."
echo ""

echo "Modo Separado - Border Path:"
echo "$SEPARATED_BORDER" | head -c 100
echo "..."
echo ""

echo "Modo Separado - Center Path:"
echo "$SEPARATED_CENTER" | head -c 100
echo "..."
echo ""

# Verificar si el modo unificado tiene el problema del agujero
if [[ "$UNIFIED_PATH" == *"M 6 7.5 A 1.5 1.5"* ]]; then
    echo -e "${RED}❌ PROBLEMA DETECTADO: El modo unificado está creando un agujero (círculo de 1.5 radio)${NC}"
    echo -e "${RED}   Esto genera un anillo en lugar de un ojo sólido.${NC}"
else
    echo -e "${GREEN}✅ CORRECTO: El modo unificado no contiene el path del agujero${NC}"
fi

echo ""
echo -e "${BLUE}4. Probando otros shapes en modo unificado...${NC}"
echo ""

for shape in "square" "rounded_square" "star" "diamond"; do
    echo -n "Testing $shape... "
    
    RESULT=$(curl -s -X POST "$BASE_URL" \
      -H "Content-Type: application/json" \
      ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
      -d "{
        \"data\": \"TEST_$shape\",
        \"options\": {
          \"error_correction\": \"M\",
          \"customization\": {
            \"eye_shape\": \"$shape\"
          }
        }
      }" | jq -r '.data.paths.eyes[0].path' 2>/dev/null)
    
    if [[ -n "$RESULT" ]] && [[ "$RESULT" != "null" ]]; then
        # Contar cuántos paths M (moveto) hay
        M_COUNT=$(echo "$RESULT" | grep -o "M " | wc -l)
        if [ $M_COUNT -gt 1 ]; then
            echo -e "${RED}Múltiples paths detectados (posible agujero)${NC}"
        else
            echo -e "${GREEN}OK${NC}"
        fi
    else
        echo -e "${RED}ERROR${NC}"
    fi
done

echo ""
echo -e "${BLUE}5. Generando comparación visual...${NC}"
echo ""

# Generar SVGs para comparación visual
echo '<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
  <text x="10" y="20" font-family="Arial" font-size="14">Modo Unificado (Actual - Con Bug)</text>
  <g transform="translate(10, 30) scale(5, 5)">
    <path d="M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z M 6 7.5 A 1.5 1.5 0 1 0 9 7.5 A 1.5 1.5 0 1 0 6 7.5 Z" fill="#FF0000" fill-rule="evenodd"/>
  </g>
  
  <text x="150" y="20" font-family="Arial" font-size="14">Modo Unificado (Fixed)</text>
  <g transform="translate(150, 30) scale(5, 5)">
    <path d="M 4 7.5 A 3.5 3.5 0 1 0 11 7.5 A 3.5 3.5 0 1 0 4 7.5 Z" fill="#FF0000"/>
  </g>
</svg>' > eye_comparison.svg

echo "Comparación visual guardada en: eye_comparison.svg"
echo ""

# Limpiar archivos temporales
rm -f unified_result.json separated_result.json

echo -e "${BLUE}=== Test completado ===${NC}"
echo ""
echo "RESUMEN DEL FIX NECESARIO:"
echo "- El modo unificado debe generar paths sólidos, no anillos"
echo "- Remover los segundos paths (M x+2 y+2...) que crean agujeros"
echo "- El centro debe ser parte integral de la forma, no un elemento separado"