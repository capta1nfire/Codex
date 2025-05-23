/**
 * @jest-environment jsdom
 */
import { api, authApi, generatorApi, ApiError } from '../api';

// Mock de fetch global
global.fetch = jest.fn();

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de process.env
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3004';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('Authentication', () => {
    it('should include Authorization header when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, user: { id: '1' } }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        })
      );
    });

    it('should not include Authorization header when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should not include Authorization header when includeAuth is false', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.get('/test', false);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request correctly', async () => {
      const mockData = { success: true, data: 'test' };
      const mockResponse = {
        ok: true,
        json: async () => mockData,
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await api.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request with data', async () => {
      const postData = { name: 'test' };
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.post('/test', postData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should handle upload requests', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.upload('/upload', formData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors correctly', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Validation failed',
          suggestion: 'Check your input',
        }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(errorResponse);

      await expect(api.get('/test')).rejects.toMatchObject({
        success: false,
        error: 'Validation failed',
        suggestion: 'Check your input',
        status: 400,
      });
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(api.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle non-JSON error responses', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
        headers: { get: () => 'text/plain' },
      };
      (fetch as jest.Mock).mockResolvedValue(errorResponse);

      await expect(api.get('/test')).rejects.toMatchObject({
        success: false,
        error: 'Server Error',
        status: 500,
      });
    });
  });

  describe('Auth API', () => {
    it('should call login endpoint correctly', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, token: 'jwt-token' }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await authApi.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
    });

    it('should call register endpoint correctly', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await authApi.register(userData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
    });
  });

  describe('Generator API', () => {
    it('should call generate endpoint correctly', async () => {
      const payload = {
        barcode_type: 'qrcode',
        data: 'https://example.com',
        options: { scale: 4 },
      };
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, svgString: '<svg>...</svg>' }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await generatorApi.generateCode(payload);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    });
  });

  describe('API Key requests', () => {
    it('should include API key in headers', async () => {
      const apiKey = 'test-api-key';
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await api.withApiKey('GET', '/test', apiKey);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3004/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': apiKey,
          }),
        })
      );
    });
  });
}); 