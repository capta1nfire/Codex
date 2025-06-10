#!/bin/bash

# Test script to verify SUPERADMIN rate limit bypass

echo "Testing SUPERADMIN rate limit bypass..."

# First, we need a SUPERADMIN token. Let's check if there's a test user or create one
# For now, let's just test the endpoint behavior

# Test 1: Make many requests without authentication (should hit rate limit)
echo -e "\n1. Testing without authentication (should hit rate limit after 500 requests for QR):"
for i in {1..10}; do
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3004/api/generate \
    -H "Content-Type: application/json" \
    -d '{"barcode_type":"qrcode","data":"test'$i'"}' 2>/dev/null)
  
  http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
  echo "Request $i: Status $http_status"
  
  if [ "$http_status" = "429" ]; then
    echo "Rate limit hit at request $i"
    break
  fi
done

# Test 2: Check if the skip logic is being called by checking logs
echo -e "\n2. Checking recent logs for rate limit messages:"
pm2 logs codex-backend --lines 100 --nostream | grep -i "rate limit" | tail -5

echo -e "\nNote: To properly test SUPERADMIN bypass, you need:"
echo "1. A SUPERADMIN user account"
echo "2. A valid JWT token for that user"
echo "3. Make requests with Authorization: Bearer <token>"