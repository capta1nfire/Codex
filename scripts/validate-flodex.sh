#!/bin/bash

# =============================================================================
# FLODEX Validation Script v1.0
# =============================================================================
# Purpose: Validates that the project follows FLODEX architecture principles
# Author: QReable Development Team
# Date: June 19, 2025
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo -e "${BLUE}FLODEX Architecture Validator v1.0${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message and exit"
    echo ""
    echo "Description:"
    echo "  Validates that the QReable project follows FLODEX architecture principles."
    echo ""
    echo "Checks performed:"
    echo "  - Service structure and independence"
    echo "  - Documentation placement (minimal .md files per service)"
    echo "  - Cross-service dependencies"
    echo "  - Port configurations"
    echo "  - Required root files"
    echo "  - FLODEX compliance (separate package managers)"
    echo ""
    echo "Output:"
    echo "  Color-coded pass/warn/fail results with actionable feedback"
    echo ""
    echo "Exit codes:"
    echo "  0 - All checks passed"
    echo "  1 - Warnings found"
    echo "  2 - Errors found"
    exit 0
}

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
fi

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

# Script header
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                        FLODEX Architecture Validator v1.0                     ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        ((ERRORS++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
        ((WARNINGS++))
    fi
}

# Function to check README sections
check_readme_sections() {
    local readme_file=$1
    local service_name=$2
    
    if [ ! -f "$readme_file" ]; then
        print_status "FAIL" "$service_name is missing README.md"
        return
    fi
    
    # Required sections for service READMEs
    local required_sections=(
        "Propósito del Servicio"
        "Stack Tecnológico"
        "Cómo Ejecutar"
        "Contrato de API"
        "Variables de Entorno"
        "Comunicación con Otros Servicios"
        "Troubleshooting"
        "Mantenimiento"
    )
    
    local missing_sections=()
    
    for section in "${required_sections[@]}"; do
        if ! grep -q "## [0-9]\. $section\|## $section" "$readme_file"; then
            missing_sections+=("$section")
        fi
    done
    
    if [ ${#missing_sections[@]} -eq 0 ]; then
        print_status "PASS" "$service_name README has all required sections"
    else
        print_status "WARN" "$service_name README missing sections: ${missing_sections[*]}"
    fi
}

# =============================================================================
# VALIDATION CHECKS
# =============================================================================

echo -e "${BLUE}1. Checking Service Structure...${NC}"
echo ""

# Check that each service has its README
for service in backend frontend rust_generator; do
    if [ -d "$service" ]; then
        print_status "PASS" "Service directory exists: $service"
        check_readme_sections "$service/README.md" "$service"
    else
        print_status "FAIL" "Service directory missing: $service"
    fi
done

echo ""
echo -e "${BLUE}2. Checking Documentation Placement...${NC}"
echo ""

# Find .md files outside allowed locations
allowed_paths=(
    "./README.md"
    "./START_HERE.md"
    "./QReable.md"
    "./CLAUDE.md"
    "./CHANGELOG.md"
    "./.nav.md"
    "./.cursorrules"
    "./migration_log.md"
    "./FLODEX_SERVICE_TEMPLATE.md"
    "./FLODEX_migration_proposal.md"
)

# Find all .md files
all_md_files=$(find . -name "*.md" -type f | grep -v node_modules | grep -v .git | sort)

# Check each .md file
while IFS= read -r file; do
    # Skip if in service directories (allowed)
    if [[ "$file" =~ ^\./backend/ ]] || [[ "$file" =~ ^\./frontend/ ]] || [[ "$file" =~ ^\./rust_generator/ ]]; then
        continue
    fi
    
    # Skip if in docs/ directory (allowed for now)
    if [[ "$file" =~ ^\./docs/ ]]; then
        continue
    fi
    
    # Skip if in .github directory (allowed for templates)
    if [[ "$file" =~ ^\./.github/ ]]; then
        continue
    fi
    
    # Check if file is in allowed list
    allowed=false
    for allowed_file in "${allowed_paths[@]}"; do
        if [ "$file" = "$allowed_file" ]; then
            allowed=true
            break
        fi
    done
    
    if [ "$allowed" = false ]; then
        print_status "FAIL" "Documentation outside services: $file"
    fi
done <<< "$all_md_files"

# Count .md files in each service (excluding node_modules)
for service in backend frontend rust_generator; do
    if [ -d "$service" ]; then
        count=$(find "$service" -name "*.md" -type f | grep -v node_modules | wc -l)
        if [ $count -gt 5 ]; then
            print_status "WARN" "$service has $count .md files (consider consolidating)"
        else
            print_status "PASS" "$service has $count .md files"
        fi
    fi
done

echo ""
echo -e "${BLUE}3. Checking Cross-Service Dependencies...${NC}"
echo ""

# Check for imports between services (basic check)
if grep -r "from '../frontend" backend --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules; then
    print_status "FAIL" "Backend imports from Frontend (services should be independent)"
else
    print_status "PASS" "Backend doesn't import from Frontend"
fi

if grep -r "from '../backend" frontend --include="*.ts" --include="*.js" --include="*.tsx" 2>/dev/null | grep -v node_modules; then
    print_status "FAIL" "Frontend imports from Backend (services should be independent)"
else
    print_status "PASS" "Frontend doesn't import from Backend"
fi

echo ""
echo -e "${BLUE}4. Checking Root Files...${NC}"
echo ""

# Check required root files exist
required_root_files=(
    "README.md"
    "START_HERE.md"
    "QReable.md"
    "CLAUDE.md"
    "docker-compose.yml"
)

for file in "${required_root_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "PASS" "Required root file exists: $file"
    else
        print_status "FAIL" "Missing required root file: $file"
    fi
done

# Check for ecosystem config (multiple possible extensions)
if [ -f "ecosystem.config.js" ] || [ -f "ecosystem.config.cjs" ] || [ -f "ecosystem.config.mjs" ]; then
    print_status "PASS" "PM2 ecosystem config exists"
else
    print_status "FAIL" "Missing PM2 ecosystem config (ecosystem.config.js/cjs/mjs)"
fi

echo ""
echo -e "${BLUE}5. Checking Port Configuration...${NC}"
echo ""

# Check if ports are correctly documented
check_port_in_readme() {
    local service=$1
    local port=$2
    local readme="$service/README.md"
    
    if [ -f "$readme" ] && grep -q "$port" "$readme"; then
        print_status "PASS" "$service README documents port $port"
    else
        print_status "WARN" "$service README should document port $port"
    fi
}

check_port_in_readme "backend" "3004"
check_port_in_readme "frontend" "3000"
check_port_in_readme "rust_generator" "3002"

echo ""
echo -e "${BLUE}6. Checking FLODEX Compliance...${NC}"
echo ""

# Check if services have their own package.json/Cargo.toml
if [ -f "backend/package.json" ]; then
    print_status "PASS" "Backend has its own package.json"
else
    print_status "FAIL" "Backend missing package.json"
fi

if [ -f "frontend/package.json" ]; then
    print_status "PASS" "Frontend has its own package.json"
else
    print_status "FAIL" "Frontend missing package.json"
fi

if [ -f "rust_generator/Cargo.toml" ]; then
    print_status "PASS" "Rust Generator has its own Cargo.toml"
else
    print_status "FAIL" "Rust Generator missing Cargo.toml"
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
echo -e "${BLUE}7. Checking Cross-Service Documentation...${NC}"
echo ""

# Check if cross-service guide exists
if [ -f "docs/flodex/CROSS_SERVICE_FEATURES_GUIDE.md" ]; then
    print_status "PASS" "Cross-service feature guide exists"
else
    print_status "WARN" "Missing cross-service feature guide (recommended for teams)"
fi

# Count feature documents
if [ -d "docs/flodex/features" ]; then
    feature_count=$(find docs/flodex/features -name "*.md" -type f 2>/dev/null | wc -l)
    if [ $feature_count -gt 0 ]; then
        print_status "PASS" "Found $feature_count cross-service feature documents"
    else
        print_status "PASS" "No cross-service features yet (this is fine)"
    fi
else
    print_status "PASS" "No cross-service features directory yet (create when needed)"
fi

echo ""
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                                 SUMMARY                                       ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo -e "  ${GREEN}Passed${NC}: $PASSED"
echo -e "  ${YELLOW}Warnings${NC}: $WARNINGS"
echo -e "  ${RED}Errors${NC}: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Your project follows FLODEX architecture perfectly!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Good! Your project mostly follows FLODEX with some minor issues.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Your project has FLODEX compliance issues that need attention.${NC}"
    echo ""
    echo "Tips to fix:"
    echo "- Move documentation to the appropriate service README"
    echo "- Ensure each service has complete documentation"
    echo "- Keep services independent (no cross-imports)"
    echo "- Follow the 8-section template for service READMEs"
    exit 1
fi