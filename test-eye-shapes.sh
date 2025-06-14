#!/bin/bash

echo "🧪 Probando formas de ojos personalizadas..."

# Test 1: Ojos circulares con gradiente
echo -n "Test 1 - Ojos circulares + gradiente: "
RESPONSE=$(curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test Eye Shapes",
    "options": {
      "size": 400,
      "eye_shape": "circle",
      "foreground_color": "#000000",
      "background_color": "#FFFFFF",
      "gradient": {
        "type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "angle": 45
      }
    }
  }')

if echo "$RESPONSE" | jq -r '.svg' | grep -q '<path.*M.*m.*a.*/>'; then
  echo "✅ Ojos circulares detectados"
else
  echo "❌ Ojos circulares NO detectados"
fi

# Test 2: Ojos con rounded square
echo -n "Test 2 - Ojos rounded-square: "
RESPONSE=$(curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test Rounded Eyes",
    "options": {
      "size": 400,
      "eye_shape": "rounded-square",
      "foreground_color": "#2563EB",
      "background_color": "#FFFFFF"
    }
  }')

if echo "$RESPONSE" | jq -r '.svg' | grep -q '<path.*a.*/>'; then
  echo "✅ Ojos rounded detectados"
  
  # Guardar SVG para inspección visual
  echo "$RESPONSE" | jq -r '.svg' > test-rounded-eyes.svg
  echo "   Guardado en: test-rounded-eyes.svg"
else
  echo "❌ Ojos rounded NO detectados"
fi

# Test 3: Verificar estructura de ojos personalizados
echo -e "\n📋 Analizando estructura de ojos:"
echo "$RESPONSE" | jq -r '.svg' | grep -E '<path.*d=.*fill=' | head -6

echo -e "\n✨ Pruebas completadas!"