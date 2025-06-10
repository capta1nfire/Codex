#!/bin/bash

# 🔍 Recent Changes Helper
# Purpose: Find and analyze recent changes in the codebase

# Parse arguments
DAYS=${1:-1}
FILTER=${2:-"all"}

echo "🔍 Recent Changes Analysis"
echo "=========================="
echo "📅 Looking back: $DAYS day(s)"
echo "🔎 Filter: $FILTER"
echo ""

# Function to format file info
format_file_info() {
    local file=$1
    local size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    local modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1-2)
    echo "  $file ($size) - $modified"
}

# TypeScript/JavaScript Changes
if [ "$FILTER" = "all" ] || [ "$FILTER" = "code" ]; then
    echo "📝 Code Changes:"
    echo "───────────────"
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" \
        -not -path "./target/*" \
        -not -path "./dist/*" \
        -mtime -$DAYS -print0 2>/dev/null | while IFS= read -r -d '' file; do
        format_file_info "$file"
    done
    echo ""
fi

# Documentation Changes
if [ "$FILTER" = "all" ] || [ "$FILTER" = "docs" ]; then
    echo "📚 Documentation Changes:"
    echo "────────────────────────"
    find . -type f -name "*.md" \
        -not -path "./node_modules/*" \
        -mtime -$DAYS -print0 2>/dev/null | while IFS= read -r -d '' file; do
        format_file_info "$file"
    done
    echo ""
fi

# Configuration Changes
if [ "$FILTER" = "all" ] || [ "$FILTER" = "config" ]; then
    echo "⚙️  Configuration Changes:"
    echo "────────────────────────"
    find . -type f \( -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" \) \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" \
        -not -path "./target/*" \
        -not -name "package-lock.json" \
        -mtime -$DAYS -print0 2>/dev/null | while IFS= read -r -d '' file; do
        format_file_info "$file"
    done
    echo ""
fi

# Git Changes (if in git repo)
if [ -d .git ]; then
    echo "📊 Git Activity:"
    echo "───────────────"
    
    # Recent commits
    echo "Recent Commits:"
    git log --since="${DAYS}.days.ago" --pretty=format:"  %h - %s (%ar)" --abbrev-commit 2>/dev/null | head -10
    
    # Uncommitted changes
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo ""
        echo "Uncommitted Changes: $UNCOMMITTED files"
        git status --porcelain 2>/dev/null | head -5 | sed 's/^/  /'
        if [ "$UNCOMMITTED" -gt 5 ]; then
            echo "  ... and $((UNCOMMITTED - 5)) more"
        fi
    fi
    echo ""
fi

# Large Files Alert
echo "⚠️  Large Files Modified:"
echo "───────────────────────"
find . -type f -size +1M \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./target/*" \
    -not -path "./dist/*" \
    -mtime -$DAYS -print0 2>/dev/null | while IFS= read -r -d '' file; do
    format_file_info "$file"
done | head -5

echo ""

# Summary
echo "📈 Summary:"
echo "──────────"
TOTAL_CHANGES=$(find . -type f \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./target/*" \
    -mtime -$DAYS 2>/dev/null | wc -l)
echo "  Total files changed: $TOTAL_CHANGES"

# Usage hints
echo ""
echo "💡 Usage:"
echo "  ./recent-changes.sh [days] [filter]"
echo "  Examples:"
echo "    ./recent-changes.sh 7        # Last 7 days, all files"
echo "    ./recent-changes.sh 1 code   # Today's code changes"
echo "    ./recent-changes.sh 3 docs   # Last 3 days' docs"
echo ""
echo "  Filters: all, code, docs, config"