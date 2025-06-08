#!/bin/bash

# Frontend Development Server with Auto-Restart

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎨 Starting Frontend Development Server${NC}"

# Set environment variables
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=4096"

# Kill any existing processes on port 3000
echo -e "${YELLOW}Cleaning up port 3000...${NC}"
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Wait for port to be released
sleep 2

# Function to start the server
start_server() {
    echo -e "${GREEN}Starting Next.js server...${NC}"
    npm run dev
}

# Function to handle crashes and restart
handle_crash() {
    echo -e "${RED}Frontend crashed! Restarting in 5 seconds...${NC}"
    sleep 5
    start_server
}

# Trap exit signals
trap handle_crash EXIT

# Start the server
start_server