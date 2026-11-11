import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { resetDb } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('capture screenshots for documentation', async ({ page }) => {
  resetDb();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Home / Catalog screenshot
  await page.goto('/');
  await page.waitForSelector('[data-testid="auction-card"]');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(rootDir, 'docs', 'assets', 'campusbid-catalog.jpg'),
    type: 'jpeg',
    quality: 85,
    fullPage: false
  });

  // 2. Auction Detail screenshot
  const firstCard = page.locator('[data-testid="auction-card"]').first();
  await firstCard.click();
  await page.waitForSelector('[data-testid="bid-amount-input"]');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(rootDir, 'docs', 'assets', 'campusbid-auction.jpg'),
    type: 'jpeg',
    quality: 85,
    fullPage: false
  });
});
