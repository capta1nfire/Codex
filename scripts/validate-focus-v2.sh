#!/bin/bash

# FOCUS Methodology Validator v2.0
# Enhanced with reference checking and directory suggestions

echo "🎯 FOCUS Methodology Check v2.0"
echo "================================="
echo ""

# Define documentation structure based on CONTEXT_SUMMARY.md
declare -A DOC_STRUCTURE=(
    ["api"]="API documentation, endpoints, migration guides"
    ["technical"]="Technical specifications, architecture decisions, performance"
    ["qr-engine"]="QR Engine v2 specific documentation"
    ["implementation"]="Feature implementations, audits, reports"
    ["database"]="Database schemas, optimizations, migrations"
    ["archive"]="Deprecated or historical documents"
)

# Master documents that should contain references
MASTER_DOCS=(
    "docs/README.md"
    "docs/api/README.md"
    "CONTEXT_SUMMARY.md"
    "CHANGELOG.md"
)

# Function to check if a file is referenced
check_references() {
    local file=$1
    local filename=$(basename "$file")
    local refs=0
    
    echo "🔍 Checking references for: $filename"
    
    for master in "${MASTER_DOCS[@]}"; do
        if [ -f "$master" ] && grep -q "$filename" "$master" 2>/dev/null; then
            echo "   ✅ Referenced in: $master"
            ((refs++))
        fi
    done
    
    if [ $refs -eq 0 ]; then
        echo "   ⚠️  NOT REFERENCED in any master document!"
        suggest_location "$file"
    fi
    echo ""
}

# Function to suggest where to add references
suggest_location() {
    local file=$1
    local dir=$(dirname "$file")
    
    echo "   📍 Suggested references based on location:"
    
    case "$dir" in
        *"docs/api"*)
            echo "      - docs/api/README.md (API documentation index)"
            echo "      - docs/README.md (main hub, API section)"
            if [[ "$file" == *"migration"* ]]; then
                echo "      - CHANGELOG.md (if it's a recent change)"
            fi
            ;;
        *"docs/technical"*)
            echo "      - docs/README.md (Technical section)"
            echo "      - CONTEXT_SUMMARY.md (if it documents critical decisions)"
            ;;
        *"docs/qr-engine"*)
            echo "      - docs/qr-engine/README.md (QR Engine index)"
            echo "      - docs/README.md (QR Engine v2 section)"
            ;;
        *"docs/implementation"*)
            echo "      - docs/implementation/README.md (if exists)"
            echo "      - docs/README.md (Implementation section)"
            echo "      - CHANGELOG.md (for recent implementations)"
            ;;
        *)
            echo "      - docs/README.md (appropriate section)"
            echo "      - CHANGELOG.md (if recent addition)"
            ;;
    esac
}

# Original FOCUS checks
echo "📊 Basic FOCUS Checks:"
echo "----------------------"

# Check for new markdown files
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
    
    # Check references for new files
    while IFS= read -r line; do
        file=$(echo "$line" | sed 's/^?? //')
        check_references "$file"
    done <<< "$NEW_MD_FILES"
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

echo ""
echo "🔍 Anti-Pattern Detection:"
echo "-------------------------"

# Check for common anti-pattern files
ANTI_PATTERNS=$(find . -name "*-notes.md" -o -name "*-plan.md" -o -name "session-*.md" -o -name "*-implementation.md" -o -name "*-analysis.md" | grep -v node_modules | grep -v "\.git" | sort | tail -5)

if [ ! -z "$ANTI_PATTERNS" ]; then
    echo "⚠️  ANTI-PATTERN FILES FOUND (consider deleting):"
    echo "$ANTI_PATTERNS"
else
    echo "✅ No anti-pattern files detected"
fi

# Check for duplicate code files
DUPLICATE_PATTERNS=$(find . \( -name "*-v2.*" -o -name "*-new.*" -o -name "*-optimized.*" -o -name "*-improved.*" \) -type f | grep -E "\.(ts|tsx|js|jsx)$" | grep -v node_modules | grep -v "\.git" | sort)

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

# Enhanced: Check for orphaned docs (docs without references)
echo ""
echo "🔍 Orphaned Documentation Check:"
echo "--------------------------------"

# Find recent .md files in docs/ that might be orphaned
RECENT_DOCS=$(find docs -name "*.md" -type f -mtime -7 | grep -v README.md | grep -v archive | head -10)

if [ ! -z "$RECENT_DOCS" ]; then
    echo "Checking recently modified docs for references..."
    while IFS= read -r file; do
        # Skip if file doesn't exist (edge case)
        [ -f "$file" ] || continue
        
        filename=$(basename "$file")
        # Quick check if referenced anywhere
        ref_count=$(grep -r "$filename" --include="*.md" . 2>/dev/null | grep -v "$file" | wc -l)
        
        if [ $ref_count -eq 0 ]; then
            echo "⚠️  Potentially orphaned: $file"
            suggest_location "$file"
        fi
    done <<< "$RECENT_DOCS"
else
    echo "✅ No recent documentation to check"
fi

echo ""
echo "📊 FOCUS Score Checklist:"
echo "[ ] 80% of time spent on code (not documentation)"
echo "[ ] 0 new documentation files created"
echo "[ ] CHANGELOG.md updated with today's work"
echo "[ ] All new docs are properly referenced"
echo "[ ] No orphaned documentation"
echo ""
echo "🎯 Documentation Best Practices:"
echo "- Update existing files instead of creating new ones"
echo "- Every new doc must be referenced in appropriate index"
echo "- Use proper directory structure (see CONTEXT_SUMMARY.md)"
echo ""
echo "Remember: Every new file = 10+ minutes of human cleanup"