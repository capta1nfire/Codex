#!/bin/bash

# Authenticated load test for QR Engine v2

echo "🔐 Authenticated QR Engine v2 Load Test"
echo "========================================"
echo ""

# Get auth token (you'll need to replace these with valid credentials)
echo "🔑 Getting authentication token..."

# Login to get token
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed. Please check credentials."
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful!"
echo ""

echo "🚀 Starting load test with authentication..."
echo "Generating 100 authenticated requests..."
echo ""

# Arrays for variation
EYE_SHAPES=("square" "circle" "rounded")
DATA_PATTERNS=("square" "dots" "rounded")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1")

# Generate requests
count=0
for i in {1..100}; do
  # Random selections
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color=${COLORS[$RANDOM % ${#COLORS[@]}]}
  
  curl -s -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"data\": \"https://test.auth.example.com/test-$i-$(date +%s%N)\",
      \"options\": {
        \"size\": 300,
        \"eyeShape\": \"$eye\",
        \"dataPattern\": \"$pattern\",
        \"foregroundColor\": \"$color\",
        \"backgroundColor\": \"#FFFFFF\"
      }
    }" > /dev/null &
  
  ((count++))
  
  # Limit concurrent requests
  if (( count % 10 == 0 )); then
    wait
    echo "Completed $count requests..."
  fi
done

wait
echo ""
echo "✅ Load test completed!"
echo ""

# Fetch analytics using auth token
echo "📊 Fetching authenticated analytics..."
ANALYTICS=$(curl -s http://localhost:3004/api/qr/analytics \
  -H "Authorization: Bearer $TOKEN")

echo "$ANALYTICS" | jq '.overview' 2>/dev/null || echo "Unable to fetch analytics"

echo ""
echo "📈 Check the QR v2 Analytics Dashboard for updated metrics!"