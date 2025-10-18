# Internationalization (i18n) - Adding Amharic Language Support

## 🌍 Overview

Adding Amharic (አማርኛ) and English language switching to your Next.js application.

---

## 📚 Library Options

### Option 1: **next-intl** ⭐⭐⭐⭐⭐ (HIGHLY RECOMMENDED FOR NEXT.JS 15)

**What it is:** The official recommended i18n library for Next.js App Router

**Pros:**
- ✅ Built specifically for Next.js 13+ App Router
- ✅ Server Components support
- ✅ Type-safe translations
- ✅ Automatic locale detection
- ✅ SEO-friendly (separate URLs per language)
- ✅ Small bundle size
- ✅ Great TypeScript support
- ✅ Supports RTL (though Amharic is LTR)

**Cons:**
- None for your use case

**Installation:**
```bash
npm install next-intl
```

**Perfect for:** Your Next.js 15 App Router project

---

### Option 2: **react-i18next** ⭐⭐⭐⭐

**What it is:** Most popular i18n library for React

**Pros:**
- ✅ Very mature (most popular)
- ✅ Large community
- ✅ Lots of plugins
- ✅ Works with any React app

**Cons:**
- ⚠️ Heavier than next-intl
- ⚠️ More setup for Next.js App Router
- ⚠️ Client-side focused (harder with Server Components)

**Installation:**
```bash
npm install react-i18next i18next
```

---

### Option 3: **next-translate** ⭐⭐⭐

**What it is:** Lightweight i18n for Next.js

**Pros:**
- ✅ Lightweight
- ✅ Simple API

**Cons:**
- ⚠️ Less active development
- ⚠️ Smaller community

---

## 🎯 **Recommended Approach: next-intl**

Here's a complete implementation guide:

---

## 🚀 Implementation with next-intl

### Step 1: Install

```bash
npm install next-intl
```

### Step 2: Create Translation Files

Create a `messages` folder in your project root:

```
/workspaces/Supply-chain-management-system/
├── messages/
│   ├── en.json
│   └── am.json  (Amharic)
├── app/
├── components/
└── ...
```

**messages/en.json:**
```json
{
  "navigation": {
    "home": "Home",
    "about": "About Us",
    "contact": "Contact",
    "login": "Login",
    "products": "Products",
    "services": "Services"
  },
  "hero": {
    "title": "Premium Ethiopian Agricultural Products",
    "subtitle": "Quality Coffee, Sesame, and Pulses for Global Markets",
    "cta": "Explore Our Products"
  },
  "products": {
    "coffee": "Coffee",
    "sesame": "Sesame Seeds",
    "pulses": "Pulses",
    "machinery": "Machinery",
    "steel": "Steel Bars",
    "tyres": "Tyres"
  },
  "about": {
    "mission": "Our Mission",
    "vision": "Our Vision",
    "missionText": "To provide premium quality Ethiopian agricultural products to international markets while supporting local farmers and ensuring sustainable practices.",
    "visionText": "To become the leading export company in Ethiopia, recognized globally for quality, reliability, and ethical business practices."
  },
  "contact": {
    "title": "Get in Touch",
    "address": "Churchill Avenue, Eshetu Mamo Building F8, Office 801",
    "phone": "Phone",
    "email": "Email",
    "callUs": "Call Us",
    "emailUs": "Email Us",
    "visitUs": "Visit Us"
  },
  "dashboard": {
    "fieldAgent": "Field Agent Dashboard",
    "admin": "Admin Dashboard",
    "warehouses": "Warehouses",
    "users": "Users",
    "settings": "Settings",
    "logout": "Logout"
  },
  "forms": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "filter": "Filter"
  }
}
```

**messages/am.json:**
```json
{
  "navigation": {
    "home": "መነሻ",
    "about": "ስለ እኛ",
    "contact": "አድራሻ",
    "login": "ግባ",
    "products": "ምርቶች",
    "services": "አገልግሎቶች"
  },
  "hero": {
    "title": "ምርጥ የኢትዮጵያ የግብርና ምርቶች",
    "subtitle": "ለአለም ዓለም ገበያዎች ጥራት ያለው ቡና፣ ሰሊጥ እና ጥራጥሬዎች",
    "cta": "ምርቶቻችንን ይመልከቱ"
  },
  "products": {
    "coffee": "ቡና",
    "sesame": "ሰሊጥ",
    "pulses": "ጥራጥሬ",
    "machinery": "ማሽነሪ",
    "steel": "የብረት ዘንጎች",
    "tyres": "ጎማዎች"
  },
  "about": {
    "mission": "የእኛ ተልዕኮ",
    "vision": "የእኛ ራዕይ",
    "missionText": "የአካባቢ ገበሬዎችን እየደገፉ እና ዘላቂ ልምዶችን እያረጋገጡ ወደ አለም አቀፍ ገበያዎች ከፍተኛ ጥራት ያላቸው የኢትዮጵያ የግብርና ምርቶችን ለማቅረብ።",
    "visionText": "በኢትዮጵያ ውስጥ ግንባር ቀደም የኤክስፖርት ኩባንያ ለመሆን፣ በጥራት፣ በታማኝነት እና በስነ-ምግባራዊ የንግድ ልምምዶች በዓለም ዙሪያ እውቅና ለማግኘት።"
  },
  "contact": {
    "title": "ያግኙን",
    "address": "ቸርችል አቬኑ፣ እሸቱ ማሞ ህንፃ F8፣ ቢሮ 801",
    "phone": "ስልክ",
    "email": "ኢሜይል",
    "callUs": "ይደውሉልን",
    "emailUs": "ኢሜይል ይላኩልን",
    "visitUs": "ይጎብኙን"
  },
  "dashboard": {
    "fieldAgent": "የመስክ ወኪል ዳሽቦርድ",
    "admin": "የአስተዳዳሪ ዳሽቦርድ",
    "warehouses": "መጋዘኖች",
    "users": "ተጠቃሚዎች",
    "settings": "ቅንብሮች",
    "logout": "ውጣ"
  },
  "forms": {
    "submit": "አስገባ",
    "cancel": "ሰርዝ",
    "save": "አስቀምጥ",
    "delete": "ሰርዝ",
    "edit": "አርትዕ",
    "search": "ፈልግ",
    "filter": "ማጣሪያ"
  }
}
```

