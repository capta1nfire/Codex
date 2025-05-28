import { exec, spawn } from 'child_process';
import path from 'path';
import { promisify } from 'util';

import logger from '../utils/logger.js';

const execAsync = promisify(exec);

interface ServiceResult {
  success: boolean;
  message: string;
  output?: string;
  pid?: number;
  details?: any;
}

// ✅ Store process references for better control
const runningProcesses = new Map<string, any>();

// ✅ Helper function to check if port is available
async function isPortAvailable(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    return !stdout.trim(); // Port is available if no output
  } catch {
    return true; // Port is available if lsof fails
  }
}

// ✅ Helper function to wait for service to be ready
async function waitForService(url: string, maxAttempts: number = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
  }
  return false;
}

// ✅ Database Service Control (Docker) - Enhanced
export async function startDatabaseService(): Promise<ServiceResult> {
  try {
    logger.info('🔧 Starting database service (Docker)...');

    // Check if container exists
    const { stdout: containerList } = await execAsync(
      'docker ps -a --format "{{.Names}}" | grep codex_postgres || true'
    );

    if (!containerList.trim()) {
      // Container doesn't exist, try to create it via docker-compose
      logger.info('📦 Container not found, attempting to create via docker-compose...');
      try {
        await execAsync('docker-compose up -d codex_postgres', { timeout: 30000 });
      } catch (composeError) {
        return {
          success: false,
          message:
            'Database container not found and failed to create. Please run docker-compose up manually.',
        };
      }
    }

    // Check if container is already running
    const { stdout: runningCheck } = await execAsync(
      'docker ps --format "{{.Names}}" | grep codex_postgres || true'
    );

    if (runningCheck.trim()) {
      logger.info('✅ Database container is already running');
      return {
        success: true,
        message: 'Database service is already running',
        details: { alreadyRunning: true },
      };
    }

    // Start the container
    const { stdout, stderr } = await execAsync('docker start codex_postgres', { timeout: 15000 });

    if (stderr && !stderr.includes('already running')) {
      throw new Error(stderr);
    }

    // ✅ Enhanced: Wait for database to be actually ready with health check
    logger.info('⏳ Waiting for database to be ready...');
    let dbReady = false;
    for (let i = 0; i < 15; i++) {
      // Wait up to 15 seconds
      try {
        await execAsync('docker exec codex_postgres pg_isready -U codex_user -d codex_db', {
          timeout: 3000,
        });
        dbReady = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!dbReady) {
      logger.warn('⚠️ Database started but health check failed');
      return {
        success: true,
        message: 'Database service started but may still be initializing',
        details: { healthCheckFailed: true },
      };
    }

    logger.info('✅ Database service is ready and operational');
    return {
      success: true,
      message: 'Database service started successfully and is ready',
      output: stdout,
      details: { healthCheckPassed: true },
    };
  } catch (error: any) {
    logger.error('❌ Failed to start database service:', error);
    return {
      success: false,
      message: `Failed to start database: ${error.message}`,
    };
  }
}

export async function stopDatabaseService(): Promise<ServiceResult> {
  try {
    logger.info('🛑 Stopping database service (Docker)...');

    // Check if container is running first
    const { stdout: runningCheck } = await execAsync(
      'docker ps --format "{{.Names}}" | grep codex_postgres || true'
    );

    if (!runningCheck.trim()) {
      logger.info('✅ Database container is already stopped');
      return {
        success: true,
        message: 'Database service is already stopped',
        details: { alreadyStopped: true },
      };
    }

    // Stop the container with timeout
    const { stdout, stderr } = await execAsync('docker stop codex_postgres', { timeout: 15000 });

    if (stderr) {
      throw new Error(stderr);
    }

    // ✅ Enhanced: Verify it actually stopped
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const { stdout: verifyStop } = await execAsync(
      'docker ps --format "{{.Names}}" | grep codex_postgres || true'
    );

    if (verifyStop.trim()) {
      logger.warn('⚠️ Database container may still be running');
      return {
        success: true,
        message: 'Database stop command sent but container may still be shutting down',
        details: { verificationFailed: true },
      };
    }

    logger.info('✅ Database service stopped successfully');
    return {
      success: true,
      message: 'Database service stopped successfully',
      output: stdout,
      details: { verificationPassed: true },
    };
  } catch (error: any) {
    logger.error('❌ Failed to stop database service:', error);
    return {
      success: false,
      message: `Failed to stop database: ${error.message}`,
    };
  }
}

// ✅ Rust Service Control - Enhanced with Robust Process Management
export async function startRustService(): Promise<ServiceResult> {
  try {
    logger.info('🔧 Starting Rust service...');

    // Check if port 3002 is available
    const portAvailable = await isPortAvailable(3002);
    if (!portAvailable) {
      logger.info("🔍 Port 3002 is occupied, checking if it's our Rust service...");

      // Check if it's responding to health checks
      const isHealthy = await waitForService('http://localhost:3002/health', 1);
      if (isHealthy) {
        return {
          success: true,
          message: 'Rust service is already running and healthy',
          details: { alreadyRunning: true, port: 3002 },
        };
      } else {
        // Port occupied but not healthy, try to clean it up
        logger.warn('⚠️ Port 3002 occupied by unresponsive process, attempting cleanup...');
        await stopRustService();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Check for existing rust_generator processes
    const { stdout: processList } = await execAsync('pgrep -f "rust_generator" || true');
    if (processList.trim()) {
      logger.info('🔄 Found existing rust_generator processes, cleaning up...');
      await stopRustService();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Start Rust service with proper process control
    const rustDir = path.resolve(process.cwd(), 'rust_generator');
    logger.info(`📁 Starting Rust service from: ${rustDir}`);

    return new Promise((resolve) => {
      const childProcess = spawn('cargo', ['run'], {
        cwd: rustDir,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Store process reference
      runningProcesses.set('rust_generator', childProcess);

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
        // Look for startup indicators
        if (
          data.toString().includes('listening on') ||
          data.toString().includes('Server running')
        ) {
          logger.info('✅ Rust service startup confirmed from logs');
        }
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        logger.debug('Rust service stderr:', data.toString());
      });

      childProcess.on('error', (error) => {
        logger.error('❌ Failed to spawn Rust service:', error);
        runningProcesses.delete('rust_generator');
        resolve({
          success: false,
          message: `Failed to start Rust service: ${error.message}`,
        });
      });

      childProcess.on('exit', (code, signal) => {
        logger.warn(`⚠️ Rust service exited with code ${code}, signal ${signal}`);
        runningProcesses.delete('rust_generator');
      });

      // Wait for service to be ready
      setTimeout(async () => {
        try {
          const isReady = await waitForService('http://localhost:3002/health', 10);

          if (isReady) {
            logger.info('✅ Rust service is ready and responding to health checks');
            resolve({
              success: true,
              message: 'Rust service started successfully and is ready',
              pid: childProcess.pid,
              details: {
                port: 3002,
                healthCheckPassed: true,
                startupTime: new Date().toISOString(),
              },
            });
          } else {
            logger.warn('⚠️ Rust service started but failed health check');
            resolve({
              success: true,
              message: 'Rust service started but may still be initializing',
              pid: childProcess.pid,
              details: {
                port: 3002,
                healthCheckFailed: true,
                startupTime: new Date().toISOString(),
              },
            });
          }
        } catch (error: any) {
          logger.error('❌ Error during Rust service health check:', error);
          resolve({
            success: false,
            message: `Rust service started but health check failed: ${error.message}`,
          });
        }
      }, 3000); // Give it 3 seconds to start
    });
  } catch (error: any) {
    logger.error('❌ Failed to start Rust service:', error);
    return {
      success: false,
      message: `Failed to start Rust service: ${error.message}`,
    };
  }
}

export async function stopRustService(): Promise<ServiceResult> {
  try {
    logger.info('🛑 Stopping Rust service...');

    // First, try to stop the managed process if we have it
    const managedProcess = runningProcesses.get('rust_generator');
    if (managedProcess) {
      logger.info('🎯 Stopping managed Rust process...');
      managedProcess.kill('SIGTERM');
      runningProcesses.delete('rust_generator');

      // Wait for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Find and stop any remaining rust_generator processes
    const { stdout: processList } = await execAsync('pgrep -f "rust_generator" || true');

    if (!processList.trim()) {
      logger.info('✅ No Rust service processes found');
      return {
        success: true,
        message: 'Rust service is already stopped',
        details: { alreadyStopped: true },
      };
    }

    // Kill remaining processes gracefully first
    logger.info('🔄 Stopping remaining Rust processes gracefully...');
    await execAsync('pkill -TERM -f "rust_generator" || true');

    // Wait a moment for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if any processes are still running
    const { stdout: remainingProcesses } = await execAsync('pgrep -f "rust_generator" || true');

    if (remainingProcesses.trim()) {
      logger.warn("⚠️ Some Rust processes didn't stop gracefully, forcing...");
      await execAsync('pkill -KILL -f "rust_generator" || true');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Also kill any processes using port 3002
    try {
      const { stdout: portProcesses } = await execAsync('lsof -ti :3002 || true');
      if (portProcesses.trim()) {
        logger.info('🔌 Freeing port 3002...');
        await execAsync(`kill -TERM ${portProcesses.trim()} || true`);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force kill if still there
        const { stdout: stillThere } = await execAsync('lsof -ti :3002 || true');
        if (stillThere.trim()) {
          await execAsync(`kill -KILL ${stillThere.trim()} || true`);
        }
      }
    } catch (error) {
      logger.debug('No processes found on port 3002 or failed to kill them');
    }

    // Final verification
    const finalCheck = await isPortAvailable(3002);
    if (finalCheck) {
      logger.info('✅ Rust service stopped successfully and port 3002 is free');
      return {
        success: true,
        message: 'Rust service stopped successfully',
        details: { verificationPassed: true, portFreed: true },
      };
    } else {
      logger.warn('⚠️ Rust service stopped but port 3002 may still be occupied');
      return {
        success: true,
        message: 'Rust service stopped but port cleanup may be incomplete',
        details: { verificationFailed: true },
      };
    }
  } catch (error: any) {
    logger.error('❌ Failed to stop Rust service:', error);
    return {
      success: false,
      message: `Failed to stop Rust service: ${error.message}`,
    };
  }
}

// ✅ Backend Service Control - Enhanced with Real Restart Capability
export async function restartBackendService(): Promise<ServiceResult> {
  try {
    logger.info('🔄 Backend restart requested...');

    // Check if we're running in development mode with tsx/nodemon
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // In development, try to trigger a restart via process signal
      logger.info('🔧 Development mode detected, attempting graceful restart...');

      // Send restart signal to process
      setTimeout(() => {
        logger.info('💫 Initiating graceful restart...');
        process.exit(0); // This will cause tsx/nodemon to restart the process
      }, 1000); // Give time to send response first

      return {
        success: true,
        message: 'Backend restart initiated successfully',
        details: {
          mode: 'development',
          restartMethod: 'process_exit',
          willRestartIn: '1 second',
        },
      };
    } else {
      // In production, check for PM2 or similar process managers
      try {
        // Try to detect PM2
        const { stdout: pm2Check } = await execAsync('pm2 list | grep codex-backend || true');

        if (pm2Check.trim()) {
          logger.info('🎯 PM2 detected, attempting PM2 restart...');
          const { stdout: pm2Restart } = await execAsync('pm2 restart codex-backend');

          return {
            success: true,
            message: 'Backend restart via PM2 successful',
            details: {
              mode: 'production',
              restartMethod: 'pm2',
              output: pm2Restart,
            },
          };
        }

        // Try to detect if we're running as a systemd service
        const { stdout: systemdCheck } = await execAsync(
          'systemctl is-active codex-backend 2>/dev/null || true'
        );

        if (systemdCheck.trim() === 'active') {
          logger.info('🎯 Systemd service detected, attempting systemd restart...');
          const { stdout: systemdRestart } = await execAsync(
            'sudo systemctl restart codex-backend'
          );

          return {
            success: true,
            message: 'Backend restart via systemd successful',
            details: {
              mode: 'production',
              restartMethod: 'systemd',
              output: systemdRestart,
            },
          };
        }

        // No process manager detected, provide manual restart instructions
        logger.warn('⚠️ No process manager detected in production mode');
        return {
          success: true,
          message: 'Backend restart signal acknowledged. Manual restart may be required.',
          details: {
            mode: 'production',
            restartMethod: 'manual',
            instructions:
              'No PM2 or systemd detected. Please restart manually or configure a process manager.',
          },
        };
      } catch (error: any) {
        logger.error('❌ Error checking for process managers:', error);
        return {
          success: true,
          message: 'Backend restart signal acknowledged but process manager check failed',
          details: {
            mode: 'production',
            restartMethod: 'fallback',
            error: error.message,
          },
        };
      }
    }
  } catch (error: any) {
    logger.error('❌ Failed to restart backend service:', error);
    return {
      success: false,
      message: `Failed to restart backend: ${error.message}`,
    };
  }
}

// ✅ New function to get service status
export async function getServiceStatus(serviceName: string): Promise<ServiceResult> {
  try {
    logger.info(`🔍 Checking status of ${serviceName} service...`);

    switch (serviceName.toLowerCase()) {
      case 'database':
        const { stdout: dbCheck } = await execAsync(
          'docker ps --format "{{.Names}}:{{.Status}}" | grep codex_postgres || true'
        );
        if (dbCheck.trim()) {
          const status = dbCheck.split(':')[1] || 'unknown';
          return {
            success: true,
            message: `Database service is running: ${status}`,
            details: { status: 'running', dockerStatus: status },
          };
        } else {
          return {
            success: true,
            message: 'Database service is not running',
            details: { status: 'stopped' },
          };
        }

      case 'rust':
      case 'rust_generator':
        const portOccupied = !(await isPortAvailable(3002));
        const isHealthy = portOccupied
          ? await waitForService('http://localhost:3002/health', 1)
          : false;

        if (isHealthy) {
          return {
            success: true,
            message: 'Rust service is running and healthy',
            details: { status: 'running', port: 3002, healthy: true },
          };
        } else if (portOccupied) {
          return {
            success: true,
            message: 'Rust service port is occupied but not responding',
            details: { status: 'degraded', port: 3002, healthy: false },
          };
        } else {
          return {
            success: true,
            message: 'Rust service is not running',
            details: { status: 'stopped', port: 3002 },
          };
        }

      case 'backend':
        return {
          success: true,
          message: 'Backend service is running (current process)',
          details: {
            status: 'running',
            pid: process.pid,
            uptime: process.uptime(),
            port: process.env.PORT || 3004,
          },
        };

      default:
        return {
          success: false,
          message: `Unknown service: ${serviceName}`,
        };
    }
  } catch (error: any) {
    logger.error(`❌ Failed to check status of ${serviceName}:`, error);
    return {
      success: false,
      message: `Failed to check status: ${error.message}`,
    };
  }
}
