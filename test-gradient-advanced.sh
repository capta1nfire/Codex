#!/bin/bash

echo "🧪 Probando gradientes con nivel Advanced..."

# Test con múltiples características para forzar nivel Advanced
echo -n "Test - Gradiente + Colors + EyeShape (3 features): "
RESPONSE=$(curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test Advanced Gradient",
    "options": {
      "size": 400,
      "eye_shape": "rounded-square",
      "foreground_color": "#000000",
      "background_color": "#FFFFFF",
      "gradient": {
        "type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "angle": 45
      }
    }
  }')

if echo "$RESPONSE" | jq -r '.svg' | grep -q "linearGradient"; then
  echo "✅ GRADIENTE FUNCIONANDO!"
  echo -e "\n📋 Estructura del gradiente:"
  echo "$RESPONSE" | jq -r '.svg' | grep -A5 -B5 "linearGradient" | head -20
else
  echo "❌ Gradiente NO encontrado"
  # Mostrar inicio del SVG para debug
  echo -e "\nPrimeras líneas del SVG:"
  echo "$RESPONSE" | jq -r '.svg' | head -20
fi

# Verificar metadata
echo -e "\n📊 Metadata:"
echo "$RESPONSE" | jq '.metadata'