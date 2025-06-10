#!/bin/bash

# Intensive load test for QR Engine v2

echo "🚀 Starting INTENSIVE QR Engine v2 Load Test..."
echo "This will generate 500 requests with varying complexity"
echo ""

# Arrays for variation
EYE_SHAPES=("square" "circle" "rounded" "star" "diamond")
DATA_PATTERNS=("square" "dots" "rounded" "classic" "sharp")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1" "#F7DC6F" "#BB8FCE" "#85C1E2" "#F8B739" "#52BE80")
SIZES=(200 250 300 350 400)

echo "Testing with various QR customization options..."
echo ""

# Counter for progress
count=0

# Generate 500 requests with different configurations
for i in {1..500}; do
  # Random selections
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color=${COLORS[$RANDOM % ${#COLORS[@]}]}
  size=${SIZES[$RANDOM % ${#SIZES[@]}]}
  
  # Generate unique data with timestamp
  timestamp=$(date +%s%N)
  
  curl -s -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -d "{
      \"data\": \"https://test.example.com/load-test-intensive-$i-$timestamp\",
      \"options\": {
        \"size\": $size,
        \"eyeShape\": \"$eye\",
        \"dataPattern\": \"$pattern\",
        \"foregroundColor\": \"$color\",
        \"backgroundColor\": \"#FFFFFF\",
        \"errorCorrection\": \"H\",
        \"margin\": 2,
        \"customEyeColor\": true,
        \"gradientType\": \"linear\",
        \"gradientColors\": [\"$color\", \"#FFFFFF\"]
      }
    }" > /dev/null &
  
  # Increment counter
  ((count++))
  
  # Limit concurrent requests to 25
  if (( count % 25 == 0 )); then
    wait
    echo "Completed $count requests..."
  fi
done

wait
echo ""
echo "✅ Intensive load test completed!"
echo ""

# Get performance metrics
echo "📊 Fetching performance metrics..."
echo ""

echo "=== QR Engine v2 Performance ==="
curl -s http://localhost:3002/analytics/performance | jq '.overall' 2>/dev/null || echo "Unable to fetch Rust analytics"

echo ""
echo "=== Cache Statistics ==="
curl -s http://localhost:3002/cache/stats | jq '.' 2>/dev/null || echo "Unable to fetch cache stats"

echo ""
echo "📈 Monitor the QR v2 Analytics Dashboard for detailed metrics!"
echo "The dashboard updates every 60 seconds."
echo ""
echo "Key metrics to watch:"
echo "- Average response time (should stay < 50ms)"
echo "- Cache hit rate (should increase over time)"
echo "- P95 response time (should stay < 100ms)"
echo "- Error rate (should remain 0%)"