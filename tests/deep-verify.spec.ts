import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Admin Panel: Deep Interaction & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'abdeldjalildrissi@gmail.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    try {
      await expect(page).toHaveURL(/.*dashboard|.*articles|.*activity/, { timeout: 15000 });
    } catch (e) {
      await page.screenshot({ path: 'login-failure.png' });
      const html = await page.content();
      console.log('Login Page HTML:', html);
      throw e;
    }
  });

  test('Accessibility scan on dashboard', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForSelector('table', { timeout: 5000 }).catch(() => {});
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations.length).toBeLessThanOrEqual(5);
  });

  test('Article creation flow', async ({ page }) => {
    await page.goto('/articles/new');
    await page.waitForSelector('input[placeholder*="title"]');
    await page.fill('input[placeholder*="title"]', 'Playwright Test Article');
    
    // Content editable div for TipTap or similar
    const editor = page.locator('.ProseMirror, [contenteditable="true"]');
    if (await editor.isVisible()) {
        await editor.fill('This is automated content for testing.');
    }
    
    // Category select
    const categorySelect = page.locator('select');
    if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 0 }); // "No category" or first one
    }

    const saveBtn = page.locator('button:has-text("Save Draft")');
    await expect(saveBtn).toBeEnabled();
    // Verify publish button too
    const publishBtn = page.locator('button:has-text("Publish")');
    await expect(publishBtn).toBeEnabled();
  });

  test('Profile Settings Interaction', async ({ page }) => {
    await page.goto('/settings');
    await page.fill('input[name="name"]', 'Abdeldjalil Drissi (Verified)');
    const updateBtn = page.locator('button:has-text("Update Profile")');
    await expect(updateBtn).toBeEnabled();
  });
});
