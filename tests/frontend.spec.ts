import { test, expect } from '@playwright/test';

const routes = [
  '/login',
  '/activity',
  '/articles',
  '/categories',
  '/resume',
  '/settings',
  '/users',
  '/email/inbox',
  '/media',
];

test.describe('Admin Panel: Page load tests', () => {
  for (const route of routes) {
    test(`Route ${route} redirects to login or loads`, async ({ page }) => {
      const response = await page.goto(route);
      // Protected routes should redirect to login if not authenticated
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

test.describe('Admin Panel: Auth UI', () => {
  test('Login page has necessary fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')).toBeVisible();
  });
});
