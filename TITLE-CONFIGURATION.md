# 📝 Title Configuration Guide - XYZIES Dashboard

## 🎯 Where to Change the Title

The application title appears in **2 files**:

---

## 1. Nuxt Config (Global Default)

**File:** `nuxt.config.ts`

**Current Value:**
```typescript
app: {
  head: {
    title: "XYZIES Dashboard",  // ✅ Updated
  },
},
```

**What it does:**
- Sets the **default title** for all pages
- Used when no specific page title is set
- Shows in browser tab

---

## 2. Layout Default (Template)

**File:** `layouts/default.vue`

**Current Value:**
```typescript
const title = ref("XYZIES Dashboard");  // ✅ Updated

useHead({
  meta: [{ content: title }],
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - XYZIES Dashboard`  // Page title format
      : "XYZIES Dashboard";                  // Default fallback
  },
});
```

**What it does:**
- Creates **title template** for all pages
- Adds suffix to page titles
- Example: "Users - XYZIES Dashboard"

---

## 📊 How Titles Work

### Page Without Custom Title
**Result:** "XYZIES Dashboard"
- Uses default from `nuxt.config.ts`
- No suffix added

### Page With Custom Title
**Example:** Users page sets title "Users"
**Result:** "Users - XYZIES Dashboard"
- Uses `titleTemplate` from `layouts/default.vue`
- Adds " - XYZIES Dashboard" suffix

---

## 🎨 Title Examples

| Page | Browser Tab Title |
|------|-------------------|
| Dashboard | "XYZIES Dashboard" |
| Administrators | "Administrators - XYZIES Dashboard" |
| Roles | "Roles - XYZIES Dashboard" |
| Domains | "Domains - XYZIES Dashboard" |
| Domain Groups | "Domain Groups - XYZIES Dashboard" |
| Login | "Login - XYZIES Dashboard" |

---

## 🔧 How to Change Title

### To Change Brand Name

**Edit both files:**

1. **nuxt.config.ts:**
```typescript
app: {
  head: {
    title: "YOUR BRAND Dashboard",
  },
},
```

2. **layouts/default.vue:**
```typescript
const title = ref("YOUR BRAND Dashboard");

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} - YOUR BRAND Dashboard`
      : "YOUR BRAND Dashboard";
  },
});
```

### To Change Format

**Remove suffix** (just page name):
```typescript
titleTemplate: (titleChunk) => {
  return titleChunk || "XYZIES Dashboard";
},
```
**Result:** "Users", "Domains", etc. (no suffix)

**Change separator:**
```typescript
titleTemplate: (titleChunk) => {
  return titleChunk
    ? `${titleChunk} | XYZIES Dashboard`  // Use | instead of -
    : "XYZIES Dashboard";
},
```
**Result:** "Users | XYZIES Dashboard"

---

## 📍 Current Configuration

### nuxt.config.ts
```typescript
title: "XYZIES Dashboard"
```

### layouts/default.vue
```typescript
title: ref("XYZIES Dashboard")
titleTemplate: "{PageName} - XYZIES Dashboard"
```

---

## ✅ Both Files Updated

- ✅ `nuxt.config.ts` - Default title set to "XYZIES Dashboard"
- ✅ `layouts/default.vue` - Template set to "XYZIES Dashboard"

**Result:** Consistent "XYZIES Dashboard" branding throughout the application!

---

## 🚀 To Apply Changes

After editing title:

```bash
# Restart dev server
npm run dev

# Or clear cache and restart
rm -rf .nuxt
npm run dev

# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 🎯 Summary

**Title is configured in:**
1. **nuxt.config.ts** (line 10-11) - Global default
2. **layouts/default.vue** (line 3, 8-12) - Template and suffix

**Current branding:** "XYZIES Dashboard" ✅

**To change:** Edit both files with your desired title

---

**Date:** November 10, 2025  
**Current Title:** XYZIES Dashboard  
**Files:** 2 (nuxt.config.ts, layouts/default.vue)  
**Status:** ✅ Updated

