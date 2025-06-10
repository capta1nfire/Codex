#!/bin/bash

# QR Engine v2 Load Test using browser token

echo "🔐 QR Engine v2 Load Test with Browser Token"
echo "==========================================="
echo ""
echo "📝 Instructions:"
echo "1. Open your browser's Developer Tools (F12)"
echo "2. Go to the Application/Storage tab"
echo "3. Find localStorage -> authToken"
echo "4. Copy the token value"
echo ""
echo -n "Please paste your auth token here: "
read TOKEN

if [ -z "$TOKEN" ]; then
  echo "❌ No token provided"
  exit 1
fi

echo ""
echo "✅ Token received, starting test..."
echo ""

# Test the token first
USER_INFO=$(curl -s http://localhost:3004/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

USER_ROLE=$(echo $USER_INFO | jq -r '.user.role' 2>/dev/null)
USER_EMAIL=$(echo $USER_INFO | jq -r '.user.email' 2>/dev/null)

if [ "$USER_ROLE" == "null" ]; then
  echo "❌ Invalid token or authentication failed"
  exit 1
fi

echo "👤 Authenticated as: $USER_EMAIL"
echo "🔑 Role: $USER_ROLE"
echo ""

# Valid schema values
EYE_SHAPES=("square" "circle" "rounded-square" "dot" "star" "diamond")
DATA_PATTERNS=("square" "dots" "rounded" "vertical" "horizontal" "diamond")
COLORS=("#FF6B6B" "#4ECDC4" "#45B7D1" "#F7DC6F" "#BB8FCE")

echo "🚀 Starting load test with 50 requests..."
echo ""

count=0
success=0
failed=0

for i in {1..50}; do
  eye=${EYE_SHAPES[$RANDOM % ${#EYE_SHAPES[@]}]}
  pattern=${DATA_PATTERNS[$RANDOM % ${#DATA_PATTERNS[@]}]}
  color=${COLORS[$RANDOM % ${#COLORS[@]}]}
  
  # Simple valid request
  response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3004/api/qr/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"data\": \"https://browser-test.codex.com/qr-$i-$(date +%s)\",
      \"options\": {
        \"size\": 300,
        \"eyeShape\": \"$eye\",
        \"dataPattern\": \"$pattern\",
        \"foregroundColor\": \"$color\",
        \"backgroundColor\": \"#FFFFFF\"
      }
    }")
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" == "200" ]; then
    ((success++))
  else
    ((failed++))
  fi
  
  ((count++))
  
  if (( count % 10 == 0 )); then
    echo "Progress: $count/50 (✅ Success: $success, ❌ Failed: $failed)"
  fi
done

echo ""
echo "✅ Test completed!"
echo "Total: $count, Success: $success, Failed: $failed"
echo ""

# Fetch analytics
echo "📊 Fetching analytics..."
ANALYTICS=$(curl -s http://localhost:3004/api/qr/analytics \
  -H "Authorization: Bearer $TOKEN")

echo "$ANALYTICS" | jq '.overview' 2>/dev/null

echo ""
echo "✨ Check your QR v2 Analytics Dashboard for updated metrics!"