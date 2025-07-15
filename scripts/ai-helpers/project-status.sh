#!/bin/bash

# 📊 Project Status Helper
# Purpose: Get comprehensive project status for AI agents

echo "📊 QReable Project Status Report"
echo "================================"
echo ""

# Service Status
echo "🚀 Service Status:"
echo "─────────────────"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "⚠️  PM2 not available"
fi
echo ""

# Docker Status
echo "🐳 Docker Services:"
echo "──────────────────"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "(qreable|postgres|redis)" || echo "No Docker services running"
echo ""

# Recent Activity
echo "📈 Recent Activity (Last 7 days):"
echo "────────────────────────────────"
echo "Modified files:"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.md" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./target/*" \
    -mtime -7 | wc -l | xargs echo "  TypeScript/JavaScript:"

find . -type f -name "*.md" \
    -not -path "./node_modules/*" \
    -mtime -7 | wc -l | xargs echo "  Documentation:"

find . -type f -name "*.rs" \
    -not -path "./target/*" \
    -mtime -7 | wc -l | xargs echo "  Rust:"
echo ""

# Git Summary
echo "📝 Git Repository:"
echo "─────────────────"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
echo "  Current Branch: $CURRENT_BRANCH"
echo "  Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)' 2>/dev/null)"
echo "  Uncommitted Changes: $(git status --porcelain 2>/dev/null | wc -l)"
echo ""

# Disk Usage
echo "💾 Project Size:"
echo "───────────────"
du -sh . 2>/dev/null | awk '{print "  Total: " $1}'
du -sh node_modules 2>/dev/null | awk '{print "  Node Modules: " $1}'
du -sh .next 2>/dev/null | awk '{print "  Next.js Build: " $1}'
du -sh target 2>/dev/null | awk '{print "  Rust Target: " $1}'
echo ""

# TODO Summary
echo "📋 Active TODOs:"
echo "───────────────"
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=target \
    . 2>/dev/null | wc -l | xargs echo "  Code TODOs:"

if [ -f ".workspace/session-logs/"*.md ]; then
    grep -h "Next Session TODO" .workspace/session-logs/*.md 2>/dev/null | wc -l | xargs echo "  Session TODOs:"
fi
echo ""

# Performance Metrics
echo "⚡ Performance Indicators:"
echo "────────────────────────"
if curl -s http://localhost:3004/health >/dev/null 2>&1; then
    echo "  Backend: ✅ Online"
    # Try to get metrics
    METRICS=$(curl -s http://localhost:3004/metrics 2>/dev/null | grep -E "qr_|http_" | head -5)
    if [ ! -z "$METRICS" ]; then
        echo "  Recent Metrics:"
        echo "$METRICS" | sed 's/^/    /'
    fi
else
    echo "  Backend: ❌ Offline"
fi

if curl -s http://localhost:3002/status >/dev/null 2>&1; then
    echo "  Rust Generator: ✅ Online"
else
    echo "  Rust Generator: ❌ Offline"
fi
echo ""

# Quick Actions
echo "🎯 Quick Actions:"
echo "────────────────"
echo "  • Start services: ./pm2-start.sh"
echo "  • View logs: pm2 logs"
echo "  • Run tests: cd backend && npm test"
echo "  • Check types: cd backend && npx tsc --noEmit"
echo ""

echo "✅ Status report complete!"