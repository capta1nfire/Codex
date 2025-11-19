import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting E2E Test Setup...');

  // Wait for backend to be ready
  await waitForBackend();

  // Seed test database if needed
  await seedTestData();

  console.log('✅ E2E Setup Complete');
}

async function waitForBackend(retries = 30, delay = 1000) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${backendUrl}/api/health`);
      if (response.ok) {
        console.log('✅ Backend is ready');
        return;
      }
    } catch (error) {
      console.log(`⏳ Waiting for backend... (${i + 1}/${retries})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('Backend failed to start within timeout');
}

async function seedTestData() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Create test user
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@codex.test',
      password: 'TestPassword123!'
    };

    console.log('🌱 Seeding test data...');
    
    // Check if test user already exists, if not create it
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (response.ok || response.status === 409) { // 409 = user already exists
      console.log('✅ Test user ready');
    } else {
      console.warn('⚠️ Could not create test user:', response.statusText);
    }
  } catch (error) {
    console.warn('⚠️ Test data seeding failed:', error);
    // Don't fail setup if seeding fails - tests might still work
  }
}

export default globalSetup; 