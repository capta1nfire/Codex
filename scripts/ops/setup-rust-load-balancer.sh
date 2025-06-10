#!/bin/bash

# Script para configurar un load balancer local para múltiples instancias de Rust

echo "🚀 Configurando Load Balancer para Rust Generator..."

# Instalar nginx si no está instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando nginx..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install nginx
    else
        sudo apt-get update
        sudo apt-get install -y nginx
    fi
fi

# Crear configuración de nginx para load balancing
cat > /tmp/codex-rust-lb.conf << 'EOF'
upstream rust_generators {
    least_conn;  # Usar algoritmo de menor conexión
    
    # Instancias de Rust
    server localhost:3002 max_fails=3 fail_timeout=30s;
    server localhost:3003 max_fails=3 fail_timeout=30s;
    server localhost:3004 max_fails=3 fail_timeout=30s;
    server localhost:3005 max_fails=3 fail_timeout=30s;
    
    # Keep-alive para reutilizar conexiones
    keepalive 100;
    keepalive_requests 1000;
    keepalive_timeout 65s;
}

server {
    listen 3002;
    server_name localhost;
    
    # Configuración de timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    send_timeout 30s;
    
    # Buffer sizes
    client_body_buffer_size 1M;
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://rust_generators;
        proxy_http_version 1.1;
        
        # Headers para keep-alive
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # Endpoint de salud
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Métricas de nginx
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

echo "✅ Configuración de nginx creada"

# Crear script de inicio para múltiples instancias
cat > /tmp/start-rust-cluster.sh << 'EOF'
#!/bin/bash

# Detener instancias existentes
pkill -f "rust_generator"

# Esperar un momento
sleep 2

# Iniciar múltiples instancias en diferentes puertos
echo "🚀 Iniciando cluster de Rust Generator..."

# Configurar variables de entorno base
export RUST_LOG=info
export RUST_BACKTRACE=1

# Instancia 1 - Puerto 3102
PORT=3102 INSTANCE_ID=1 cargo run --release &
echo "✅ Instancia 1 iniciada en puerto 3102"

# Instancia 2 - Puerto 3103
PORT=3103 INSTANCE_ID=2 cargo run --release &
echo "✅ Instancia 2 iniciada en puerto 3103"

# Instancia 3 - Puerto 3104
PORT=3104 INSTANCE_ID=3 cargo run --release &
echo "✅ Instancia 3 iniciada en puerto 3104"

# Instancia 4 - Puerto 3105
PORT=3105 INSTANCE_ID=4 cargo run --release &
echo "✅ Instancia 4 iniciada en puerto 3105"

echo "🎯 Cluster de Rust iniciado con 4 instancias"
EOF

chmod +x /tmp/start-rust-cluster.sh

echo "📋 Instrucciones de uso:"
echo "1. Copiar configuración nginx: sudo cp /tmp/codex-rust-lb.conf /usr/local/etc/nginx/servers/"
echo "2. Recargar nginx: nginx -s reload"
echo "3. Iniciar cluster: /tmp/start-rust-cluster.sh"
echo "4. El backend debe apuntar a http://localhost:3002 (nginx load balancer)"