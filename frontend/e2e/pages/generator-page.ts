import { Page, expect } from '@playwright/test';

export class GeneratorPage {
  constructor(private page: Page) {}

  // Locators
  get barcodeTypeSelect() {
    return this.page.locator('[data-testid="barcode-type-select"]');
  }

  get dataInput() {
    return this.page.locator('[data-testid="barcode-data-input"]');
  }

  get generateButton() {
    return this.page.locator('[data-testid="generate-button"]');
  }

  get generatedBarcode() {
    return this.page.locator('[data-testid="generated-barcode"]');
  }

  get downloadButton() {
    return this.page.locator('[data-testid="download-button"]');
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  get loadingSpinner() {
    return this.page.locator('[data-testid="loading-spinner"]');
  }

  // QR Code specific options
  get qrSizeSlider() {
    return this.page.locator('[data-testid="qr-size-slider"]');
  }

  get qrErrorCorrectionSelect() {
    return this.page.locator('[data-testid="qr-error-correction-select"]');
  }

  // Actions
  async navigate() {
    await this.page.goto('/');
    await expect(this.generateButton).toBeVisible();
  }

  async selectBarcodeType(type: string) {
    await this.barcodeTypeSelect.selectOption(type);
  }

  async enterData(data: string) {
    await this.dataInput.fill(data);
  }

  async generateBarcode(type: string, data: string) {
    await this.selectBarcodeType(type);
    await this.enterData(data);
    await this.generateButton.click();
  }

  async waitForGeneration() {
    // Wait for loading to disappear and barcode to appear
    await expect(this.loadingSpinner).toBeHidden({ timeout: 10000 });
    await expect(this.generatedBarcode).toBeVisible();
  }

  async expectGenerationError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async downloadBarcode() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadButton.click();
    const download = await downloadPromise;
    return download;
  }

  async setQRCodeOptions(size?: number, errorCorrection?: string) {
    if (size) {
      await this.qrSizeSlider.fill(size.toString());
    }
    if (errorCorrection) {
      await this.qrErrorCorrectionSelect.selectOption(errorCorrection);
    }
  }

  async expectBarcodeVisible() {
    await expect(this.generatedBarcode).toBeVisible();
    // Verify SVG content is present
    const svgElement = this.page.locator('[data-testid="generated-barcode"] svg');
    await expect(svgElement).toBeVisible();
  }
} 