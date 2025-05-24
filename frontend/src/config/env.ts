/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present and valid
 */

interface EnvironmentConfig {
  // API URLs
  backendUrl: string;
  rustServiceUrl: string;
  
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  
  // Feature flags
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

class EnvironmentError extends Error {
  constructor(variable: string, issue: string) {
    super(`Environment variable ${variable}: ${issue}`);
    this.name = 'EnvironmentError';
  }
}

function validateUrl(url: string | undefined, name: string): string {
  if (!url) {
    throw new EnvironmentError(name, 'is required but not defined');
  }
  
  try {
    new URL(url);
    return url;
  } catch {
    throw new EnvironmentError(name, `"${url}" is not a valid URL`);
  }
}

function validateNodeEnv(env: string | undefined): 'development' | 'production' | 'test' {
  if (!env) {
    return 'development'; // Default to development
  }
  
  if (!['development', 'production', 'test'].includes(env)) {
    throw new EnvironmentError('NODE_ENV', `"${env}" is not a valid environment. Must be development, production, or test`);
  }
  
  return env as 'development' | 'production' | 'test';
}

function loadEnvironmentConfig(): EnvironmentConfig {
  try {
    const nodeEnv = validateNodeEnv(process.env.NODE_ENV);
    
    return {
      // API URLs - These are public so they need NEXT_PUBLIC_ prefix
      backendUrl: validateUrl(
        process.env.NEXT_PUBLIC_BACKEND_URL, 
        'NEXT_PUBLIC_BACKEND_URL'
      ),
      rustServiceUrl: validateUrl(
        process.env.NEXT_PUBLIC_RUST_SERVICE_URL, 
        'NEXT_PUBLIC_RUST_SERVICE_URL'
      ),
      
      // Environment
      nodeEnv,
      
      // Feature flags
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',
    };
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error(`❌ Environment Configuration Error: ${error.message}`);
      console.error(`💡 Check your .env.local file or environment variables`);
      console.error(`📋 See env.example for required variables`);
    }
    throw error;
  }
}

// Load and validate environment config
export const env = loadEnvironmentConfig();

// Helper function to check if we're in client side
export const isClient = typeof window !== 'undefined';

// Helper function to check if we're in server side
export const isServer = !isClient;

// Export for debugging in development
if (env.isDevelopment && isClient) {
  console.log('🔧 Environment Config:', {
    nodeEnv: env.nodeEnv,
    backendUrl: env.backendUrl,
    rustServiceUrl: env.rustServiceUrl,
  });
} 