import { test, expect } from '@playwright/test';

test.describe('Admin Panel: Route Protection', () => {
  const protectedRoutes = [
    '/dashboard',
    '/articles',
    '/categories',
    '/settings',
    '/users',
  ];

  for (const route of protectedRoutes) {
    test(`ProtectedRoute ${route} redirects to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    });
  }

  test('Public route /login is accessible', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);
  });
});
