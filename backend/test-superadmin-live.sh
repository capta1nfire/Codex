#!/bin/bash

echo "Testing SUPERADMIN rate limit bypass on live server..."

# First, login as SUPERADMIN to get token
echo -e "\n1. Logging in as SUPERADMIN (admin@codex.com)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@codex.com","password":"admin123"}')

# Extract token using grep and sed
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login as SUPERADMIN"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Successfully logged in as SUPERADMIN"
echo "Token (first 20 chars): ${TOKEN:0:20}..."

# Extract user info
USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | sed 's/"role":"//')
echo "User role: $USER_ROLE"

# Test rate limit bypass
echo -e "\n2. Testing rate limit bypass - making 20 rapid requests..."
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0

for i in {1..20}; do
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3004/api/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"barcode_type":"qrcode","data":"superadmin-test-'$i'"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  
  if [ "$HTTP_CODE" = "200" ]; then
    ((SUCCESS_COUNT++))
    echo "Request $i: ✅ Success (200)"
  elif [ "$HTTP_CODE" = "429" ]; then
    ((RATE_LIMIT_COUNT++))
    echo "Request $i: ❌ Rate Limited (429)"
    # Extract error message
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*' | sed 's/"message":"//')
    echo "  Error: $ERROR_MSG"
  else
    echo "Request $i: ⚠️ Unexpected status: $HTTP_CODE"
  fi
done

echo -e "\n📊 Results for SUPERADMIN:"
echo "Total requests: 20"
echo "Successful: $SUCCESS_COUNT"
echo "Rate limited: $RATE_LIMIT_COUNT"

if [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
  echo -e "\n❌ SUPERADMIN is being rate limited! This is a bug."
else
  echo -e "\n✅ SUPERADMIN successfully bypassed rate limits!"
fi

# Check logs for SUPERADMIN skip messages
echo -e "\n3. Checking server logs for rate limit skip messages..."
pm2 logs codex-backend --lines 50 --nostream | grep -i "SUPERADMIN detected" | tail -5