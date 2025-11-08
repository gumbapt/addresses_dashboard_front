#!/bin/bash
# Server Setup Script
# Run this on your server after first git pull

echo "🚀 Setting up Addresses Dashboard on server..."
echo ""

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'ENV_EOF'
# API Configuration
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin

# Server Configuration
NODE_ENV=production
PORT=3000

# Pusher Configuration (optional - defaults are set)
PUSHER_APP_KEY=b395ac035994ca7af583
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=1553073
PUSHER_APP_SECRET=8a20e39fc3f1ab6111af
ENV_EOF
    echo "✅ Created .env file"
    echo "⚠️  Please review and update .env with your actual values!"
else
    echo "ℹ️  .env already exists, skipping..."
fi

# Check if .output exists
if [ ! -d .output ]; then
    echo "❌ .output directory not found!"
    echo "   Make sure you pulled the latest code with the build."
    echo "   Or run 'npm run build:prod' if this server has enough memory."
    exit 1
fi

echo "✅ .output directory found"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Test if server starts
echo ""
echo "🧪 Testing if server starts..."
timeout 5 node .output/server/index.mjs &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully!"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start. Check errors above."
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Review .env file:"
echo "   nano .env"
echo ""
echo "2. Test manually:"
echo "   node .output/server/index.mjs"
echo ""
echo "3. Or use PM2 (recommended):"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "Server will run on port 3000 by default."
echo "=================================="

