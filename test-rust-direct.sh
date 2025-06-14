#!/bin/bash

echo "🧪 Probando directamente el servicio Rust..."

# Test 1: Endpoint v2 directo
echo -n "Test 1 - Endpoint v2 con gradiente: "
RESPONSE=$(curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Test Gradient",
    "options": {
      "size": 400,
      "gradient": {
        "type": "linear", 
        "colors": ["#FF0000", "#0000FF"],
        "angle": 45
      }
    }
  }')

if [ -n "$RESPONSE" ]; then
  echo "✅ Respuesta recibida"
  echo "$RESPONSE" | jq '.' | head -20
else
  echo "❌ Sin respuesta"
fi

# Test 2: Verificar estructura
echo -e "\n📋 Analizando respuesta..."
if echo "$RESPONSE" | jq -r '.svg' | grep -q "linearGradient"; then
  echo "✅ Gradiente encontrado en SVG"
else
  echo "❌ Gradiente NO encontrado"
  echo "SVG devuelto:"
  echo "$RESPONSE" | jq -r '.svg' | head -30
fi