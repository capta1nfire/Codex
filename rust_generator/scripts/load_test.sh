#!/bin/bash

# QR Engine v2 Load Testing Script
# Tests performance with high volumes and distributed cache

set -e

# Configuration
BASE_URL="http://localhost:3002"
CONCURRENT_REQUESTS=50
TOTAL_REQUESTS=10000
DURATION="30s"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== QR Engine v2 Load Testing ===${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Checking services...${NC}"
if ! curl -s "${BASE_URL}/health" > /dev/null; then
    echo -e "${RED}Error: Rust generator service is not running on port 3002${NC}"
    exit 1
fi

if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}Warning: Redis is not running. Cache tests will fail.${NC}"
fi

echo -e "${GREEN}Services are running ✓${NC}"
echo ""

# Clear cache before testing
echo -e "${YELLOW}Clearing cache...${NC}"
curl -s -X POST "${BASE_URL}/api/qr/cache/clear" | jq '.'
echo ""

# Create test payloads
echo -e "${YELLOW}Creating test payloads...${NC}"
cat > /tmp/qr_basic.json << EOF
{
  "data": "https://example.com/test",
  "size": 300,
  "customization": null
}
EOF

cat > /tmp/qr_medium.json << EOF
{
  "data": "https://example.com/test",
  "size": 300,
  "customization": {
    "eye_shape": "circle",
    "data_pattern": "dots",
    "foreground_color": "#000000",
    "background_color": "#FFFFFF"
  }
}
EOF

cat > /tmp/qr_advanced.json << EOF
{
  "data": "https://example.com/test",
  "size": 500,
  "customization": {
    "eye_shape": "rounded",
    "data_pattern": "rounded",
    "gradient": {
      "type": "linear",
      "colors": ["#FF6B6B", "#4ECDC4"],
      "angle": 45
    },
    "frame": {
      "style": "rounded",
      "text": "Scan Me",
      "color": "#333333"
    }
  }
}
EOF

echo -e "${GREEN}Test payloads created ✓${NC}"
echo ""

# Function to run load test
run_load_test() {
    local test_name=$1
    local endpoint=$2
    local payload_file=$3
    local rate=$4
    
    echo -e "${YELLOW}Running ${test_name} test...${NC}"
    echo "Endpoint: ${endpoint}"
    echo "Rate: ${rate} requests/second"
    echo ""
    
    # Using Apache Bench if available
    if command -v ab &> /dev/null; then
        ab -n $TOTAL_REQUESTS -c $CONCURRENT_REQUESTS -T 'application/json' -p $payload_file "${BASE_URL}${endpoint}"
    # Using hey if available (better tool)
    elif command -v hey &> /dev/null; then
        hey -n $TOTAL_REQUESTS -c $CONCURRENT_REQUESTS -m POST -T 'application/json' -D $payload_file "${BASE_URL}${endpoint}"
    # Using wrk if available
    elif command -v wrk &> /dev/null; then
        cat > /tmp/wrk_script.lua << EOF
wrk.method = "POST"
wrk.body   = io.open("$payload_file", "r"):read("*all")
wrk.headers["Content-Type"] = "application/json"
EOF
        wrk -t12 -c$CONCURRENT_REQUESTS -d$DURATION -s /tmp/wrk_script.lua --latency "${BASE_URL}${endpoint}"
    else
        echo -e "${RED}Error: No load testing tool found. Install ab, hey, or wrk.${NC}"
        echo "Install suggestions:"
        echo "  macOS: brew install hey wrk"
        echo "  Ubuntu: apt-get install apache2-utils wrk"
        return 1
    fi
    
    echo ""
}

# Test 1: Basic QR generation (no cache)
echo -e "${GREEN}=== Test 1: Basic QR Generation ===${NC}"
run_load_test "Basic QR" "/api/qr/generate" "/tmp/qr_basic.json" 100

# Get cache stats
echo -e "${YELLOW}Cache stats after basic test:${NC}"
curl -s "${BASE_URL}/api/qr/cache/stats" | jq '.'
echo ""

# Test 2: Basic QR with cache hits
echo -e "${GREEN}=== Test 2: Basic QR with Cache Hits ===${NC}"
echo "Running same requests to test cache performance..."
run_load_test "Basic QR (Cached)" "/api/qr/generate" "/tmp/qr_basic.json" 200

# Get cache stats
echo -e "${YELLOW}Cache stats after cache hit test:${NC}"
curl -s "${BASE_URL}/api/qr/cache/stats" | jq '.'
echo ""

# Test 3: Medium complexity
echo -e "${GREEN}=== Test 3: Medium Complexity QR ===${NC}"
run_load_test "Medium QR" "/api/qr/generate" "/tmp/qr_medium.json" 50

# Test 4: Advanced complexity
echo -e "${GREEN}=== Test 4: Advanced Complexity QR ===${NC}"
run_load_test "Advanced QR" "/api/qr/generate" "/tmp/qr_advanced.json" 20

# Test 5: Batch generation
echo -e "${GREEN}=== Test 5: Batch Generation ===${NC}"
cat > /tmp/qr_batch.json << EOF
{
  "requests": [
    {"id": "1", "data": "https://example.com/1", "size": 200},
    {"id": "2", "data": "https://example.com/2", "size": 200},
    {"id": "3", "data": "https://example.com/3", "size": 200},
    {"id": "4", "data": "https://example.com/4", "size": 200},
    {"id": "5", "data": "https://example.com/5", "size": 200}
  ]
}
EOF
run_load_test "Batch (5 QRs)" "/api/qr/batch" "/tmp/qr_batch.json" 10

# Final cache stats
echo -e "${GREEN}=== Final Cache Statistics ===${NC}"
curl -s "${BASE_URL}/api/qr/cache/stats" | jq '.'
echo ""

# Performance analytics
echo -e "${GREEN}=== Performance Analytics ===${NC}"
curl -s "${BASE_URL}/analytics/performance" | jq '.'
echo ""

# Cleanup
rm -f /tmp/qr_*.json /tmp/wrk_script.lua

echo -e "${GREEN}Load testing completed!${NC}"