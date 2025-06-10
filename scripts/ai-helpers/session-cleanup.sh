#!/bin/bash

# 🧹 Session Cleanup Helper
# Purpose: Clean up temporary files and finalize work sessions

echo "🧹 CODEX Session Cleanup Tool"
echo "============================="
echo ""

# Safety check
echo "⚠️  This will clean temporary files and finalize the session."
echo "Press ENTER to continue or Ctrl+C to cancel..."
read

# Clean temporary files
echo "🗑️  Cleaning temporary files..."
echo "─────────────────────────────"

# Workspace temp directory
if [ -d ".workspace/temp" ]; then
    TEMP_COUNT=$(find .workspace/temp -type f 2>/dev/null | wc -l)
    if [ "$TEMP_COUNT" -gt 0 ]; then
        echo "  Removing $TEMP_COUNT files from .workspace/temp/"
        rm -rf .workspace/temp/*
    else
        echo "  .workspace/temp/ is already clean"
    fi
fi

# Test token files
if [ -f ".test-token.json" ]; then
    echo "  Removing .test-token.json"
    rm -f .test-token.json
fi

# Temporary test files
TEMP_TEST_FILES=$(find . -name "test-*.tmp" -o -name "debug-*.js" -o -name "temp-*.js" \
    -not -path "./node_modules/*" 2>/dev/null)
if [ ! -z "$TEMP_TEST_FILES" ]; then
    echo "  Found temporary test files:"
    echo "$TEMP_TEST_FILES" | sed 's/^/    /'
    echo "  Remove these files? (y/N)"
    read CONFIRM
    if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
        echo "$TEMP_TEST_FILES" | xargs rm -f
        echo "  ✅ Removed temporary test files"
    fi
fi
echo ""

# Check for large log files
echo "📊 Checking log files..."
echo "──────────────────────"
LARGE_LOGS=$(find . -name "*.log" -size +10M -not -path "./node_modules/*" 2>/dev/null)
if [ ! -z "$LARGE_LOGS" ]; then
    echo "  ⚠️  Large log files found:"
    echo "$LARGE_LOGS" | while read log; do
        SIZE=$(ls -lh "$log" | awk '{print $5}')
        echo "    $log ($SIZE)"
    done
    echo "  Consider rotating or clearing these logs"
else
    echo "  ✅ No large log files found"
fi
echo ""

# Git status check
echo "📝 Git Status:"
echo "─────────────"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "  ⚠️  You have $UNCOMMITTED uncommitted changes"
    echo "  Consider committing your work:"
    git status --short | head -10
    if [ "$UNCOMMITTED" -gt 10 ]; then
        echo "  ... and $((UNCOMMITTED - 10)) more files"
    fi
else
    echo "  ✅ Working directory clean"
fi
echo ""

# Session logs
echo "📋 Session Logs:"
echo "───────────────"
LATEST_LOG=$(ls -t .workspace/session-logs/*.md 2>/dev/null | head -1)
if [ ! -z "$LATEST_LOG" ]; then
    echo "  Latest session log: $LATEST_LOG"
    
    # Check if TODOs are documented
    if grep -q "Next Session TODO" "$LATEST_LOG"; then
        echo "  ✅ Next session TODOs documented"
    else
        echo "  ⚠️  Remember to document next session TODOs"
    fi
    
    # Check if session metrics are filled
    if grep -q "Files Created: X" "$LATEST_LOG" || grep -q "Files Modified: Y" "$LATEST_LOG"; then
        echo "  ⚠️  Remember to update session metrics in the log"
    else
        echo "  ✅ Session metrics documented"
    fi
else
    echo "  ⚠️  No session logs found"
fi
echo ""

# Service cleanup
echo "🚀 Service Status:"
echo "────────────────"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    echo "  Clean PM2 logs? (y/N)"
    read CLEAN_PM2
    if [ "$CLEAN_PM2" = "y" ] || [ "$CLEAN_PM2" = "Y" ]; then
        pm2 flush
        echo "  ✅ PM2 logs cleaned"
    fi
else
    echo "  PM2 not running"
fi
echo ""

# Node modules check
echo "📦 Dependencies:"
echo "───────────────"
# Check for outdated packages
echo "  Checking for security vulnerabilities..."
cd backend 2>/dev/null && npm audit --production --audit-level=high 2>&1 | grep -E "(found|vulnerabilities)" | head -3
cd ../frontend 2>/dev/null && npm audit --production --audit-level=high 2>&1 | grep -E "(found|vulnerabilities)" | head -3
cd .. 2>/dev/null
echo ""

# Final reminders
echo "✅ Cleanup Checklist:"
echo "──────────────────"
echo "  □ Temporary files cleaned"
echo "  □ Session log updated with:"
echo "    - Work completed"
echo "    - Issues encountered"
echo "    - Next session TODOs"
echo "  □ Code committed to git"
echo "  □ Tests passing"
echo "  □ Documentation updated"
echo ""

echo "🎉 Session cleanup complete!"
echo ""
echo "💡 Next Steps:"
echo "  1. Commit your session log"
echo "  2. Push changes if needed"
echo "  3. Update project board/issues"
echo ""
echo "Thank you for keeping the workspace clean! 🙏"