### Step 3: Configure next-intl

**i18n.ts** (create in root):
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'am'] as const;
export const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

**next.config.ts:**
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* your existing config */
};

export default withNextIntl(nextConfig);
```

### Step 4: Update Project Structure

Wrap your entire app in locale folders:

**Before:**
```
app/
├── page.tsx
├── about/
├── contact/
└── dashboard/
```

**After:**
```
app/
├── [locale]/
│   ├── page.tsx
│   ├── about/
│   ├── contact/
│   └── dashboard/
└── layout.tsx  (root layout)
```

### Step 5: Create Root Layout

**app/layout.tsx:**
```typescript
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const locales = ['en', 'am'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Step 6: Use Translations in Components

**Server Components (app/[locale]/page.tsx):**
```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('hero');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <button>{t('cta')}</button>
    </div>
  );
}
```

**Client Components:**
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function Navigation() {
  const t = useTranslations('navigation');

  return (
    <nav>
      <Link href="/">{t('home')}</Link>
      <Link href="/about">{t('about')}</Link>
      <Link href="/contact">{t('contact')}</Link>
    </nav>
  );
}
```

### Step 7: Language Switcher Component

**components/language-switcher.tsx:**
```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from pathname and add new one
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => switchLanguage('en')}
          className={locale === 'en' ? 'bg-gray-100' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLanguage('am')}
          className={locale === 'am' ? 'bg-gray-100' : ''}
        >
          🇪🇹 አማርኛ (Amharic)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Step 8: Add to Navigation

```typescript
import { LanguageSwitcher } from '@/components/language-switcher';

export function Navigation() {
  return (
    <nav>
      {/* ... other nav items ... */}
      <LanguageSwitcher />
    </nav>
  );
}
```

---

## 🔤 Amharic Font Considerations

Amharic uses the Ge'ez script. Make sure to use fonts that support it:

**Add to app/globals.css:**
```css
/* Import font that supports Amharic/Ge'ez script */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');

body {
  font-family: 'Noto Sans Ethiopic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Or use Google Fonts with Next.js:
```typescript
// app/layout.tsx
import { Noto_Sans_Ethiopic } from 'next/font/google';

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html className={notoSansEthiopic.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📝 Translation Workflow

### Option 1: Manual Translation
- Hire professional translator
- Use translation services (Gengo, One Hour Translation)
- Work with local Ethiopian translators

### Option 2: AI-Assisted (Initial Draft)
- Use Google Translate API for initial draft
- **IMPORTANT:** Always have native speaker review and correct
- ChatGPT/Claude can help but needs native verification

### Option 3: Community Translation
- Use platforms like Crowdin, Lokalise
- Let users contribute translations

---

## 🌐 URL Structure

Your URLs will look like:
- `yoursite.com/en` - English
- `yoursite.com/am` - Amharic
- `yoursite.com/en/about` - English About page
- `yoursite.com/am/about` - Amharic About page

---

## ✅ SEO Benefits

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

---

## 📊 Implementation Checklist

1. ✅ Install next-intl
2. ✅ Create translation files (en.json, am.json)
3. ✅ Configure i18n.ts and next.config.ts
4. ✅ Restructure app to use [locale] folder
5. ✅ Update all components to use translations
6. ✅ Add language switcher
7. ✅ Add Amharic font support
8. ✅ Get professional translation for Amharic
9. ✅ Test both languages
10. ✅ Update SEO metadata

---

## 🎯 **Time Estimate**

- **Setup & Config**: 2 hours
- **Creating translation files**: 4-8 hours (depending on content)
- **Updating components**: 1-2 days
- **Professional translation**: 1-3 days (external)
- **Testing & refinement**: 1 day

**Total: 3-5 days**

---

## 💡 **My Recommendation**

1. Start with **next-intl** (best for Next.js 15)
2. Translate the most important pages first (Home, About, Contact, Login)
3. Use **Noto Sans Ethiopic** font for Amharic
4. Get a **native Amharic speaker** to review translations
5. Dashboard can be English-only initially (technical users)

Would you like me to start implementing this? I can begin with the setup and create sample translation files! 🚀
