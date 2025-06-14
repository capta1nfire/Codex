#!/bin/bash

echo "🧪 Probando gradientes en QR Engine v2..."

# Test 1: Gradiente lineal
echo -n "Test 1 - Gradiente lineal: "
RESPONSE=$(curl -s -X POST http://localhost:3004/api/v2/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "https://example.com",
    "options": {
      "size": 400,
      "gradient": {
        "type": "linear",
        "colors": ["#FF0000", "#0000FF"],
        "angle": 45,
        "applyToData": true,
        "applyToEyes": false
      }
    }
  }')

if echo "$RESPONSE" | jq -r '.data' | grep -q "linearGradient"; then
  echo "✅ FUNCIONA"
else
  echo "❌ NO FUNCIONA"
  echo "Respuesta: $(echo "$RESPONSE" | jq -r '.data' | head -5)"
fi

# Test 2: Gradiente radial
echo -n "Test 2 - Gradiente radial: "
RESPONSE=$(curl -s -X POST http://localhost:3004/api/v2/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test Radial",
    "options": {
      "gradient": {
        "type": "radial",
        "colors": ["#00FF00", "#FF00FF"]
      }
    }
  }')

if echo "$RESPONSE" | jq -r '.data' | grep -q "radialGradient"; then
  echo "✅ FUNCIONA"
else
  echo "❌ NO FUNCIONA"
fi

# Test 3: Verificar estructura SVG
echo -e "\n📋 Estructura SVG del último QR:"
echo "$RESPONSE" | jq -r '.data' | head -30 | grep -E "(defs|gradient|fill)"

echo -e "\n✨ Pruebas completadas!"