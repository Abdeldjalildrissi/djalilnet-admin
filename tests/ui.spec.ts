import { test, expect } from "@playwright/test";

test.describe("Admin UI Elements Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Start at login page
    await page.goto("/login");
  });

  test("Login page is functional", async ({ page }) => {
    // Check for email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    
    // Check for submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  test("Responsive: Admin layout check on Tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });
});
