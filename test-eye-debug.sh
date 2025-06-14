#!/bin/bash

echo "🔍 Debug de formas de ojos..."

# Test con múltiples características para forzar nivel Advanced
RESPONSE=$(curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Eye Shape Test",
    "options": {
      "size": 300,
      "eye_shape": "rounded-square",
      "foreground_color": "#000000",
      "background_color": "#FFFFFF",
      "gradient": {
        "type": "linear",
        "colors": ["#FF0000", "#0000FF"]
      }
    }
  }')

# Guardar el SVG completo
echo "$RESPONSE" | jq -r '.svg' > eye-shape-test.svg

# Analizar estructura
echo "📊 Metadata:"
echo "$RESPONSE" | jq '.metadata'

echo -e "\n🔍 Buscando elementos de ojos:"
echo "$RESPONSE" | jq -r '.svg' | grep -E '(<g|<path|<rect)' | head -20

echo -e "\n💾 SVG guardado en: eye-shape-test.svg"