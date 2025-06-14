#!/bin/bash

echo "🔍 QR Engine v2 - Debug Test"
echo "============================"

# Test with effects and show full response
echo -e "\nTesting effects generation with full response:"
curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Effects debug test",
    "options": {
      "size": 400,
      "eye_shape": "rounded-square",
      "effects": [
        {
          "type": "shadow",
          "intensity": 3.0,
          "color": "#000000"
        }
      ]
    }
  }' | jq '.'

echo -e "\n\nChecking if effects are in metadata:"
curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Effects test",
    "options": {
      "size": 400,
      "effects": [
        {
          "type": "shadow",
          "intensity": 3.0
        }
      ]
    }
  }' | jq '.metadata'