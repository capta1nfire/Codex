export default {
  apps: [
    {
      name: 'codex-backend',
      cwd: './backend',
      script: './start-dev.sh',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G', // Aumentado de 1G
      env: {
        NODE_ENV: 'development',
        PORT: 3004,
        RUST_SERVICE_TIMEOUT_MS: 30000, // 30 segundos
        RATE_LIMIT_MAX: 10000,
        CACHE_MAX_AGE: 600,
        UV_THREADPOOL_SIZE: 16,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_file: '../logs/backend-combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'codex-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=2048'
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'codex-rust',
      cwd: './rust_generator',
      script: 'cargo',
      args: 'run',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Aumentado de 500M
      env: {
        RUST_LOG: 'info',
        TOKIO_WORKER_THREADS: '8'
      },
      error_file: '../logs/rust-error.log',
      out_file: '../logs/rust-out.log',
      log_file: '../logs/rust-combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};