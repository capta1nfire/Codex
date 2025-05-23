/**
 * API Client centralizado para el frontend
 * Elimina duplicación de código y estandariza llamadas al backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  suggestion?: string;
  code?: string;
}

export interface ApiError {
  success: false;
  error: string;
  suggestion?: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
  }

  /**
   * Obtiene el token JWT del localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Crea headers estándar para las requests
   */
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Maneja errores de response de manera estándar
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: any = {};
      
      try {
        if (isJson) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const error: ApiError = {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
        suggestion: errorData.suggestion,
        code: errorData.code,
        status: response.status,
      };

      throw error;
    }

    if (isJson) {
      return response.json();
    } else {
      return response.text() as T;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, includeAuth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, includeAuth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload de archivos (multipart/form-data)
   */
  async upload<T = any>(endpoint: string, formData: FormData, includeAuth = true): Promise<T> {
    const headers: HeadersInit = {};
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Request con API Key en header
   */
  async withApiKey<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    apiKey: string,
    data?: any
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia singleton del cliente API
export const api = new ApiClient();

// Hooks y utilidades específicas para endpoints comunes
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/api/auth/login', credentials, false),
  
  register: (userData: { email: string; password: string; firstName: string; lastName?: string }) =>
    api.post('/api/auth/register', userData, false),
  
  me: () => api.get('/api/auth/me'),
  
  refresh: () => api.post('/api/auth/refresh'),
  
  generateApiKey: () => api.post('/api/auth/api-key'),
};

export const userApi = {
  getProfile: () => api.get('/api/users/profile'),
  
  updateProfile: (data: any) => api.put('/api/users/profile', data),
  
  uploadAvatar: (formData: FormData) => api.upload('/api/avatars/upload', formData),
  
  setDefaultAvatar: (type: string) => api.post(`/api/avatars/default/${type}`),
  
  resetAvatar: () => api.post('/api/avatars/reset'),
};

export const generatorApi = {
  generateCode: (payload: {
    barcode_type: string;
    data: string;
    options?: Record<string, any>;
  }) => api.post('/api/generate', payload, false),
};

export const systemApi = {
  getStatus: () => api.get('/health/status', false),
  
  getMetrics: () => api.get('/metrics', false),
  
  getRustAnalytics: () => {
    // Para Rust service usamos fetch directo ya que está en puerto diferente
    const rustUrl = 'http://localhost:3002/analytics/performance';
    return fetch(rustUrl).then(res => res.json());
  },
  
  getRustStatus: () => {
    const rustUrl = 'http://localhost:3002/status';
    return fetch(rustUrl).then(res => res.json());
  },
}; 