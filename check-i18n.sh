#!/bin/bash

echo "=========================================="
echo "Next-intl Setup Diagnostic"
echo "=========================================="
echo ""

echo "1. Checking i18n configuration..."
if [ -f "i18n/request.ts" ]; then
    echo "✅ i18n/request.ts exists"
else
    echo "❌ i18n/request.ts NOT FOUND"
fi

echo ""
echo "2. Checking translation files..."
if [ -f "messages/en.json" ]; then
    echo "✅ messages/en.json exists"
else
    echo "❌ messages/en.json NOT FOUND"
fi

if [ -f "messages/am.json" ]; then
    echo "✅ messages/am.json exists"
else
    echo "❌ messages/am.json NOT FOUND"
fi

echo ""
echo "3. Checking app structure..."
if [ -d "app/[locale]" ]; then
    echo "✅ app/[locale] folder exists"
    ls -la app/[locale]/ | grep -E "layout.tsx|page.tsx"
else
    echo "❌ app/[locale] folder NOT FOUND"
fi

echo ""
echo "4. Checking root files..."
if [ -f "app/layout.tsx" ]; then
    echo "✅ app/layout.tsx exists"
fi

if [ -f "app/page.tsx" ]; then
    echo "✅ app/page.tsx exists (should redirect to /en)"
fi

echo ""
echo "5. Checking Next.js config..."
if grep -q "createNextIntlPlugin" next.config.ts; then
    echo "✅ next.config.ts has next-intl plugin"
else
    echo "❌ next.config.ts missing next-intl plugin"
fi

echo ""
echo "6. Checking middleware..."
if grep -q "createMiddleware" middleware.ts; then
    echo "✅ middleware.ts has next-intl middleware"
else
    echo "❌ middleware.ts missing next-intl middleware"
fi

echo ""
echo "7. Checking node_modules..."
if [ -d "node_modules/next-intl" ]; then
    echo "✅ next-intl is installed"
else
    echo "❌ next-intl NOT installed - run: npm install next-intl"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. rm -rf .next"
echo "2. npm run dev"
echo "3. Open: http://localhost:3000/en"
echo "=========================================="
