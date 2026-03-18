import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Get admin accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'abdeldjalildrissi@gmail.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  // Next.js might redirect to / which then renders dashboard
  await page.waitForURL('http://localhost:3001/', { timeout: 10000 });
  await page.waitForSelector('text=Dashboard', { timeout: 5000 });
  
  const results = await new AxeBuilder({ page }).analyze();
  console.log('VIOLATIONS:', JSON.stringify(results.violations, null, 2));
});
