#!/bin/bash

echo "🔍 Checking effects in generated SVG"
echo "==================================="

# Generate a QR with effects and save full SVG
echo -e "\nGenerating QR with shadow effect..."
curl -s -X POST http://localhost:3002/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Effects test with advanced complexity",
    "options": {
      "size": 400,
      "eye_shape": "rounded-square",
      "data_pattern": "dots",
      "gradient": {
        "type": "linear",
        "colors": ["#3B82F6", "#8B5CF6"],
        "angle": 45
      },
      "effects": [
        {
          "type": "shadow",
          "intensity": 3.0,
          "color": "#000000"
        }
      ]
    }
  }' | jq -r '.svg' > check-effects.svg

echo "✅ Saved to check-effects.svg"
echo ""
echo "Checking for filter definitions in SVG:"
echo "======================================="

# Check if defs section exists
if grep -q "<defs>" check-effects.svg; then
    echo "✅ Found <defs> section"
    
    # Check for filter definitions
    if grep -q "<filter" check-effects.svg; then
        echo "✅ Found filter definitions"
        echo ""
        echo "Filter content:"
        grep -A5 "<filter" check-effects.svg | head -20
    else
        echo "❌ No filter definitions found"
    fi
else
    echo "❌ No <defs> section found"
fi

echo ""
echo "Checking for filter application:"
echo "================================"

# Check if filter is applied
if grep -q 'filter="url(#' check-effects.svg || grep -q 'style="filter:' check-effects.svg; then
    echo "✅ Filter is applied to elements"
    grep -E '(filter="|style="filter:)' check-effects.svg | head -5
else
    echo "❌ No filter application found"
fi