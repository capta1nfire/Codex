#!/bin/bash

# Quick load test for QR Engine v2

echo "🚀 Starting QR Engine v2 Load Test..."
echo "This will generate 100 requests to test performance impact"
echo ""

# Generate 100 requests in parallel using background jobs
echo "Generating load..."
for i in {1..100}; do
  curl -s -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -d "{
      \"data\": \"https://example.com/test-$i-$(date +%s)\",
      \"options\": {
        \"size\": 300,
        \"eyeShape\": \"circle\",
        \"dataPattern\": \"dots\",
        \"foregroundColor\": \"#000000\",
        \"backgroundColor\": \"#FFFFFF\"
      }
    }" > /dev/null &
  
  # Limit concurrent requests to 10
  if (( i % 10 == 0 )); then
    wait
    echo "Completed $i requests..."
  fi
done

wait
echo ""
echo "✅ Load test completed!"
echo ""

# Get current analytics
echo "📊 Fetching current analytics..."
curl -s http://localhost:3002/analytics/performance | jq '.by_barcode_type.qrcode' 2>/dev/null || echo "Unable to fetch analytics"

echo ""
echo "Check the QR v2 Analytics Dashboard to see the impact on metrics!"
echo "The dashboard updates every 60 seconds."