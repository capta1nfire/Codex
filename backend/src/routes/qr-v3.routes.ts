/**
 * QR v3 Routes - Structured data for ULTRATHINK implementation
 * 
 * This module provides access to the v3 QR generation API that returns
 * structured data instead of SVG strings, enabling secure frontend rendering
 * without dangerouslySetInnerHTML.
 */

import express from 'express';
import axios from 'axios';
import { z } from 'zod';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';
// import { incrementUsage } from '../services/usageService.js'; // TODO: Implement usage service
import logger from '../utils/logger.js';

const router = express.Router();

// Schema de validación para v3
const qrV3RequestSchema = z.object({
  data: z.string().min(1).max(2953), // QR v40 max
  options: z.object({
    error_correction: z.enum(['L', 'M', 'Q', 'H']).optional(),
    customization: z.any().optional(), // Para features avanzadas futuras
  }).optional(),
});

// Tipo para la respuesta v3
interface QrV3Response {
  success: boolean;
  data?: {
    path_data: string;
    total_modules: number;
    data_modules: number;
    version: number;
    error_correction: string;
    metadata: {
      generation_time_ms: number;
      quiet_zone: number;
      content_hash: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
  };
}

/**
 * POST /api/v3/qr/generate
 * Generate QR code with structured data output
 */
router.post('/generate', 
  authenticateJwt,
  generationRateLimit,
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validar entrada
      const validation = qrV3RequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const { data, options } = validation.data;
      
      // Log de la solicitud
      logger.info('QR v3 generation request', {
        userId: req.user?.id,
        dataLength: data.length,
        options,
      });

      // URL del generador Rust
      const rustGeneratorUrl = process.env.RUST_GENERATOR_URL || 'http://localhost:3002';
      
      // Llamar al generador Rust v3
      const response = await axios.post(
        `${rustGeneratorUrl}/api/v3/qr/generate`,
        {
          data,
          options: options || {},
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const rustResponse = response.data as QrV3Response;

      // Si la generación fue exitosa, incrementar uso
      if (rustResponse.success && req.user) {
        try {
          // await incrementUsage(req.user.id, 'qrcode'); // TODO: Implement usage tracking
        } catch (usageError) {
          logger.error('Failed to increment usage', {
            userId: req.user.id,
            error: usageError,
          });
          // No fallar la solicitud por esto
        }
      }

      // Agregar tiempo total de procesamiento
      const totalTime = Date.now() - startTime;
      
      // Responder con los datos estructurados
      res.json({
        ...rustResponse,
        metadata: {
          ...rustResponse.metadata,
          total_processing_time_ms: totalTime,
          backend_version: '1.0.0',
        },
      });

    } catch (error: any) {
      logger.error('QR v3 generation error', {
        error: error.message,
        stack: error.stack,
      });

      // Manejar errores de red
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'QR generation service is temporarily unavailable',
          },
        });
      }

      // Error genérico
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
);

/**
 * GET /api/v3/qr/capabilities
 * Get v3 engine capabilities and features
 */
router.get('/capabilities', async (req, res) => {
  res.json({
    version: '3.0.0',
    features: {
      structured_data: true,
      ultrathink: true,
      quiet_zone_configurable: false, // Hardcoded to 4
      max_data_length: 2953,
      error_correction_levels: ['L', 'M', 'Q', 'H'],
      output_formats: ['structured_json'],
    },
    benefits: {
      security: 'No dangerouslySetInnerHTML required',
      performance: '50% less data transfer',
      flexibility: 'Frontend controls rendering',
    },
  });
});

export default router;