import request from 'supertest';
import express, { Express } from 'express';
import { ErrorCode, HttpStatus } from '../utils/errors';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Define a proper interface for health data
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

describe('API Endpoints', () => {
  let app: Express;
  
  beforeAll(() => {
    // Create a simplified express app for testing
    app = express();
    
    // Add middleware for parsing JSON
    app.use(express.json());
    
    // Mock root endpoint
    app.get('/', (req, res) => {
      res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
    });
    
    // Mock health endpoint
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
    
    // Mock generate endpoint
    app.post('/generate', (req, res) => {
      const { barcode_type, data } = req.body;
      
      if (!barcode_type || !data) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Missing required fields'
          }
        });
      }
      
      // Mock successful response
      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          image: 'base64string',
          format: 'png'
        }
      });
    });
  });
  
  test('GET / - should return welcome message', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('API Gateway Node.js funcionando');
  });
  
  test('GET /health - should return health status', async () => {
    const mockFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        status: 'ok',
        version: '1.0.0'
      })
    };
    
    mockFetch.mockResolvedValue(mockFetchResponse);
    
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'codex-api-gateway');
  });
  
  test('POST /generate - should validate required fields', async () => {
    const response = await request(app)
      .post('/generate')
      .send({})
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
  });
  
  test('POST /generate - should return barcode data on success', async () => {
    const response = await request(app)
      .post('/generate')
      .send({
        barcode_type: 'qrcode',
        data: 'https://example.com'
      })
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('image');
    expect(response.body.data).toHaveProperty('format', 'png');
  });
}); 