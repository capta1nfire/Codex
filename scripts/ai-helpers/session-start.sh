#!/bin/bash

# 🚀 AI Session Start Helper
# Purpose: Initialize a new work session with all relevant context

echo "🤖 QReable AI Session Helper v1.0"
echo "================================"
echo ""

# Get current date/time
SESSION_DATE=$(date +"%Y-%m-%d")
SESSION_TIME=$(date +"%H:%M")
SESSION_ID=$(date +"%Y%m%d-%H")

echo "📅 Session Date: $SESSION_DATE"
echo "🕐 Session Time: $SESSION_TIME"
echo "🆔 Session ID: $SESSION_ID"
echo ""

# Check service status
echo "🔍 Checking Service Status..."
if command -v pm2 &> /dev/null; then
    pm2 status
else
    echo "⚠️  PM2 not running - services may be offline"
fi
echo ""

# Show recent changes
echo "📝 Recent Changes (last 24h):"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.md" \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./target/*" \
    -mtime -1 2>/dev/null | head -10
echo ""

# Check for uncommitted changes
echo "📊 Git Status:"
git status --porcelain | head -10
if [ $(git status --porcelain | wc -l) -gt 10 ]; then
    echo "... and $(($(git status --porcelain | wc -l) - 10)) more files"
fi
echo ""

# Show TODO items from last session
LAST_SESSION_LOG=$(ls -t .workspace/session-logs/*.md 2>/dev/null | head -1)
if [ ! -z "$LAST_SESSION_LOG" ]; then
    echo "📋 TODOs from Last Session:"
    grep -A 5 "Next Session TODO" "$LAST_SESSION_LOG" 2>/dev/null | tail -n +2 | head -5
    echo ""
fi

# Quick health check
echo "🏥 Quick Health Check:"
echo -n "  Backend: "
curl -s http://localhost:3004/health >/dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline"
echo -n "  Frontend: "
curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline"
echo -n "  Rust: "
curl -s http://localhost:3002/status >/dev/null 2>&1 && echo "✅ Online" || echo "❌ Offline"
echo ""

# Create session log
SESSION_LOG=".workspace/session-logs/${SESSION_ID}-session.md"
echo "📝 Creating session log: $SESSION_LOG"
cp .workspace/templates/session-log-template.md "$SESSION_LOG"
sed -i.bak "s/\[YYYY-MM-DD\]/$SESSION_DATE/g" "$SESSION_LOG"
sed -i.bak "s/\[YYYYMMDD-HH\]/$SESSION_ID/g" "$SESSION_LOG"
rm "${SESSION_LOG}.bak" 2>/dev/null
echo ""

# Reminders
echo "💡 Quick Reminders:"
echo "  - Read START_HERE.md for latest updates"
echo "  - Use .nav.md for quick navigation"
echo "  - Place temp files in .workspace/temp/"
echo "  - Update session log as you work"
echo ""

echo "✅ Session initialized! Good luck! 🚀"
echo ""
echo "📂 Session log created at: $SESSION_LOG"