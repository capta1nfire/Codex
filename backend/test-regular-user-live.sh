#!/bin/bash

echo "Testing regular USER rate limiting on live server..."

# First, login as regular user to get token
echo -e "\n1. Logging in as regular USER (user@codex.com)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@codex.com","password":"user123"}')

# Extract token using grep and sed
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login as USER"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Successfully logged in as regular USER"
echo "Token (first 20 chars): ${TOKEN:0:20}..."

# Extract user info
USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | sed 's/"role":"//')
echo "User role: $USER_ROLE"

# Test rate limiting
echo -e "\n2. Testing rate limiting - making 20 rapid requests..."
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0

for i in {1..20}; do
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3004/api/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"barcode_type":"qrcode","data":"user-test-'$i'"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  
  if [ "$HTTP_CODE" = "200" ]; then
    ((SUCCESS_COUNT++))
    echo "Request $i: ✅ Success (200)"
  elif [ "$HTTP_CODE" = "429" ]; then
    ((RATE_LIMIT_COUNT++))
    echo "Request $i: ❌ Rate Limited (429)"
  else
    echo "Request $i: ⚠️ Unexpected status: $HTTP_CODE"
  fi
done

echo -e "\n📊 Results for regular USER:"
echo "Total requests: 20"
echo "Successful: $SUCCESS_COUNT"
echo "Rate limited: $RATE_LIMIT_COUNT"

echo -e "\n3. Testing anonymous user (no auth) rate limiting..."
ANON_SUCCESS=0
ANON_RATE_LIMIT=0

for i in {1..10}; do
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:3004/api/generate \
    -H "Content-Type: application/json" \
    -d '{"barcode_type":"qrcode","data":"anon-test-'$i'"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  
  if [ "$HTTP_CODE" = "200" ]; then
    ((ANON_SUCCESS++))
  elif [ "$HTTP_CODE" = "429" ]; then
    ((ANON_RATE_LIMIT++))
  fi
done

echo -e "\n📊 Results for anonymous requests:"
echo "Total requests: 10"
echo "Successful: $ANON_SUCCESS"
echo "Rate limited: $ANON_RATE_LIMIT"