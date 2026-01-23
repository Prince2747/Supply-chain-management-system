import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/en',
  '/en/about',
  '/en/contact',
  '/en/login',
  '/en/reset-password',
  '/en/update-password',
  '/en/unauthorized',
  '/en/error',
  '/en/sentry-example-page',
];

const protectedRoutes = [
  '/en/profile',
  '/en/admin',
  '/en/admin/users',
  '/en/admin/settings',
  '/en/admin/units',
  '/en/admin/logs',
  '/en/admin/warehouses',
  '/en/dashboard',
  '/en/dashboard/manager',
  '/en/dashboard/field-agent',
  '/en/dashboard/field-agent/farmers',
  '/en/dashboard/field-agent/farms',
  '/en/dashboard/field-agent/notifications',
  '/en/dashboard/field-agent/crops',
  '/en/dashboard/field-agent/qr-codes',
  '/en/dashboard/warehouse-manager',
  '/en/dashboard/warehouse-manager/scanner',
  '/en/dashboard/warehouse-manager/packaging',
  '/en/dashboard/warehouse-manager/storage',
  '/en/dashboard/transport-driver',
  '/en/dashboard/transport-driver/scanner',
  '/en/dashboard/transport-driver/issues',
  '/en/dashboard/transport-driver/tasks',
  '/en/dashboard/procurement-officer',
  '/en/dashboard/procurement-officer/stock-requirements',
  '/en/dashboard/procurement-officer/batch-reviews',
  '/en/dashboard/procurement-officer/inventory',
  '/en/dashboard/transport-coordinator',
  '/en/dashboard/transport-coordinator/drivers',
  '/en/dashboard/transport-coordinator/vehicles',
  '/en/dashboard/transport-coordinator/schedule',
  '/en/dashboard/transport-coordinator/tasks',
  '/en/dashboard/transport-coordinator/reports',
  '/en/dashboard/transport-coordinator/issues',
];

const isAuthRedirect = (url: string) =>
  /\/(en\/)?(login|unauthorized|error)(\?.*)?$/i.test(url);

test.describe('Public routes', () => {
  for (const route of publicRoutes) {
    test(`loads ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      if (route === '/') {
        await expect(page).toHaveURL(/\/en\/?$/);
      }
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

test.describe('Protected routes', () => {
  for (const route of protectedRoutes) {
    test(`redirects or loads ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const currentUrl = page.url();
      if (isAuthRedirect(currentUrl)) {
        expect(isAuthRedirect(currentUrl)).toBeTruthy();
      } else {
        expect(response?.status()).toBeLessThan(400);
      }
    });
  }
});
