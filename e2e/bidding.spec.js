import { test, expect } from '@playwright/test';
import { resetDb, loginAs, bidViaApi, ACCOUNTS } from './helpers.js';

test.describe('Bidding Workflow & Concurrency Protection E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Bid below the minimum allowed increment displays validation error', async ({ page }) => {
    await loginAs(page, 'student'); // Amit Verma

    // Open live MacBook auction
    await page.goto('/');
    const macBookCard = page.locator('[data-testid="auction-card"]', { hasText: 'MacBook Air' });
    await macBookCard.click();

    await expect(page.locator('[data-testid="detail-current-bid"]')).toBeVisible();

    // In seeded data, current bid is 46,500 and min increment is 500, minBid is 47,000
    // Fill a bid below minimum
    const bidInput = page.locator('[data-testid="bid-amount-input"]');
    await bidInput.fill('46000');
    await page.click('[data-testid="place-bid-button"]');

    // Should show error message
    const errorMsg = page.locator('[data-testid="bid-amount-error"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/at least/i);
  });

  test('2. Valid bid updates the highest bid price and bid history immediately', async ({ page }) => {
    await loginAs(page, 'student'); // Aditya Verma

    await page.goto('/');
    const macBookCard = page.locator('[data-testid="auction-card"]', { hasText: 'MacBook Air' });
    await macBookCard.click();

    // Read current min required bid from placeholder
    const bidInput = page.locator('[data-testid="bid-amount-input"]');
    const placeholder = await bidInput.getAttribute('placeholder');
    const minRequired = parseInt(placeholder.replace(/\D/g, ''), 10) || 47000;

    // Place valid bid
    await bidInput.fill(String(minRequired + 500));
    await page.click('[data-testid="place-bid-button"]');

    // Wait for bid to be accepted
    const currentBidDisplay = page.locator('[data-testid="detail-current-bid"]');
    await expect(currentBidDisplay).toContainText(Number(minRequired + 500).toLocaleString('en-IN'));

    // Check bid history contains Aditya Verma
    await expect(page.locator('text=Aditya Verma').first()).toBeVisible();
  });

  test('3. Seller cannot bid on their own listed auction', async ({ page }) => {
    // Rahul Sharma is the seller of MacBook Air
    await loginAs(page, 'seller');

    await page.goto('/');
    const macBookCard = page.locator('[data-testid="auction-card"]', { hasText: 'MacBook Air' });
    await macBookCard.click();

    // Verify seller cannot place bid: bid form is replaced by notice
    await expect(page.locator('text=Sellers cannot bid on their own listings')).toBeVisible();
    await expect(page.locator('[data-testid="bid-amount-input"]')).not.toBeVisible();
  });

  test('4. My Bids page tracks Winning status and updates to Outbid', async ({ page, request }) => {
    // Log in as Priya Patel (bidder)
    const { token: priyaToken, user: priyaUser } = await loginAs(page, 'bidder');

    // Navigate to live Engineering Textbooks bundle
    await page.goto('/');
    const bookCard = page.locator('[data-testid="auction-card"]', { hasText: 'Engineering Mathematics' });
    await bookCard.click();

    // Place winning bid as Priya
    const bidInput = page.locator('[data-testid="bid-amount-input"]');
    const placeholder = await bidInput.getAttribute('placeholder');
    const minBidAmount = parseInt(placeholder.replace(/\D/g, ''), 10) || 1600;

    await bidInput.fill(String(minBidAmount));
    await page.click('[data-testid="place-bid-button"]');

    // Wait for bid acceptance
    await expect(page.locator('[data-testid="winning-badge"]')).toBeVisible();

    // Check My Bids shows Winning
    await page.goto('/my-bids');
    const bookRow = page.locator('[data-testid="bid-row"]', { hasText: 'Engineering Mathematics' });
    await expect(bookRow).toBeVisible();
    await expect(bookRow).toContainText('Winning');

    // Another student (Amit) logs in via API and outbids Priya
    const loginRes = await request.post('http://localhost:5001/api/v1/auth/login', {
      data: {
        email: ACCOUNTS.student.email,
        password: ACCOUNTS.student.password
      }
    });
    const amitAuth = await loginRes.json();
    const productUrl = page.url();

    // Get product ID from url
    await page.goto('/');
    const card = page.locator('[data-testid="auction-card"]', { hasText: 'Engineering Mathematics' });
    const href = await card.getAttribute('href');
    const productId = href.split('/').pop();

    // Amit places higher bid via API
    await bidViaApi(request, amitAuth.token, productId, minBidAmount + 100);

    // Refresh Priya's My Bids page
    await page.goto('/my-bids');
    const updatedRow = page.locator('[data-testid="bid-row"]', { hasText: 'Engineering Mathematics' });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Outbid');
  });
});
