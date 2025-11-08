# Deployment Guide

## Building for Production

### Option 1: Build Locally (Recommended)

```bash
# Clean build (removes cache)
npm run build:clean

# Or simple build
npm run build:prod

# Or use the script
npm run deploy
```

### Option 2: Build on Server (if memory allows)

If your server has enough memory, you can build there:

```bash
# SSH into your server
ssh user@your-server.com

# Navigate to project
cd /path/to/project

# Pull latest code
git pull

# Install dependencies (if needed)
npm install

# Build
npm run build:prod
```

## Environment Variables

Create a `.env` file on your server with:

```bash
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=your_app_id
PUSHER_APP_SECRET=your_secret
NODE_ENV=production
```

## Deploying the Build

### After building locally:

1. **Commit the build files:**
   ```bash
   git add .output
   git commit -m "Build for production"
   git push
   ```

2. **On the server:**
   ```bash
   git pull
   # The .output folder should now be available
   ```

### Important Files to Deploy:

- `.output/` - The entire build output
- `.env` - Environment variables (create on server)
- `package.json` - For dependencies info

### Running on Server:

```bash
# Using Node directly
node .output/server/index.mjs

# Or with PM2 (recommended)
pm2 start .output/server/index.mjs --name "dashboard"

# Or using the preview script
npm run preview
```

## Troubleshooting

### "Path not found" errors:

If you see errors like `/Users/pedronave/...` in production:

1. Clean build:
   ```bash
   rm -rf .nuxt .output node_modules/.cache node_modules/.vite
   npm run build:prod
   ```

2. Verify no absolute paths in build:
   ```bash
   grep -r "/Users/" .output/ || echo "Build is clean!"
   ```

### Memory issues on server:

- Build locally on your Mac (current setup)
- Push the `.output` folder to git
- Pull on server and run directly

### Port configuration:

```bash
# Set port on server
PORT=3000 node .output/server/index.mjs

# Or in .env
PORT=3000
```

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dashboard',
    script: './.output/server/index.mjs',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Run with:
```bash
pm2 start ecosystem.config.js
```

