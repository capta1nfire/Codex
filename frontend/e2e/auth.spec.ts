import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { TEST_USER } from './fixtures/auth-fixture';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await loginPage.navigate();
    
    await expect(page).toHaveTitle(/CODEX/);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.expectSuccessfulLogin();
    
    // Verify we're on the profile page and user is authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=' + TEST_USER.firstName)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    await loginPage.expectLoginError('Credenciales inválidas');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.loginButton.click();
    
    // Check for required field validation
    await expect(page.locator('text=El email es requerido')).toBeVisible();
    await expect(page.locator('text=La contraseña es requerida')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.navigate();
    await loginPage.goToRegister();
    
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.expectSuccessfulLogin();
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home or login
    await expect(page).toHaveURL(/.*\/(login|$)/);
    
    // User menu should not be visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should persist authentication across page refreshes', async ({ page }) => {
    // Login
    await loginPage.navigate();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.expectSuccessfulLogin();
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
}); 