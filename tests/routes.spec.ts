import { test, expect } from "@playwright/test";

// List all routes for djalilnet-admin
const routes = [
  "/login",
  "/activity",
  "/articles",
  "/categories",
  "/resume",
  "/settings",
  "/users",
  "/email/inbox",
  "/media",
];

test.describe("Admin Routes Accessibility", () => {
  for (const route of routes) {
    test(`Route ${route} is reachable`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failingUrls: string[] = [];
      
      page.on("requestfailed", (request) => {
        const url = request.url();
        const errorText = request.failure()?.errorText || "";
        const isVercelNoise = url.includes("_vercel/") || url.includes("va.vercel-scripts.com");
        if (isVercelNoise || errorText.includes("net::ERR_ABORTED")) return;
        failingUrls.push(`${url} (Failed: ${errorText})`);
      });
      
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          const isVercelNoise = text.includes("_vercel/") || text.includes("va.vercel-scripts.com");
          const isAuthError = text.includes("401") || text.includes("403") || text.includes("Unauthorized");
          if (isVercelNoise || isAuthError || text.includes("net::ERR_ABORTED")) return;
          consoleErrors.push(text);
        }
      });

      const response = await page.goto(route, { waitUntil: "networkidle" });
      
      // Verification: Should either load directly (public) or redirect to login (if authenticated)
      expect(response?.status()).toBeLessThan(400);
      await expect(page).not.toHaveTitle(/error/i);
      await expect(page.locator("body")).toBeVisible();
      
      if (consoleErrors.length > 0 || failingUrls.length > 0) {
        console.error(`Route ${route} has issues:`, { consoleErrors, failingUrls });
      }
      expect(consoleErrors).toHaveLength(0);
      expect(failingUrls).toHaveLength(0);
    });
  }
});
