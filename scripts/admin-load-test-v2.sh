#!/bin/bash

# Admin authenticated load test for QR Engine v2 - Fixed version

echo "🔐 Admin QR Engine v2 Load Test (Fixed)"
echo "======================================="
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
echo "Generating 200 requests with valid schema..."
echo ""

# Valid values according to schema
EYE_SHAPES=("square" "circle" "rounded-square" "dot" "star" "diamond")
DATA_PATTERNS=("square" "dots" "rounded" "vertical" "horizontal" "diamond" "circular" "star")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1" "#F7DC6F" "#BB8FCE" "#85C1E2" "#52BE80")
EFFECTS=("shadow" "glow" "blur")

count=0
success=0
failed=0
start_time=$(date +%s)

for i in {1..200}; do
  # Random configurations with valid values
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color1=${COLORS[$RANDOM % ${#COLORS[@]}]}
  color2=${COLORS[$RANDOM % ${#COLORS[@]}]}
  effect=${EFFECTS[$RANDOM % ${#EFFECTS[@]}]}
  size=$((250 + RANDOM % 150))
  
  # Build valid request according to schema
  request_body=$(cat <<EOF
{
  "data": "https://admin-test.codex.com/qr-$i-$(date +%s%N)",
  "options": {
    "size": $size,
    "eyeShape": "$eye",
    "dataPattern": "$pattern",
    "foregroundColor": "$color1",
    "backgroundColor": "#FFFFFF",
    "eyeColor": "$color2",
    "errorCorrection": "H",
    "margin": 2,
    "gradient": {
      "type": "linear",
      "colors": ["$color1", "$color2"],
      "angle": 45
    },
    "effects": [
      {
        "type": "$effect",
        "intensity": 30
      }
    ],
    "optimizeForSize": false,
    "enableCache": true
  }
}
EOF
)
  
  # Generate QR with authentication
  response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$request_body")
  
  # Check status
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" == "200" ]; then
    ((success++))
  else
    ((failed++))
    if [ $failed -le 3 ]; then
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
echo "Requests per second: $(( count / duration ))"
echo ""

# Get analytics with auth token
echo "📈 Fetching QR v2 Analytics..."
echo ""

ANALYTICS=$(curl -s http://localhost:3004/api/qr/analytics \
  -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ] && [ "$ANALYTICS" != "null" ]; then
  echo "📊 Overview Metrics:"
  echo "$ANALYTICS" | jq '.overview' 2>/dev/null
  
  echo ""
  echo "⚡ Performance (Last 24h):"
  echo "$ANALYTICS" | jq '.performance.last24Hours' 2>/dev/null
  
  echo ""
  echo "🎨 Feature Usage:"
  echo "$ANALYTICS" | jq '.features.usage' 2>/dev/null
  
  echo ""
  echo "💾 Cache Statistics:"
  echo "$ANALYTICS" | jq '.cache' 2>/dev/null
else
  echo "❌ Failed to fetch analytics"
fi

echo ""
echo "💡 The QR v2 Analytics Dashboard should now show updated metrics!"
echo "   Dashboard updates every 60 seconds automatically."