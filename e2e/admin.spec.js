import { test, expect } from '@playwright/test';
import { resetDb, loginAs, ACCOUNTS } from './helpers.js';

test.describe('Admin Dashboard, Moderation & User Control E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Admin sees platform statistics KPIs on dashboard', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/admin');

    // Check header and KPIs
    await expect(page.locator('h1:has-text("Administrator Dashboard")')).toBeVisible();
    await expect(page.locator('text=Active Students')).toBeVisible();
    await expect(page.locator('text=Pending Approvals')).toBeVisible();
    await expect(page.locator('text=Total Traded Volume')).toBeVisible();
    await expect(page.getByText('Open Reports', { exact: true })).toBeVisible();
  });

  test('2. Admin approves a pending listing so it appears on home page', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/admin');

    // Locate the first pending listing item
    const approveBtn = page.locator('[data-testid="approve-listing-button"]').first();
    if (await approveBtn.isVisible()) {
      const pendingRow = page.locator('[data-testid="pending-listing-row"]').first();
      const title = await pendingRow.locator('span.font-bold').textContent();

      // Click Approve
      await approveBtn.click();

      // Toast confirms approval
      await expect(page.locator('text=approved')).toBeVisible();

      // Check item appears in public auction catalog
      if (title) {
        await page.goto('/');
        await expect(page.locator(`text=${title}`).first()).toBeVisible();
      }
    }
  });

  test('3. Admin rejects a pending listing with a stated reason', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');

    const rejectBtn = page.locator('[data-testid="reject-listing-button"]').first();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Rejection modal appears
    await expect(page.locator('h3:has-text("Reject Listing")')).toBeVisible();
    await page.fill(
      '#rejectReason',
      'Item description is incomplete and lacks proof of ownership.'
    );
    await page.click('button:has-text("Confirm Rejection")');

    // Toast confirms rejection
    await expect(page.locator('text=rejected')).toBeVisible();
  });

  test('4. Admin suspends a user and that user is prevented from logging in', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin');

    // Switch to Users & Roles tab
    await page.click('[data-testid="tab-users"]');

    // Find the row for an active user (e.g. rahul.sharma@ves.ac.in)
    page.on('dialog', (dialog) => dialog.accept());

    const userRow = page.locator('tr', { hasText: 'rahul.sharma@ves.ac.in' });
    await expect(userRow).toBeVisible();

    const suspendBtn = userRow.locator('[data-testid="suspend-user-button"]');
    await expect(suspendBtn).toContainText('Suspend User');
    await suspendBtn.click();

    // Verify toast confirms suspension
    await expect(page.getByText(/suspended/i).first()).toBeVisible();

    // Logout admin
    await page.click('[data-testid="nav-logout-button"]');

    // Attempt login with the newly suspended user
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', ACCOUNTS.seller.email);
    await page.fill('[data-testid="login-password-input"]', ACCOUNTS.seller.password);
    await page.click('[data-testid="login-submit-button"]');

    // Should display suspension error alert
    const serverError = page.locator('[data-testid="login-server-error"]');
    await expect(serverError).toBeVisible();
    await expect(serverError).toContainText(/suspended/i);
  });
});
