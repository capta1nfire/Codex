/**
 * Smart QR Service
 * Handles API communication for Smart QR feature
 */

import axios from 'axios';
import {
  SmartQRGenerateRequest,
  SmartQRGenerateResponse,
  SmartQRLimitStatus,
  SmartQRStats,
  SmartQRTemplate
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';

class SmartQRService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/smart-qr`;
  }

  /**
   * Generate a Smart QR code
   */
  async generate(request: SmartQRGenerateRequest): Promise<SmartQRGenerateResponse> {
    try {
      const response = await axios.post<SmartQRGenerateResponse>(
        `${this.baseUrl}/generate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getAuthToken()}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          details: error.message
        }
      };
    }
  }

  /**
   * Analyze a URL and get configuration
   * This is an alias for generate with analysis focus
   */
  async analyze(url: string): Promise<SmartQRGenerateResponse> {
    return this.generate({ url });
  }

  /**
   * Get available templates for a URL
   */
  async getTemplatesForUrl(url: string): Promise<{
    templates: SmartQRTemplate[];
    recommendedId?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/templates`,
        {
          params: { url },
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get templates:', error);
      return { templates: [] };
    }
  }

  /**
   * Check current usage limit
   */
  async checkLimit(): Promise<SmartQRLimitStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/limit`,
        {
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to check limit:', error);
      return {
        allowed: false,
        remaining: 0,
        limit: 3,
        resetAt: new Date().toISOString(),
        isPremium: false
      };
    }
  }

  /**
   * Get user statistics
   */
  async getStats(days: number = 7): Promise<SmartQRStats> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/stats`,
        {
          params: { days },
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        usage: { daily: [], total: 0, averagePerDay: 0 },
        favoriteTemplates: [],
        remainingToday: 0
      };
    }
  }

  /**
   * Preview a template without generating
   */
  async previewTemplate(templateId: string, url: string): Promise<{
    template: SmartQRTemplate;
    configuration: any;
    previewDescription: string;
  } | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/preview/${templateId}`,
        {
          params: { url },
          headers: {
            Authorization: `Bearer ${this.getAuthToken()}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to preview template:', error);
      return null;
    }
  }

  /**
   * Get popular templates (public endpoint)
   */
  async getPopularTemplates(limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    usage: number;
    tags: string[];
    domains: string[];
  }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/popular`,
        { params: { limit } }
      );
      return response.data.data.templates;
    } catch (error) {
      console.error('Failed to get popular templates:', error);
      return [];
    }
  }

  /**
   * Helper to get auth token
   */
  private getAuthToken(): string {
    // Get token from localStorage or auth context
    // This should be integrated with your auth system
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || '';
    }
    return '';
  }
}

// Export singleton instance
export const smartQRService = new SmartQRService();