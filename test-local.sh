#!/bin/bash
# Test the build locally before deploying

echo "🧪 Testing production build locally..."
echo ""

# Check if build exists
if [ ! -d ".output" ]; then
    echo "❌ No build found. Running build first..."
    npm run build:prod
fi

echo "🔍 Verifying build..."
npm run verify

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build verified! Starting local preview..."
    echo ""
    echo "📍 Server will be available at: http://localhost:3000"
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Set production environment
    export NODE_ENV=production
    export PORT=3000
    
    # Start server
    node .output/server/index.mjs
else
    echo ""
    echo "❌ Build verification failed. Fix issues before deploying."
    exit 1
fi
