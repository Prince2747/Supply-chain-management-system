# i18n Troubleshooting Guide

## Current Setup Status
✅ Configuration file: `/i18n/request.ts`
✅ Translation files: `/messages/en.json`, `/messages/am.json`
✅ Locale layout: `/app/[locale]/layout.tsx`
✅ Home page: `/app/[locale]/page.tsx`
✅ Root redirect: `/app/page.tsx`
✅ Middleware: Updated with locale prefix
✅ Next.js config: Has next-intl plugin

## If Getting 404 on /en

### Step 1: Clear Build Cache
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### Step 2: Restart Dev Server
```bash
# Kill current server (Ctrl+C)
npm run dev
```

### Step 3: Check Terminal Output
Look for errors like:
- "Could not locate request configuration module" (should be fixed)
- "Module not found" errors
- Compilation errors

### Step 4: Test Routes
1. `http://localhost:3000/` → should redirect to `/en`
2. `http://localhost:3000/en` → English home page
3. `http://localhost:3000/am` → Amharic home page

### Step 5: Verify Files Exist
```bash
ls -la app/[locale]/page.tsx
ls -la app/[locale]/layout.tsx
ls -la app/page.tsx
ls -la i18n/request.ts
ls -la messages/en.json
ls -la messages/am.json
```

## Common Issues

### Issue: "params should be awaited"
**Fixed**: `app/[locale]/layout.tsx` now awaits params

### Issue: "Could not locate request configuration"
**Fixed**: Moved to `/i18n/request.ts` and updated `next.config.ts`

### Issue: "Cannot resolve './messages'"
**Fixed**: Changed import to `../messages/${locale}.json`

### Issue: Duplicate html/body tags
**Fixed**: Root layout now just returns children

### Issue: Still getting 404
**Try**: 
1. Check if dev server is running on correct port
2. Hard refresh browser (Ctrl+Shift+R)
3. Check browser console for errors
4. Check terminal for build errors

## Middleware Matcher

Current matcher excludes:
- `/api/*` - API routes
- `/_next/*` - Next.js internals
- `/_vercel/*` - Vercel internals
- Files with dots (images, fonts, etc.)

## For GitHub Codespaces

If using Codespaces URL like:
`https://...app.github.dev/en`

Make sure:
1. Port 3000 is forwarded and public
2. Dev server is actually running
3. Check "Ports" tab in VS Code

## Debug Commands

```bash
# Check if server is running
ps aux | grep next

# Check which files are in [locale] folder
ls -la app/\\[locale\\]/

# Check for TypeScript errors
npx tsc --noEmit

# Check Next.js build
npm run build
```

## Expected File Structure
```
app/
├── [locale]/
│   ├── layout.tsx       ✅ Has html/body tags, awaits params
│   ├── page.tsx         ✅ Home page content
│   ├── about/
│   ├── login/
│   └── ...
├── layout.tsx           ✅ Just returns children
├── page.tsx             ✅ Redirects to /en
├── dashboard/           ✅ No locale (protected routes)
└── admin/               ✅ No locale (protected routes)
```
