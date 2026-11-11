import { test, expect } from '@playwright/test';
import { resetDb, loginAs, ACCOUNTS } from './helpers.js';

test.describe('Authentication & Authorization E2E', () => {
  test.beforeEach(async () => {
    resetDb();
  });

  test('1. Register rejects non-@ves.ac.in email with validation error', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="register-name-input"]', 'External User');
    await page.fill('[data-testid="register-email-input"]', 'external@gmail.com');
    await page.fill('[data-testid="register-class-input"]', 'D12A / EXTC');
    await page.fill('[data-testid="register-roll-input"]', '15');
    await page.fill('[data-testid="register-password-input"]', 'Password123');
    await page.fill('[data-testid="register-confirm-password-input"]', 'Password123');

    await page.click('[data-testid="register-submit-button"]');

    // Should display validation error on email
    const emailError = page.locator('[data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('@ves.ac.in');
  });

  test('2. Register success with @ves.ac.in lands on Home authenticated', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `newstudent_${timestamp}@ves.ac.in`;

    await page.goto('/register');
    await page.fill('[data-testid="register-name-input"]', 'New Student');
    await page.fill('[data-testid="register-email-input"]', testEmail);
    await page.fill('[data-testid="register-class-input"]', 'D15B / CMPN');
    await page.fill('[data-testid="register-roll-input"]', '99');
    await page.fill('[data-testid="register-password-input"]', 'Password123');
    await page.fill('[data-testid="register-confirm-password-input"]', 'Password123');

    await page.click('[data-testid="register-submit-button"]');

    // Should navigate to Home
    await expect(page).toHaveURL('/');
    // Navbar should display profile link
    await expect(page.locator('[data-testid="nav-profile-link"]')).toBeVisible();
  });

  test('3. Login with wrong password displays server error banner', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="login-email-input"]', ACCOUNTS.student.email);
    await page.fill('[data-testid="login-password-input"]', 'WrongPassword999');
    await page.click('[data-testid="login-submit-button"]');

    const errorBanner = page.locator('[data-testid="login-server-error"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Invalid|credentials|failed/i);
  });

  test('4. Logout clears session and returns to unauthenticated state', async ({ page }) => {
    await loginAs(page, 'student');
    await page.goto('/');

    // Click logout button in Navbar
    const logoutBtn = page.locator('[data-testid="nav-logout-button"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify token removed and Sign In button visible
    await expect(page.locator('[data-testid="nav-login-link"]')).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('campusbid_token'));
    expect(token).toBeNull();
  });

  test('5. Unauthenticated user visiting /create is redirected to /login', async ({ page }) => {
    // Clear localStorage token
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('campusbid_token'));

    await page.goto('/create');
    await expect(page).toHaveURL(/\/login/);
  });

  test('6. Student role visiting /admin is blocked and redirected to /', async ({ page }) => {
    await loginAs(page, 'student');
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });
});
