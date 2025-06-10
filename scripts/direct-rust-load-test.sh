#!/bin/bash

# Direct Rust service load test (bypassing Express rate limiter)

echo "🚀 Direct Rust QR Engine v2 Load Test"
echo "====================================="
echo "Testing directly against Rust service on port 3002"
echo ""

# Arrays for variation
EYE_SHAPES=("square" "circle" "rounded" "star" "diamond")
DATA_PATTERNS=("square" "dots" "rounded" "classic" "sharp")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1" "#F7DC6F" "#BB8FCE")

echo "Generating 200 requests directly to Rust service..."
echo ""

count=0
success=0
failed=0

for i in {1..200}; do
  # Random selections
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color=${COLORS[$RANDOM % ${#COLORS[@]}]}
  
  # Make direct request to Rust service
  response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3002/api/qr/generate \
    -H "Content-Type: application/json" \
    -d "{
      \"data\": \"https://rust-direct-test.example.com/test-$i-$(date +%s%N)\",
      \"options\": {
        \"size\": 300,
        \"eyeShape\": \"$eye\",
        \"dataPattern\": \"$pattern\",
        \"foregroundColor\": \"$color\",
        \"backgroundColor\": \"#FFFFFF\",
        \"errorCorrection\": \"M\"
      }
    }")
  
  # Extract HTTP status code
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" == "200" ]; then
    ((success++))
  else
    ((failed++))
  fi
  
  ((count++))
  
  # Progress update
  if (( count % 20 == 0 )); then
    echo "Progress: $count/200 (Success: $success, Failed: $failed)"
  fi
done

echo ""
echo "✅ Direct load test completed!"
echo ""
echo "📊 Results:"
echo "- Total requests: $count"
echo "- Successful: $success"
echo "- Failed: $failed"
echo "- Success rate: $(( success * 100 / count ))%"
echo ""

# Get performance metrics directly from Rust
echo "📈 Rust Service Performance Metrics:"
curl -s http://localhost:3002/analytics/performance | jq '.overall' 2>/dev/null

echo ""
echo "📊 Barcode-specific metrics:"
curl -s http://localhost:3002/analytics/performance | jq '.by_barcode_type.qrcode' 2>/dev/null

echo ""
echo "💡 Note: These metrics are from direct Rust service calls,"
echo "   bypassing the Express rate limiter."