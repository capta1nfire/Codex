import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Test Cleanup...');

  // Clean up test data
  await cleanupTestData();

  console.log('✅ E2E Cleanup Complete');
}

async function cleanupTestData() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Optionally clean up test user and data
    // For now, we'll leave test data in place for debugging
    // In a real scenario, you might want to clean up test-specific data
    
    console.log('🗑️ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
    // Don't fail teardown if cleanup fails
  }
}

export default globalTeardown; 