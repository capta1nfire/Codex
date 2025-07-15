#!/bin/bash

echo "Testing Heart Eye Shape - Simple Request"
echo "========================================"

# Test 1: Heart shape básico
echo -e "\n1. Heart shape básico:"
curl -X POST http://localhost:3004/api/v3/qr/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "data": "TEST HEART",
    "options": {
      "error_correction": "H",
      "customization": {
        "eye_shape": "heart",
        "colors": {
          "foreground": "#FF0066",
          "background": "#FFFFFF"
        }
      }
    }
  }' | jq '.paths.eyes[0]' | head -20

# Test 2: Heart con gradientes independientes
echo -e "\n\n2. Heart con gradientes independientes:"
curl -X POST http://localhost:3004/api/v3/qr/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "data": "HEART GRADIENT TEST",
    "options": {
      "error_correction": "H",
      "customization": {
        "eye_shape": "heart",
        "colors": {
          "foreground": "#000000",
          "background": "#FFFFFF"
        },
        "eye_border_gradient": {
          "enabled": true,
          "gradient_type": "linear",
          "colors": ["#FF0000", "#FF00FF"],
          "angle": 45
        },
        "eye_center_gradient": {
          "enabled": true,
          "gradient_type": "radial",
          "colors": ["#00FF00", "#0000FF"]
        }
      }
    }
  }' | jq '.definitions'