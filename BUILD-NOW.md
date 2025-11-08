# 🚀 BUILD NOW - Quick Reference

## ✅ All Issues Fixed!

1. ✅ useRuntimeConfig error - FIXED
2. ✅ Hardcoded localhost - FIXED  
3. ✅ Portuguese translations - DONE
4. ✅ Build path issues - FIXED

---

## 📋 Commands to Run (in order)

```bash
# 1. Clean build
npm run build:clean

# 2. Verify build
npm run verify

# 3. If verification passes, deploy
git add .
git commit -m "Production build - all fixes applied"
git push
```

---

## ⚙️ Environment Variables

### On Server (create `.env`):

```bash
# Copy this to server .env file
NUXT_PUBLIC_API_BASE_URL=https://dash3.50g.io/api/admin
NUXT_PUBLIC_CHAT_API_URL=https://dash3.50g.io/api
NODE_ENV=production
PORT=3000
```

**Note**: These are also the defaults, so `.env` is optional!

---

## 🎯 On Server

After `git pull`:

```bash
# Option 1: Direct run
node .output/server/index.mjs

# Option 2: PM2 (recommended)
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔍 Verify Script

The verify script now checks for:
- ❌ Mac paths (`/Users/`)
- ❌ Linux paths (`/home/`)
- ❌ Vite dev refs (`/@vite`)
- ❌ Hardcoded localhost

All should be ✅ after build!

---

## 🐛 If Verification Fails

```bash
# Nuclear option - full clean
rm -rf node_modules .nuxt .output node_modules/.cache
npm install
npm run build:prod
npm run verify
```

---

## 📖 More Info

- `START-HERE.md` - Complete guide
- `QUICK-DEPLOY.md` - 3-step deploy
- `FIX-SUMMARY.md` - What was fixed
- `CHANGES.md` - All changes made

---

**Ready? Run: `npm run deploy`** 🚀

