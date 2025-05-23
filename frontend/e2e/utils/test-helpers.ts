import { Page, expect } from '@playwright/test';

/**
 * Wait for an element to be visible with retry logic
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Fill form fields from an object
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(`[data-testid="${selector}"]`, value);
  }
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string) {
  return page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page, 
  urlPattern: string, 
  response: any, 
  status = 200
) {
  await page.route(urlPattern, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Generate unique test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test.${timestamp}@codex.test`,
    firstName: `Test${timestamp}`,
    lastName: 'User',
    password: 'TestPassword123!',
  };
}

/**
 * Verify barcode generation completed
 */
export async function verifyBarcodeGenerated(page: Page) {
  await expect(page.locator('[data-testid="generated-barcode"]')).toBeVisible();
  await expect(page.locator('[data-testid="generated-barcode"] svg')).toBeVisible();
}

/**
 * Clear browser storage
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Set authentication token manually
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
  }, token);
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading spinners to disappear
  await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 10000 });
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
}

/**
 * Validate form errors
 */
export async function expectFormErrors(page: Page, expectedErrors: string[]) {
  for (const error of expectedErrors) {
    await expect(page.locator(`text=${error}`)).toBeVisible();
  }
}

/**
 * Navigate and wait for page load
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

/**
 * Retry an action with exponential backoff
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
} 