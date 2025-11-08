#!/bin/bash
# Verify Build Script - Check for absolute paths and dev references

echo "🔍 Verifying build for production readiness..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check if .output exists
if [ ! -d ".output" ]; then
    echo -e "${RED}❌ .output directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

# Check for absolute paths (Mac/Linux)
echo "Checking for absolute paths..."
MAC_PATHS=$(grep -r "/Users/" .output/ 2>/dev/null | grep -v ".map" | head -3)
if [ ! -z "$MAC_PATHS" ]; then
    echo -e "${RED}❌ Found Mac absolute paths in build:${NC}"
    echo "$MAC_PATHS" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No Mac absolute paths found${NC}"
fi

LINUX_PATHS=$(grep -r "/home/" .output/ 2>/dev/null | grep -v ".map" | head -3)
if [ ! -z "$LINUX_PATHS" ]; then
    echo -e "${RED}❌ Found Linux absolute paths in build:${NC}"
    echo "$LINUX_PATHS" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No Linux absolute paths found${NC}"
fi

# Check for dev references
echo ""
echo "Checking for development references..."
VITE_REFS=$(grep -r "/@vite" .output/ 2>/dev/null | grep -v ".map" | head -3)
if [ ! -z "$VITE_REFS" ]; then
    echo -e "${RED}❌ Found Vite dev references:${NC}"
    echo "$VITE_REFS" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No Vite dev references found${NC}"
fi

# Check for localhost references (only in JS files, not source maps)
echo ""
echo "Checking for hardcoded localhost references..."
LOCALHOST_REFS=$(find .output/public/_nuxt -name "*.js" -type f -exec grep -l "localhost:[0-9]" {} \; 2>/dev/null)
if [ ! -z "$LOCALHOST_REFS" ]; then
    echo -e "${RED}❌ Found hardcoded localhost in production build:${NC}"
    for file in $LOCALHOST_REFS; do
        echo -e "   ${YELLOW}$file${NC}"
        grep -o "localhost:[0-9]*" "$file" | sort -u | sed 's/^/      - /'
    done
    echo ""
    echo -e "${YELLOW}💡 These should use environment variables instead!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No hardcoded localhost references found${NC}"
fi

# Check build size
echo ""
echo "Checking build size..."
BUILD_SIZE=$(du -sh .output 2>/dev/null | cut -f1)
echo "Build size: $BUILD_SIZE"

# Summary
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Build verification passed!${NC}"
    echo "Build is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ Build verification failed with $ERRORS error(s)${NC}"
    echo "Please fix the issues and rebuild."
    exit 1
fi

