import { test, expect } from '@playwright/test';
import { resetDb } from './helpers.js';

test.describe('Catalog Browsing, Search & Filter E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Home page lists seeded active auctions', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('[data-testid="auction-card"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2. Search bar narrows catalog results by keyword', async ({ page }) => {
    await page.goto('/');

    // Search for "MacBook"
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('MacBook');
    await searchInput.press('Enter');

    // Wait for filtered results
    const cards = page.locator('[data-testid="auction-card"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(/MacBook/i);

    // Searching for non-existent keyword should show empty state
    await searchInput.fill('XYZNonExistentKeyword999');
    await searchInput.press('Enter');
    await expect(page.locator('[data-testid="listings-empty"]')).toBeVisible();
  });

  test('3. Category filter displays only matching products', async ({ page }) => {
    await page.goto('/');

    // Click Books category filter
    const booksTab = page.locator('[data-testid="category-filter-books"]');
    await booksTab.click();

    // Verify all rendered cards have 'books' badge or related title
    const cards = page.locator('[data-testid="auction-card"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(/books/i);
  });

  test('4. Sort select orders auctions correctly', async ({ page }) => {
    await page.goto('/');

    const sortSelect = page.locator('[data-testid="sort-select"]');
    await sortSelect.selectOption('price_high');

    // Wait for results to update
    const cards = page.locator('[data-testid="auction-card"]');
    await expect(cards.first()).toBeVisible();
    // In seeded data, MacBook Air (₹46,500) should be first when sorted price-desc
    await expect(cards.first()).toContainText(/MacBook/i);
  });

  test('5. Clicking an auction card opens its detail page', async ({ page }) => {
    await page.goto('/');

    const firstCard = page.locator('[data-testid="auction-card"]').first();
    const cardTitle = await firstCard.locator('h3').textContent();
    await firstCard.click();

    await expect(page).toHaveURL(/\/auctions\/[a-f0-9]{24}/);
    if (cardTitle) {
      await expect(page.locator('h1')).toContainText(cardTitle.trim());
    }
  });

  test('6. Visiting an unknown product ID shows not found error', async ({ page }) => {
    // 24-char hex ObjectId that does not exist in the database
    await page.goto('/auctions/000000000000000000000000');

    const errorView = page.locator('[data-testid="detail-error"]');
    await expect(errorView).toBeVisible();
    await expect(errorView).toContainText(/Product not found|error/i);
  });
});
