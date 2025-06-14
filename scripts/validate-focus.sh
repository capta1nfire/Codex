#!/bin/bash

# FOCUS Methodology Validator
# Simple script to check if AI is following FOCUS principles

echo "🎯 FOCUS Methodology Check"
echo "=========================="
echo ""

# Check for new markdown files (excluding node_modules and .git)
NEW_MD_FILES=$(git status --porcelain 2>/dev/null | grep "^??" | grep "\.md$" | grep -v node_modules | grep -v "\.git")

if [ ! -z "$NEW_MD_FILES" ]; then
    echo "❌ NEW DOCUMENTATION FILES DETECTED:"
    echo "$NEW_MD_FILES"
    echo ""
    echo "Ask yourself:"
    echo "1. Did the user explicitly request these files?"
    echo "2. Can this information go in existing docs?"
    echo "3. Will these files exist in 30 days?"
    echo ""
else
    echo "✅ No new documentation files created"
fi

# Check if CHANGELOG was updated
CHANGELOG_MODIFIED=$(git diff --name-only 2>/dev/null | grep "CHANGELOG.md")

if [ -z "$CHANGELOG_MODIFIED" ]; then
    echo "⚠️  CHANGELOG.md not updated this session"
    echo "   Add 2-5 lines about what you've done"
else
    echo "✅ CHANGELOG.md was updated"
fi

# Check for common anti-pattern files
ANTI_PATTERNS=$(find . -name "*-notes.md" -o -name "*-plan.md" -o -name "session-*.md" -o -name "*-implementation.md" -o -name "*-analysis.md" | grep -v node_modules | grep -v "\.git" | sort | tail -5)

# Check for potential duplicate code files
DUPLICATE_PATTERNS=$(find . \( -name "*-v2.*" -o -name "*-new.*" -o -name "*-optimized.*" -o -name "*-improved.*" \) -type f | grep -E "\.(ts|tsx|js|jsx)$" | grep -v node_modules | grep -v "\.git" | sort)

if [ ! -z "$ANTI_PATTERNS" ]; then
    echo ""
    echo "⚠️  ANTI-PATTERN FILES FOUND (consider deleting):"
    echo "$ANTI_PATTERNS"
fi

if [ ! -z "$DUPLICATE_PATTERNS" ]; then
    echo ""
    echo "🔴 POTENTIAL DUPLICATE CODE FILES DETECTED:"
    echo "$DUPLICATE_PATTERNS"
    echo ""
    echo "Ask yourself:"
    echo "- Is there an original version without -v2/-new/-optimized?"
    echo "- Should these changes be in the original file?"
    echo "- Did you ask before creating these variants?"
fi

echo ""
echo "📊 FOCUS Score Checklist:"
echo "[ ] 80% of time spent on code (not documentation)"
echo "[ ] 0 new documentation files created"
echo "[ ] CHANGELOG.md updated with today's work"
echo "[ ] All documentation in code comments or existing files"
echo ""
echo "Remember: Every new file = 10+ minutes of human cleanup"