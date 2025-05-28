import express from 'express';

import prisma from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

const router = express.Router();

interface DependencyStatus {
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  responseTime: number | null;
  error: string | null;
}

// ✅ NUEVO: Health check principal - NUNCA falla completamente
router.get('/', async (_req, res) => {
  const startTime = Date.now();
  const checks = {
    timestamp: new Date().toISOString(),
    service: 'codex-backend',
    status: 'operational' as 'operational' | 'degraded' | 'down',
    uptime: Math.floor(process.uptime()),
    memoryUsage: {
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100 + ' MB',
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100 + ' MB',
      external: Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100 + ' MB',
    },
    dependencies: {
      database: { status: 'unknown', responseTime: null, error: null } as DependencyStatus,
      redis: { status: 'unknown', responseTime: null, error: null } as DependencyStatus,
      rust_service: { status: 'unknown', responseTime: null, error: null } as DependencyStatus,
    },
  };

  // ✅ Check Database - NO crash if fails
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.dependencies.database = {
      status: 'operational',
      responseTime: Date.now() - dbStart,
      error: null,
    };
  } catch (error: any) {
    checks.dependencies.database = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message || 'Database connection failed',
    };
    checks.status = 'degraded';
  }

  // ✅ Check Redis - NO crash if fails
  try {
    const redisStart = Date.now();
    await redis.ping();
    checks.dependencies.redis = {
      status: 'operational',
      responseTime: Date.now() - redisStart,
      error: null,
    };
  } catch (error: any) {
    checks.dependencies.redis = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message || 'Redis connection failed',
    };
    // Redis is not critical, don't change overall status
  }

  // ✅ Check Rust Service - NO crash if fails
  try {
    const rustStart = Date.now();
    // Using AbortController for timeout instead of fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://localhost:3002/health', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      checks.dependencies.rust_service = {
        status: 'operational',
        responseTime: Date.now() - rustStart,
        error: null,
      };
    } else {
      checks.dependencies.rust_service = {
        status: 'degraded',
        responseTime: Date.now() - rustStart,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    checks.dependencies.rust_service = {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message || 'Rust service unreachable',
    };
    checks.status = 'degraded';
  }

  // ✅ CRÍTICO: ALWAYS respond, even if some checks failed
  const responseTime = Date.now() - startTime;

  // Determine overall status
  const downServices = Object.values(checks.dependencies).filter(
    (dep) => dep.status === 'down'
  ).length;
  if (downServices >= 2) {
    checks.status = 'down';
  } else if (downServices >= 1) {
    checks.status = 'degraded';
  }

  // ✅ ALWAYS return 200 with status info - frontend decides how to handle
  res.status(200).json({
    ...checks,
    responseTime: responseTime + 'ms',
    alert: checks.status !== 'operational' ? 'Some services are experiencing issues' : null,
  });
});

// ✅ NUEVO: Database-specific health check
router.get('/db', async (_req, res) => {
  const startTime = Date.now();

  try {
    // Multiple DB health checks
    const checks = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      prisma.$queryRaw`SELECT COUNT(*) FROM "User"`,
      prisma.$queryRaw`SELECT version()`,
    ]);

    const dbInfo = {
      status: 'operational',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      checks: {
        connection: checks[0].status === 'fulfilled' ? 'ok' : 'failed',
        tables: checks[1].status === 'fulfilled' ? 'ok' : 'failed',
        version: checks[2].status === 'fulfilled' ? 'ok' : 'failed',
      },
      details: {
        connected: checks[0].status === 'fulfilled',
        tablesAccessible: checks[1].status === 'fulfilled',
        version: checks[2].status === 'fulfilled' ? 'PostgreSQL' : 'unknown',
      },
    };

    const failedChecks = Object.values(dbInfo.checks).filter((check) => check === 'failed').length;
    if (failedChecks >= 2) {
      dbInfo.status = 'down';
    } else if (failedChecks >= 1) {
      dbInfo.status = 'degraded';
    }

    res.status(200).json(dbInfo);
  } catch (error: any) {
    // ✅ CRITICAL: Even DB failures return useful info
    res.status(200).json({
      status: 'down',
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error.message || 'Database connection failed',
      errorCode: error.code || 'UNKNOWN',
      checks: {
        connection: 'failed',
        tables: 'failed',
        version: 'failed',
      },
      details: {
        connected: false,
        tablesAccessible: false,
        version: 'unknown',
      },
    });
  }
});

// ✅ NUEVO: Quick health check for load balancers
router.get('/quick', (_req, res) => {
  // ✅ ALWAYS responds quickly - for external monitoring
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    pid: process.pid,
  });
});

// ✅ NUEVO: Detailed system info
router.get('/system', async (_req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.status(200).json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      system: {
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
          rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        },
        cpu: {
          user: Math.round((cpuUsage.user / 1000) * 100) / 100,
          system: Math.round((cpuUsage.system / 1000) * 100) / 100,
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
    });
  } catch (error) {
    // ✅ Even system info failures are handled gracefully
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Failed to collect system information',
      basicInfo: {
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
      },
    });
  }
});

export default router;
