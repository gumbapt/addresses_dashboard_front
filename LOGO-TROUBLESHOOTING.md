# 🔧 Logo Troubleshooting Guide

## ✅ Changes Applied

Removed imports and used direct path in `src` attribute for better Nuxt 3 compatibility.

---

## 🔧 Fix Applied

### Before (With Import - May Not Work)
```vue
<script setup lang="ts">
import logodark from '/images/logos/xyzies-logo.png';
</script>
<template>
  <img :src="logodark" alt="Logo" />
</template>
```

### After (Direct Path - Should Work)
```vue
<script setup lang="ts">
</script>
<template>
  <img src="/images/logos/xyzies-logo.png" alt="Xyzies Logo" style="max-width: 180px; height: auto;" />
</template>
```

---

## 🚀 Steps to Make Logo Appear

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then:
npm run dev
```

### Step 2: Clear Nuxt Cache
```bash
cd /Users/pedronave/Documents/addresses_dashboard_front
rm -rf .nuxt
npm run dev
```

### Step 3: Hard Refresh Browser
- **Mac:** `Cmd + Shift + R`
- **Windows/Linux:** `Ctrl + Shift + R`
- **Or:** Open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - `404 /images/logos/xyzies-logo.png`
   - CORS errors
   - Image load failed

### Step 5: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for `xyzies-logo.png` in the list
5. Check if it loaded successfully (status 200) or failed (404)

---

## 🔍 Verify Image File

### Check if file exists:
```bash
ls -lh public/images/logos/xyzies-logo.png
```

**Expected Output:**
```
-rw-r--r-- 1 user staff 110K Nov 13 13:56 public/images/logos/xyzies-logo.png
```

### Check image size:
```bash
file public/images/logos/xyzies-logo.png
```

**Expected Output:**
```
public/images/logos/xyzies-logo.png: PNG image data, 1000 x 300, 8-bit/color RGBA
```

---

## 🎨 Alternative Solutions

### Solution 1: Use SVG Instead
If PNG isn't working, convert to SVG:

```vue
<template>
  <img src="/images/logos/xyzies-logo.svg" alt="Xyzies Logo" style="max-width: 180px;" />
</template>
```

**Advantages:**
- Vector format (scalable)
- Smaller file size
- Better quality at any size

### Solution 2: Use Base64 Embedded
If file path issues persist:

```vue
<template>
  <img src="data:image/png;base64,iVBORw0KGgoAAAANS..." alt="Logo" />
</template>
```

**Note:** Not recommended for large images

### Solution 3: Move to Assets Folder
Try moving logo to `assets` instead of `public`:

1. Move file:
   ```bash
   mv public/images/logos/xyzies-logo.png assets/images/xyzies-logo.png
   ```

2. Update component:
   ```vue
   <template>
     <img src="~/assets/images/xyzies-logo.png" alt="Logo" style="max-width: 180px;" />
   </template>
   ```

### Solution 4: Use NuxtImg Component
Nuxt has a built-in image component:

```vue
<template>
  <NuxtImg 
    src="/images/logos/xyzies-logo.png" 
    alt="Xyzies Logo" 
    width="180" 
    height="auto"
  />
</template>
```

---

## 🐛 Common Issues & Fixes

### Issue 1: 404 Not Found
**Symptom:** Console shows `GET /images/logos/xyzies-logo.png 404`

**Fix:**
1. Verify file exists in `public/images/logos/`
2. Check filename exact match (case-sensitive)
3. Restart dev server

### Issue 2: Image Broken Icon
**Symptom:** Broken image icon appears

**Fix:**
1. Check if image file is corrupted
2. Try opening image directly: `http://localhost:3000/images/logos/xyzies-logo.png`
3. Re-upload/copy the image file

### Issue 3: Wrong Size
**Symptom:** Logo too big or too small

**Fix:**
Adjust `max-width` in style:
```html
<!-- Smaller -->
<img src="..." style="max-width: 120px; height: auto;" />

<!-- Larger -->
<img src="..." style="max-width: 220px; height: auto;" />
```

### Issue 4: Cache Issue
**Symptom:** Old logo still showing

**Fix:**
```bash
# Clear everything
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

Then hard refresh browser

---

## 🧪 Quick Test

### Test Direct URL
Open in browser:
```
http://localhost:3000/images/logos/xyzies-logo.png
```

**If this works:** Logo file is accessible, issue is in component  
**If this fails:** Logo file not being served correctly

---

## 📝 Current Configuration

### All Logo Components Now Use:
```vue
<img src="/images/logos/xyzies-logo.png" alt="Xyzies Logo" style="max-width: 180px; height: auto;" />
```

**Path:** Direct string (no import)  
**File:** `/public/images/logos/xyzies-logo.png`  
**Size:** Max 180px width, auto height  

---

## ✅ Quick Fix Commands

Run these in order:

```bash
# 1. Go to project directory
cd /Users/pedronave/Documents/addresses_dashboard_front

# 2. Clear cache
rm -rf .nuxt

# 3. Restart dev server
npm run dev

# 4. In browser: Hard refresh (Cmd+Shift+R)
```

---

## 📞 If Still Not Working

### Check This:
1. Is the dev server running? (`npm run dev`)
2. Can you access `http://localhost:3000`?
3. Can you access `http://localhost:3000/images/logos/xyzies-logo.png`?
4. Any errors in terminal where dev server is running?
5. Any errors in browser console (F12)?

### Send Me:
- Screenshot of browser console (F12 → Console tab)
- Screenshot of Network tab showing the image request
- Output of: `ls -lh public/images/logos/`

---

## 🎨 Fallback: Use SVG

If PNG continues not working, I can convert to SVG:

```vue
<template>
  <div class="logo">
    <NuxtLink to="/">
      <svg width="180" height="60" viewBox="0 0 180 60">
        <!-- SVG paths here -->
      </svg>
    </NuxtLink>
  </div>
</template>
```

**Advantages:**
- Always works (inline)
- Scales perfectly
- No file loading issues

---

## ✅ Summary

**Applied Fix:**
- ✅ Removed imports
- ✅ Used direct `src` path
- ✅ Added size constraints
- ✅ Updated all 4 logo components

**Next Steps:**
1. Restart dev server: `npm run dev`
2. Hard refresh browser
3. Check if logo appears
4. If not, open browser console and check for errors

Let me know what you see! 🔍

