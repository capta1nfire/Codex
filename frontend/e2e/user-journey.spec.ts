import { test, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth-fixture';
import { GeneratorPage } from './pages/generator-page';

test.describe('Complete User Journey', () => {
  test('should complete full user workflow from registration to barcode generation', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/CODEX/);

    // 2. Navigate to registration
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL(/.*\/register/);

    // 3. Register new user (using timestamp to ensure uniqueness)
    const timestamp = Date.now();
    const newUser = {
      firstName: 'E2E',
      lastName: 'Test',
      email: `e2e.test.${timestamp}@codex.test`,
      password: 'TestPassword123!'
    };

    await page.fill('[data-testid="firstName"]', newUser.firstName);
    await page.fill('[data-testid="lastName"]', newUser.lastName);
    await page.fill('[data-testid="email"]', newUser.email);
    await page.fill('[data-testid="password"]', newUser.password);
    await page.fill('[data-testid="confirmPassword"]', newUser.password);
    await page.click('[data-testid="register-button"]');

    // 4. Should be redirected to profile after successful registration
    await expect(page).toHaveURL(/.*\/profile/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // 5. Verify user profile information
    await expect(page.locator('text=' + newUser.firstName)).toBeVisible();
    await expect(page.locator('text=' + newUser.email)).toBeVisible();

    // 6. Generate API Key
    await page.click('[data-testid="generate-api-key-button"]');
    await expect(page.locator('[data-testid="api-key-success"]')).toBeVisible();

    // 7. Navigate to barcode generator
    await page.goto('/');
    const generatorPage = new GeneratorPage(page);

    // 8. Generate a QR Code
    await generatorPage.generateBarcode('qrcode', 'E2E Test QR Code');
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();

    // 9. Download the generated barcode
    const download = await generatorPage.downloadBarcode();
    expect(download.suggestedFilename()).toMatch(/qrcode.*\.(svg|png)$/);

    // 10. Generate different barcode type
    await generatorPage.generateBarcode('code128', 'E2ETEST123');
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();

    // 11. Verify user can access profile
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await expect(page).toHaveURL(/.*\/profile/);

    // 12. Update profile information
    await page.click('[data-testid="edit-profile-button"]');
    await page.fill('[data-testid="firstName"]', 'Updated');
    await page.click('[data-testid="save-profile-button"]');
    await expect(page.locator('text=Updated')).toBeVisible();

    // 13. Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*\/(login|$)/);
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  authTest('authenticated user can generate multiple barcodes in session', async ({ authenticatedPage }) => {
    const generatorPage = new GeneratorPage(authenticatedPage);
    await generatorPage.navigate();

    const testCases = [
      { type: 'qrcode', data: 'Session Test 1' },
      { type: 'code128', data: 'SESSIONTEST2' },
      { type: 'ean13', data: '1234567890123' },
    ];

    for (const testCase of testCases) {
      await generatorPage.generateBarcode(testCase.type, testCase.data);
      await generatorPage.waitForGeneration();
      await generatorPage.expectBarcodeVisible();
      
      // Small delay between generations
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/generate/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Internal server error' } }),
      });
    });

    const generatorPage = new GeneratorPage(page);
    await generatorPage.navigate();
    await generatorPage.generateBarcode('qrcode', 'Test Data');
    
    await generatorPage.expectGenerationError('Error del servidor');
  });

  test('should work properly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const generatorPage = new GeneratorPage(page);
    await generatorPage.navigate();
    
    // Verify mobile responsiveness
    await expect(generatorPage.barcodeTypeSelect).toBeVisible();
    await expect(generatorPage.dataInput).toBeVisible();
    await expect(generatorPage.generateButton).toBeVisible();
    
    // Generate barcode on mobile
    await generatorPage.generateBarcode('qrcode', 'Mobile Test');
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Start offline
    await page.context().setOffline(true);
    
    const generatorPage = new GeneratorPage(page);
    await generatorPage.navigate();
    await generatorPage.generateBarcode('qrcode', 'Offline Test');
    
    // Should show network error
    await generatorPage.expectGenerationError('Error de conexión');
    
    // Go back online
    await page.context().setOffline(false);
    
    // Retry should work
    await generatorPage.generateButton.click();
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
  });
}); 