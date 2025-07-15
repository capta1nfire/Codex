#!/bin/bash

echo "🚀 QReable Gradual Load Testing"
echo "============================"
echo ""
echo "Este script ejecutará pruebas de carga graduales."
echo "Por favor, ingresa tus credenciales cuando se soliciten."
echo ""
echo "Las pruebas incluyen:"
echo "  1. Warm-up: 10 requests"
echo "  2. Light: 25 requests"
echo "  3. Moderate: 50 requests"
echo "  4. Standard: 100 requests"
echo "  5. Heavy: 200 requests"
echo "  6. Stress: 500 requests"
echo "  7. Peak: 1000 requests"
echo ""
echo "Presiona Enter para continuar..."
read

cd "/Users/inseqio/Codex Project"
node scripts/gradual-load-test.js