import request from 'supertest';
import express, { Express } from 'express';

// Create mock for fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Define interfaces for the test
interface RustServiceStatus {
  status: string;
  error?: string;
  [key: string]: any;
}

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  uptime: number;
  dependencies?: {
    rust_service: RustServiceStatus;
  };
}

describe('Health Endpoint', () => {
  let app: Express;
  
  beforeAll(() => {
    // Create fresh express app with just our endpoint
    app = express();
    
    // Simplified health endpoint for testing
    app.get('/health', async (req, res) => {
      const healthData: HealthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'codex-api-gateway',
        uptime: process.uptime()
      };
      
      try {
        const rustHealthCheck = await fetch('http://localhost:3002/health');
        const rustResponse = await rustHealthCheck.json();
        
        healthData.dependencies = {
          rust_service: {
            status: rustResponse.status || 'ok',
            ...rustResponse
          }
        };
        
        // Overall status is degraded if any dependency is not ok
        if (rustResponse.status && rustResponse.status !== 'ok') {
          healthData.status = 'degraded';
        }
      } catch (error) {
        healthData.dependencies = {
          rust_service: {
            status: 'unavailable',
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        };
        healthData.status = 'degraded';
      }
      
      const statusCode = healthData.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(healthData);
    });
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should return 200 OK when all services are healthy', async () => {
    const mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'ok',
        version: '1.0.0',
        uptime: 7200
      })
    };
    
    mockFetch.mockResolvedValue(mockFetchResponse);
    
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 'ok',
      service: 'codex-api-gateway',
      dependencies: {
        rust_service: {
          status: 'ok',
          version: '1.0.0',
          uptime: 7200
        }
      }
    }));
  });
  
  test('should return 503 Service Unavailable when Rust service is degraded', async () => {
    const mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'degraded',
        error: 'High CPU usage'
      })
    };
    
    mockFetch.mockResolvedValue(mockFetchResponse);
    
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(503);
    expect(response.body).toEqual(expect.objectContaining({
      status: 'degraded',
      dependencies: {
        rust_service: {
          status: 'degraded',
          error: 'High CPU usage'
        }
      }
    }));
  });
  
  test('should return 503 Service Unavailable when Rust service is unavailable', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));
    
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(503);
    expect(response.body).toEqual(expect.objectContaining({
      status: 'degraded',
      dependencies: {
        rust_service: {
          status: 'unavailable',
          error: 'Connection refused'
        }
      }
    }));
  });
}); 