#!/bin/bash

# Backend development starter with stability improvements
# Uses tsx WITHOUT watch to prevent constant restarts

echo "🔧 Starting Backend (Port 3004) - Stable Mode..."

# Set environment
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=1024"

# Run without watch mode - manual restart required for changes
npx tsx src/index.ts