import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    return this.page.locator('[data-testid="email"]');
  }

  get passwordInput() {
    return this.page.locator('[data-testid="password"]');
  }

  get loginButton() {
    return this.page.locator('[data-testid="login-button"]');
  }

  get registerLink() {
    return this.page.locator('[data-testid="register-link"]');
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  // Actions
  async navigate() {
    await this.page.goto('/login');
    await expect(this.loginButton).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessfulLogin() {
    // Should redirect away from login page
    await this.page.waitForURL('**/profile', { timeout: 10000 });
  }

  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL('**/register');
  }
} 