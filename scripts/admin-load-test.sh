#!/bin/bash

# Admin authenticated load test for QR Engine v2

echo "🔐 Admin QR Engine v2 Load Test"
echo "==============================="
echo ""

# Login with admin credentials
echo "🔑 Authenticating as admin..."

AUTH_RESPONSE=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@codex.com",
    "password": "admin123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | jq -r '.token' 2>/dev/null)
USER_ROLE=$(echo $AUTH_RESPONSE | jq -r '.user.role' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Authenticated successfully!"
echo "👤 User role: $USER_ROLE"
echo ""

echo "🚀 Starting authenticated load test..."
echo "Generating 200 requests with admin token..."
echo ""

# Test configurations
EYE_SHAPES=("square" "circle" "rounded" "star" "diamond")
DATA_PATTERNS=("square" "dots" "rounded" "classic" "sharp")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1" "#F7DC6F" "#BB8FCE" "#85C1E2" "#52BE80")
EFFECTS=("shadow" "glow" "bevel" "none")

count=0
success=0
failed=0
start_time=$(date +%s)

for i in {1..200}; do
  # Random configurations
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color1=${COLORS[$RANDOM % ${#COLORS[@]}]}
  color2=${COLORS[$RANDOM % ${#COLORS[@]}]}
  effect=${EFFECTS[$RANDOM % ${#EFFECTS[@]}]}
  size=$((250 + RANDOM % 150))
  
  # Generate QR with authentication
  response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"data\": \"https://admin-test.codex.com/qr-$i-$(date +%s%N)\",
      \"options\": {
        \"size\": $size,
        \"eyeShape\": \"$eye\",
        \"dataPattern\": \"$pattern\",
        \"foregroundColor\": \"$color1\",
        \"backgroundColor\": \"#FFFFFF\",
        \"errorCorrection\": \"H\",
        \"margin\": 2,
        \"customEyeColor\": true,
        \"gradientType\": \"linear\",
        \"gradientColors\": [\"$color1\", \"$color2\"],
        \"effect\": \"$effect\"
      }
    }")
  
  # Check status
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" == "200" ]; then
    ((success++))
  else
    ((failed++))
    if [ $failed -le 5 ]; then
      echo "Failed request $i: HTTP $http_code"
      echo "$response" | head -n-1 | jq '.' 2>/dev/null || echo "$response"
    fi
  fi
  
  ((count++))
  
  # Progress update
  if (( count % 25 == 0 )); then
    echo "Progress: $count/200 (✅ Success: $success, ❌ Failed: $failed)"
  fi
  
  # Small delay to avoid overwhelming the server
  if (( count % 50 == 0 )); then
    sleep 0.5
  fi
done

end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "✅ Load test completed in ${duration} seconds!"
echo ""
echo "📊 Test Results:"
echo "=================="
echo "Total requests: $count"
echo "Successful: $success ✅"
echo "Failed: $failed ❌"
echo "Success rate: $(( success * 100 / count ))%"
echo "Average time per request: $(( duration * 1000 / count ))ms"
echo ""

# Get analytics with auth token
echo "📈 Fetching QR v2 Analytics..."
echo ""

ANALYTICS=$(curl -s http://localhost:3004/api/qr/analytics \
  -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ]; then
  echo "Overview Metrics:"
  echo "$ANALYTICS" | jq '.overview' 2>/dev/null
  
  echo ""
  echo "Performance (Last 24h):"
  echo "$ANALYTICS" | jq '.performance.last24Hours' 2>/dev/null
  
  echo ""
  echo "Feature Usage:"
  echo "$ANALYTICS" | jq '.features.usage' 2>/dev/null
else
  echo "❌ Failed to fetch analytics"
fi

echo ""
echo "💡 The QR v2 Analytics Dashboard should now show updated metrics!"