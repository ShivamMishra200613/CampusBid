import { test, expect } from '@playwright/test';
import { resetDb, loginAs } from './helpers.js';

test.describe('Real-Time Socket.IO Multi-Client Bidding & Notifications E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Two browser contexts: User B bids, User A sees live price update and outbid alert without reload', async ({ browser }) => {
    // 1. Setup Context A (Buyer A - Priya Patel)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await loginAs(pageA, 'bidder');

    // 2. Setup Context B (Buyer B - Aditya Verma)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await loginAs(pageB, 'student');

    // Both users navigate to the same live auction (Engineering Mathematics bundle, seller Rahul Sharma)
    await pageA.goto('/');
    const itemCardA = pageA.locator('[data-testid="auction-card"]', { hasText: 'Engineering Mathematics' });
    await itemCardA.click();
    await pageA.waitForURL(/\/auctions\/[a-f0-9]{24}/);

    await pageB.goto('/');
    const itemCardB = pageB.locator('[data-testid="auction-card"]', { hasText: 'Engineering Mathematics' });
    await itemCardB.click();
    await pageB.waitForURL(/\/auctions\/[a-f0-9]{24}/);

    // Verify both pages have joined the room and viewer count is tracked
    const viewerCountA = pageA.locator('[data-testid="viewer-count"]');
    await expect(viewerCountA).toBeVisible();

    // User A (Priya) places a bid
    const bidInputA = pageA.locator('[data-testid="bid-amount-input"]');
    const placeholderA = await bidInputA.getAttribute('placeholder');
    const minBidA = parseInt(placeholderA.replace(/\D/g, ''), 10) || 1600;

    await bidInputA.fill(String(minBidA));
    await pageA.click('[data-testid="place-bid-button"]');

    // User A sees winning badge
    await expect(pageA.locator('[data-testid="winning-badge"]')).toBeVisible();

    // User B's page receives real-time update of User A's bid without reload!
    const currentBidB = pageB.locator('[data-testid="detail-current-bid"]');
    await expect(currentBidB).toContainText(Number(minBidA).toLocaleString('en-IN'));

    // Now User B (Aditya) outbids User A with a higher bid
    const higherBidAmount = minBidA + 100;
    const bidInputB = pageB.locator('[data-testid="bid-amount-input"]');
    await bidInputB.fill(String(higherBidAmount));
    await pageB.click('[data-testid="place-bid-button"]');

    // User B is now winning
    await expect(pageB.locator('[data-testid="winning-badge"]')).toBeVisible();

    // User A sees the new price without reload and receives outbid notification!
    const currentBidA = pageA.locator('[data-testid="detail-current-bid"]');
    await expect(currentBidA).toContainText(Number(higherBidAmount).toLocaleString('en-IN'));

    // User A sees the outbid alert banner
    await expect(pageA.locator('[data-testid="outbid-badge"]')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
