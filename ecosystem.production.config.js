module.exports = {
  apps: [
    {
      name: 'codex-backend',
      cwd: './backend',
      script: './start-dev.sh',
      instances: 'max', // Usar todos los cores disponibles
      exec_mode: 'cluster', // Modo cluster para múltiples instancias
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_file: '../logs/backend-combined.log',
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      // Configuración de balanceo de carga
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      // Configuración de rendimiento
      kill_timeout: 10000,
      listen_timeout: 10000,
      shutdown_with_message: true
    },
    {
      name: 'codex-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start', // Usar start en producción
      instances: 2, // 2 instancias para frontend
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
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
      args: 'run --release', // Usar release build
      instances: 2, // 2 instancias de Rust
      exec_mode: 'fork', // Fork para procesos no-Node.js
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Aumentar límite de memoria
      env: {
        RUST_LOG: 'info',
        TOKIO_WORKER_THREADS: '8', // Configurar workers de Tokio
        RUST_BACKTRACE: '1'
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