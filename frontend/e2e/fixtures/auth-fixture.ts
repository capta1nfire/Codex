import { test as base, expect, Page } from '@playwright/test';

// Test user credentials
export const TEST_USER = {
  email: 'test.user@codex.test',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

// Extend basic test with authenticated user
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: typeof TEST_USER;
}>({
  testUser: async ({}, use) => {
    await use(TEST_USER);
  },

  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('[data-testid="email"]', TEST_USER.email);
    await page.fill('[data-testid="password"]', TEST_USER.password);

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Wait for successful login (redirect to dashboard or profile)
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await use(page);
  },
});

export { expect } from '@playwright/test'; 