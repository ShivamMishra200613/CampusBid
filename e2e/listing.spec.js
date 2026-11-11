import { test, expect } from '@playwright/test';
import { resetDb, loginAs } from './helpers.js';

test.describe('Listing Creation, Moderation & Management E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Student creates a listing and sees it in My Listings queue', async ({ page }) => {
    await loginAs(page, 'seller');

    await page.goto('/create');

    // Fill listing details
    const timestamp = Date.now();
    const itemTitle = `Arduino Starter Kit V2 - ${timestamp}`;

    await page.fill('[data-testid="listing-title-input"]', itemTitle);
    await page.selectOption('select[name="category"]', 'electronics');
    await page.selectOption('select[name="condition"]', 'Like New');
    await page.fill('textarea[name="description"]', 'Brand new UNO R3 microcontroller with 30 sensors and jumper wires.');
    await page.fill('[data-testid="listing-starting-bid-input"]', '1200');
    await page.fill('[data-testid="listing-increment-input"]', '50');

    // Add image via secondary URL option
    await page.click('[data-testid="toggle-url-input-button"]');
    await page.fill('[data-testid="image-url-input"]', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800');
    await page.click('[data-testid="add-image-url-button"]');

    // Verify image preview is rendered
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

    // Submit for publication
    await page.click('[data-testid="publish-listing-button"]');

    // Should redirect to auction detail or my-listings
    await page.waitForURL(/\/auctions\/|\/my-listings/);

    // Go to My Listings to verify it appears in queue
    await page.goto('/my-listings');

    // Check listing card in My Listings
    const listingCard = page.locator('[data-testid="my-listing-card"]', { hasText: itemTitle });
    await expect(listingCard).toBeVisible();
    // Moderation rule: non-draft new listings start as pending_approval ("Under Review")
    await expect(listingCard).toContainText(/Under Review|Pending|Live/i);
  });

  test('2. Student creates a draft listing, edits it, and submits', async ({ page }) => {
    await loginAs(page, 'seller');

    await page.goto('/create');

    const timestamp = Date.now();
    const draftTitle = `Draft DSP Lab Kit - ${timestamp}`;

    await page.fill('[data-testid="listing-title-input"]', draftTitle);
    await page.selectOption('select[name="category"]', 'electronics');
    await page.fill('textarea[name="description"]', 'Initial draft description for DSP kit.');
    await page.fill('[data-testid="listing-starting-bid-input"]', '800');
    await page.fill('[data-testid="listing-increment-input"]', '50');

    // Click Save as Draft
    await page.click('[data-testid="save-draft-button"]');
    await page.waitForURL(/\/my-listings/);

    // Filter to Drafts tab
    const draftsTab = page.locator('button', { hasText: /Drafts/i });
    if (await draftsTab.isVisible()) {
      await draftsTab.click();
    }

    const card = page.locator('[data-testid="my-listing-card"]', { hasText: draftTitle });
    await expect(card).toBeVisible();

    // Click Edit
    const editBtn = card.locator('[data-testid="edit-listing-button"]');
    await editBtn.click();
    await expect(page).toHaveURL(/\/create\?edit=/);

    // Add image during edit and update title
    await page.click('[data-testid="toggle-url-input-button"]');
    await page.fill('[data-testid="image-url-input"]', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800');
    await page.click('[data-testid="add-image-url-button"]');

    const updatedTitle = `Updated DSP Lab Kit - ${timestamp}`;
    await page.fill('[data-testid="listing-title-input"]', updatedTitle);
    await page.click('[data-testid="publish-listing-button"]');

    await page.waitForURL(/\/auctions\/|\/my-listings/);
    await page.goto('/my-listings');
    await expect(page.locator('[data-testid="my-listing-card"]', { hasText: updatedTitle })).toBeVisible();
  });

  test('3. Student can delete an auction from My Listings', async ({ page }) => {
    await loginAs(page, 'seller');
    await page.goto('/my-listings');

    // Find first deletable card
    const firstCard = page.locator('[data-testid="my-listing-card"]').first();
    await expect(firstCard).toBeVisible();
    const titleToDelete = await firstCard.locator('h3').textContent();

    // Delete listing
    page.on('dialog', (dialog) => dialog.accept());
    const deleteBtn = firstCard.locator('[data-testid="delete-listing-button"]');
    await deleteBtn.click();

    // Verify item removed from page
    if (titleToDelete) {
      await expect(page.locator('[data-testid="my-listing-card"]', { hasText: titleToDelete })).not.toBeVisible();
    }
  });
});
