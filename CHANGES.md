# Changes Made - Build Path Fix

## Problem Solved ✅

**Before**: Build had absolute Mac paths (`/Users/pedronave/...`) and couldn't run on server  
**After**: Build uses relative paths and environment variables, works anywhere!

---

## Files Modified

### 1. `config/api.ts`
**Changes:**
- ✅ Translated Portuguese comment to English (`10 segundos` → `10 seconds`)
- ✅ Changed `process.env.NUXT_API_BASE_URL` → `process.env.NUXT_PUBLIC_API_BASE_URL`
- ✅ Uses runtime config for API URL

**Why:** Environment variables in Nuxt must be prefixed with `NUXT_PUBLIC_` to be available in the client

### 2. `nuxt.config.ts`
**Changes:**
- ✅ Added `apiBaseUrl` to `runtimeConfig.public`
- ✅ Now reads from `process.env.NUXT_PUBLIC_API_BASE_URL`

**Why:** Proper way to handle environment-specific configuration in Nuxt 3

### 3. `build-to-prod.sh`
**Changes:**
- ❌ **Removed**: Absolute path `/Users/pedronave/Documents/addresses_dashboard_front`
- ✅ **Added**: Relative path detection using `$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )`
- ✅ Translated all Portuguese comments to English
- ✅ Better error handling

**Why:** Script now works on any machine, not just your Mac

### 4. `package.json`
**Changes:**
- ✅ Added `build:prod` - Production build
- ✅ Added `build:clean` - Clean build (removes cache)
- ✅ Added `deploy` - Full deployment script
- ✅ Added `verify` - Verify build integrity
- ✅ Added `test:local` - Test build locally

**Why:** Convenient commands for common tasks

### 5. `.gitignore`
**Changes:**
- ❌ **Removed**: `.output` from ignore list (commented out)
- ✅ Now you can commit the `.output` folder

**Why:** Since your server has low memory, you build locally and commit the result

---

## Files Created

### Documentation

1. **`START-HERE.md`** - Quick start guide (read this first!)
2. **`QUICK-DEPLOY.md`** - 3-step deployment guide
3. **`README-DEPLOY.md`** - Complete deployment documentation
4. **`CHANGES.md`** - This file

### Scripts

5. **`verify-build.sh`** - Verifies build has no absolute paths
6. **`test-local.sh`** - Test build locally before deploying
7. **`server-setup.sh`** - Server initial setup script
8. **`ecosystem.config.js`** - PM2 configuration

---

## How to Use

### Development (unchanged)
```bash
npm run dev
```

### Build for Production (new)
```bash
# Option 1: Clean build (recommended)
npm run build:clean

# Option 2: Quick build
npm run build:prod

# Option 3: Full deployment workflow
npm run deploy
```

### Verify Build (new)
```bash
npm run verify
```

### Test Locally (new)
```bash
npm run test:local
```

### Deploy to Server (improved)
```bash
# 1. Build locally
npm run deploy

# 2. Verify
npm run verify

# 3. Commit and push
git add .
git commit -m "Production build"
git push

# 4. On server
git pull
bash server-setup.sh  # First time only
node .output/server/index.mjs
```

---

## Environment Variables

### Before (hardcoded)
```javascript
BASE_URL: 'https://dash3.50g.io/api/admin',
```

### After (configurable)
```bash
# .env file
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
```

Now you can easily change the API URL per environment!

---

## Build Verification

The new `verify-build.sh` script checks for:

1. ❌ Mac absolute paths (`/Users/`)
2. ❌ Linux absolute paths (`/home/`)
3. ❌ Vite dev references (`/@vite`)
4. ⚠️ Localhost references (optional warning)
5. ℹ️ Build size

---

## Scripts Comparison

### Before
```bash
cd /Users/pedronave/Documents/addresses_dashboard_front  # ❌ Hardcoded
npm run build
```

### After
```bash
npm run deploy  # ✅ Works anywhere
```

---

## PM2 Configuration

New `ecosystem.config.js` includes:

- Auto-restart on crash
- Memory limit (500MB)
- Log rotation
- Cluster mode support
- Environment variables
- Graceful shutdown

Usage:
```bash
pm2 start ecosystem.config.js
```

---

## Server Setup

First-time setup on server:
```bash
git pull
bash server-setup.sh
```

This script:
1. Creates `logs/` directory
2. Creates `.env` with defaults
3. Verifies `.output` exists
4. Tests if server starts
5. Shows next steps

---

## Testing Before Deploy

New workflow:
```bash
# 1. Build
npm run deploy

# 2. Verify
npm run verify

# 3. Test locally
npm run test:local

# 4. If all OK, deploy
git push
```

---

## Backwards Compatibility

✅ All existing commands still work:
- `npm run dev`
- `npm run build`
- `npm run preview`

✅ Existing deployments will continue to work

⚠️ You should update `.env` files to use `NUXT_PUBLIC_API_BASE_URL`

---

## Migration Checklist

If you have existing deployments:

### On your Mac
- [ ] Pull latest code
- [ ] Run `npm run build:clean`
- [ ] Run `npm run verify`
- [ ] Commit `.output` if needed

### On server
- [ ] Pull latest code
- [ ] Update `.env` to use `NUXT_PUBLIC_API_BASE_URL`
- [ ] Test: `node .output/server/index.mjs`
- [ ] Restart service/PM2

---

## Benefits

1. ✅ **Portable builds** - Build once, deploy anywhere
2. ✅ **No server memory issues** - Build on Mac, not server
3. ✅ **Easy configuration** - Use `.env` files
4. ✅ **Automated verification** - Catch issues before deploy
5. ✅ **Better scripts** - More convenient commands
6. ✅ **Documentation** - Clear guides for deployment

---

## Support Files

All documentation is in these files:
- `START-HERE.md` - **Read this first!**
- `QUICK-DEPLOY.md` - Quick reference
- `README-DEPLOY.md` - Complete guide
- `CHANGES.md` - This file

All scripts are executable:
- `build-to-prod.sh` - Production build
- `verify-build.sh` - Verify build
- `test-local.sh` - Test locally
- `server-setup.sh` - Server setup

---

## Next Steps

1. Read `START-HERE.md`
2. Run `npm run deploy`
3. Run `npm run verify`
4. Run `npm run test:local` (optional)
5. If all OK: `git push`

---

**Last Updated**: 2024
**Status**: ✅ Production Ready

