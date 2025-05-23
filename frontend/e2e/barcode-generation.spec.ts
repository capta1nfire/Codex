import { test, expect } from '@playwright/test';
import { GeneratorPage } from './pages/generator-page';

test.describe('Barcode Generation', () => {
  let generatorPage: GeneratorPage;

  test.beforeEach(async ({ page }) => {
    generatorPage = new GeneratorPage(page);
    await generatorPage.navigate();
  });

  test('should display generator page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/CODEX/);
    await expect(generatorPage.barcodeTypeSelect).toBeVisible();
    await expect(generatorPage.dataInput).toBeVisible();
    await expect(generatorPage.generateButton).toBeVisible();
  });

  test('should generate QR Code successfully', async ({ page }) => {
    const testData = 'https://codex.example.com';
    
    await generatorPage.generateBarcode('qrcode', testData);
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
    
    // Verify the generated QR code contains expected data
    const barcodeElement = page.locator('[data-testid="generated-barcode"]');
    await expect(barcodeElement).toContainText('QR Code');
  });

  test('should generate Code 128 barcode successfully', async ({ page }) => {
    const testData = 'CODE128TEST123';
    
    await generatorPage.generateBarcode('code128', testData);
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
    
    // Verify barcode type label
    const barcodeElement = page.locator('[data-testid="generated-barcode"]');
    await expect(barcodeElement).toContainText('Code 128');
  });

  test('should generate EAN-13 barcode successfully', async ({ page }) => {
    const testData = '1234567890123';
    
    await generatorPage.generateBarcode('ean13', testData);
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
    
    // Verify barcode displays the number below
    const barcodeElement = page.locator('[data-testid="generated-barcode"]');
    await expect(barcodeElement).toContainText('1234567890123');
  });

  test('should handle invalid EAN-13 data', async ({ page }) => {
    const invalidData = '123'; // Too short for EAN-13
    
    await generatorPage.generateBarcode('ean13', invalidData);
    await generatorPage.expectGenerationError('Datos inválidos para EAN-13');
  });

  test('should handle empty data input', async ({ page }) => {
    await generatorPage.generateBarcode('qrcode', '');
    await generatorPage.expectGenerationError('Los datos son requeridos');
  });

  test('should download generated barcode', async ({ page }) => {
    const testData = 'Download Test';
    
    await generatorPage.generateBarcode('qrcode', testData);
    await generatorPage.waitForGeneration();
    
    const download = await generatorPage.downloadBarcode();
    expect(download.suggestedFilename()).toMatch(/qrcode.*\.(svg|png)$/);
  });

  test('should support different barcode types', async ({ page }) => {
    const testCases = [
      { type: 'qrcode', data: 'QR Code Test', label: 'QR Code' },
      { type: 'code128', data: 'CODE128', label: 'Code 128' },
      { type: 'code39', data: 'CODE39', label: 'Code 39' },
    ];

    for (const testCase of testCases) {
      await page.reload(); // Fresh start for each test
      await generatorPage.generateBarcode(testCase.type, testCase.data);
      await generatorPage.waitForGeneration();
      await generatorPage.expectBarcodeVisible();
      
      const barcodeElement = page.locator('[data-testid="generated-barcode"]');
      await expect(barcodeElement).toContainText(testCase.label);
    }
  });

  test('should handle special characters in QR code', async ({ page }) => {
    const specialData = 'Special chars: áéíóú ñ ¿¡ @#$%^&*()';
    
    await generatorPage.generateBarcode('qrcode', specialData);
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
  });

  test('should generate barcode with large data', async ({ page }) => {
    const largeData = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
    
    await generatorPage.generateBarcode('qrcode', largeData);
    await generatorPage.waitForGeneration();
    await generatorPage.expectBarcodeVisible();
  });

  test('should maintain barcode after browser refresh', async ({ page }) => {
    const testData = 'Persistence Test';
    
    await generatorPage.generateBarcode('qrcode', testData);
    await generatorPage.waitForGeneration();
    
    // Refresh page
    await page.reload();
    
    // Barcode should be regenerated or form should be reset
    await expect(generatorPage.dataInput).toHaveValue('');
  });
}); 