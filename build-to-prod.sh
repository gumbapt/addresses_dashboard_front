#!/bin/bash
# Portable Production Build Script
# Works on any system without absolute paths

# Get script directory (works cross-platform)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🧹 Cleaning old files..."
rm -rf .nuxt .output node_modules/.vite

echo "🛑 Stopping any dev server..."
pkill -f "node.*nuxt.*dev" || true

echo "🔨 Building for PRODUCTION..."
NODE_ENV=production npm run build

echo "✅ Build completed!"
echo ""
echo "🔍 Verifying build correctness..."
if [ -f .output/server/chunks/nitro/nitro.mjs ]; then
    if strings .output/server/chunks/nitro/nitro.mjs 2>/dev/null | grep -qi "/@vite\|Documents/addresses"; then
        echo "❌ ERROR: Build still has development references!"
        echo "   Try again or delete node_modules and run 'npm install'"
        exit 1
    else
        echo "✅ Build looks correct!"
    fi
else
    echo "⚠️  Could not verify build (nitro.mjs not found)"
fi

echo ""
echo "📁 Generated files:"
ls -lh .output/public/_nuxt/ 2>/dev/null | head -5 || echo "Build output directory not found"

echo ""
echo "📤 Next step: git add, commit and push"