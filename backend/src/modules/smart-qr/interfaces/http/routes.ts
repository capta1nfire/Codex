/**
 * Smart QR HTTP Routes
 * Exposes Smart QR functionality through REST API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { authMiddleware } from '../../../../middleware/authMiddleware.js';
import { GenerateSmartQRUseCase } from '../../application/usecases/GenerateSmartQR.js';
import { LimitService } from '../../domain/services/LimitService.js';
import { TemplateService } from '../../domain/services/TemplateService.js';
import { eventBus } from '../../infrastructure/events/EventBus.js';
import { InMemoryTemplateRepository } from '../../infrastructure/repositories/InMemoryTemplateRepository.js';

// Request validation schemas
const generateSmartQRSchema = z.object({
  url: z.string().min(1),
  options: z
    .object({
      preferredTemplateId: z.string().optional(),
      skipAnalysisDelay: z.boolean().optional(),
    })
    .optional(),
});

const getStatsSchema = z.object({
  days: z.number().min(1).max(90).optional().default(7),
});

// Initialize dependencies lazily to avoid Redis connection issues during import
let templateRepository: InMemoryTemplateRepository;
let limitService: LimitService;
let templateService: TemplateService;
let generateSmartQRUseCase: GenerateSmartQRUseCase;

const initializeServices = () => {
  if (!templateRepository) {
    templateRepository = new InMemoryTemplateRepository();
    limitService = new LimitService({
      dailyLimit: 3,
      premiumDailyLimit: 10,
      resetHour: 0,
    });
    templateService = new TemplateService(templateRepository, limitService, {
      enableAnalytics: true,
      enableCaching: true,
      fakeAnalysisDelay: 1500,
    });
    generateSmartQRUseCase = new GenerateSmartQRUseCase(templateService);
  }
};

// Create router
const router = Router();

/**
 * POST /api/smart-qr/generate
 * Generate a Smart QR code with automatic template selection
 */
router.post(
  '/generate',
  authMiddleware.authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      // Validate request
      const validation = generateSmartQRSchema.safeParse(req.body);
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

      const { url, options } = validation.data;
      const user = (req as any).user;

      // Execute use case
      const result = await generateSmartQRUseCase.execute({
        url,
        userId: user.id,
        userRole: user.role,
        preferredTemplateId: options?.preferredTemplateId,
        options: {
          skipAnalysisDelay: options?.skipAnalysisDelay,
          returnFullTemplate: user.role === 'WEBADMIN' || user.role === 'SUPERADMIN',
        },
      });

      // Return appropriate status code
      if (!result.success) {
        const statusCode =
          result.error?.code === 'AUTHENTICATION_REQUIRED'
            ? 401
            : result.error?.code === 'LIMIT_REACHED'
              ? 429
              : result.error?.code === 'VALIDATION_ERROR'
                ? 400
                : 500;

        return res.status(statusCode).json(result);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/templates
 * Get available templates for a URL
 */
router.get(
  '/templates',
  authMiddleware.authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const url = req.query.url as string;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL parameter is required',
          },
        });
      }

      const templates = await generateSmartQRUseCase.getAvailableTemplates(url);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/stats
 * Get user usage statistics
 */
router.get(
  '/stats',
  authMiddleware.authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const validation = getStatsSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          },
        });
      }

      const { days } = validation.data;
      const user = (req as any).user;

      const stats = await generateSmartQRUseCase.getUserStats(user.id, days);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/limit
 * Check current usage limit
 */
router.get(
  '/limit',
  authMiddleware.authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const user = (req as any).user;
      const isPremium =
        user.role === 'PREMIUM' || user.role === 'WEBADMIN' || user.role === 'SUPERADMIN';
      const isUnlimited = user.role === 'SUPERADMIN';

      const limitCheck = await limitService.checkLimit(user.id, isPremium, isUnlimited);

      res.json({
        success: true,
        data: {
          allowed: limitCheck.allowed,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
          resetAt: limitCheck.resetAt.toISOString(),
          isPremium,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/preview/:templateId
 * Preview a specific template (no generation)
 */
router.get(
  '/preview/:templateId',
  authMiddleware.authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const { templateId } = req.params;
      const url = req.query.url as string;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL parameter is required',
          },
        });
      }

      const preview = await templateService.previewTemplate(templateId, url);

      if (!preview) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found',
          },
        });
      }

      res.json({
        success: true,
        data: {
          template: {
            id: preview.template.id,
            name: preview.template.name,
            tags: preview.template.metadata.tags,
          },
          configuration: preview.config,
          previewDescription: preview.preview,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/popular
 * Get popular templates
 */
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Initialize services on first request
    initializeServices();

    const limit = parseInt(req.query.limit as string) || 10;
    const templates = await templateService.getPopularTemplates(limit);

    res.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          usage: t.metadata.analytics.usage,
          tags: t.metadata.tags,
          domains: t.metadata.domains,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Admin Routes (require admin role)
 */
const adminRouter = Router();

// Middleware to check admin role
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user?.role !== 'WEBADMIN' && user?.role !== 'SUPERADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
  next();
};

/**
 * GET /api/smart-qr/admin/statistics
 * Get system-wide statistics
 */
adminRouter.get(
  '/statistics',
  authMiddleware.authenticateJwt,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const stats = await templateService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/smart-qr/admin/uncovered-domains
 * Find domains without templates
 */
adminRouter.post(
  '/uncovered-domains',
  authMiddleware.authenticateJwt,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const { urls } = req.body;

      if (!Array.isArray(urls)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URLs must be an array',
          },
        });
      }

      const uncovered = await templateService.findUncoveredDomains(urls);

      res.json({
        success: true,
        data: {
          total: urls.length,
          covered: urls.length - uncovered.length,
          uncovered: uncovered,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/smart-qr/admin/reset-usage
 * Reset user usage (for testing/support)
 */
adminRouter.post(
  '/reset-usage',
  authMiddleware.authenticateJwt,
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Initialize services on first request
      initializeServices();

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required',
          },
        });
      }

      await templateService.resetUserUsage(userId);

      res.json({
        success: true,
        message: 'Usage reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mount admin routes
router.use('/admin', adminRouter);

// Error handler specific to Smart QR routes
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SmartQR Error]', error);

  // Log to event bus for monitoring
  eventBus.emit('smartqr.failed', {
    error,
    userId: (req as any).user?.id,
    url: req.body?.url || req.query?.url || 'unknown',
    reason: error.message,
    timestamp: new Date(),
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
