#!/bin/bash

echo "🔍 Verificando corrección de Smart QR..."
echo "========================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 1. Verificar que el backend tiene el efecto correcto
echo -e "\n${YELLOW}1. Verificando template de Instagram en backend...${NC}"
grep -n "subtle-shadow\|shadow" backend/src/modules/smart-qr/config/initial-templates.ts | head -5

# 2. Probar generación de Smart QR
echo -e "\n${YELLOW}2. Probando generación de Smart QR con Instagram...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3004/api/v3/qr/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "data": "instagram.com",
    "options": {
      "error_correction": "M",
      "customization": {
        "gradient": {
          "enabled": true,
          "gradient_type": "radial",
          "colors": ["#833AB4", "#FD1D1D", "#FCAF45"],
          "apply_to_data": true,
          "apply_to_eyes": false
        },
        "eye_shape": "rounded_square",
        "data_pattern": "dots",
        "logo": {
          "data": "/logos/instagram.svg",
          "size_percentage": 30,
          "padding": 10,
          "shape": "rounded_square"
        },
        "effects": [{"effect_type": "shadow", "config": {}}]
      }
    }
  }')

# Verificar si la respuesta es exitosa
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Smart QR generado exitosamente!${NC}"
    echo "$RESPONSE" | jq '.metadata'
else
    echo -e "${RED}❌ Error al generar Smart QR:${NC}"
    echo "$RESPONSE" | jq '.'
fi

# 3. Verificar logs recientes de errores
echo -e "\n${YELLOW}3. Últimos errores en logs (si los hay):${NC}"
tail -n 5 backend/logs/error.log | grep "422\|QR" || echo -e "${GREEN}No hay errores recientes${NC}"

echo -e "\n========================================="
echo "✨ Verificación completada"