import { test, expect } from '@playwright/test';
import { resetDb } from './helpers.js';

test.describe('Responsive Design & Mobile Viewport E2E (375px)', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test.use({ viewport: { width: 375, height: 667 } });

  test('1. Home page renders without horizontal overflow at 375px and mobile menu functions', async ({ page }) => {
    await page.goto('/');

    // Check no horizontal scrollbar overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Mobile menu trigger should be visible
    const menuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(menuTrigger).toBeVisible();

    // Click menu trigger to open mobile drawer
    await menuTrigger.click();
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    await expect(mobileMenu.locator('text=Auctions Catalog')).toBeVisible();

    // Take screenshot for visual audit
    await page.screenshot({ path: 'e2e/screenshots/home-mobile-375px.png', fullPage: false });
  });

  test('2. Auction detail page renders cleanly at 375px without horizontal overflow', async ({ page }) => {
    await page.goto('/');

    // Open first auction
    const firstCard = page.locator('[data-testid="auction-card"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await page.waitForURL(/\/auctions\/[a-f0-9]{24}/);

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify detail components are visible and laid out vertically
    await expect(page.locator('[data-testid="detail-current-bid"]')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // Take screenshot for visual audit
    await page.screenshot({ path: 'e2e/screenshots/detail-mobile-375px.png', fullPage: false });
  });
});
