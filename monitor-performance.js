const http = require('http');

// Monitorear métricas cada 5 segundos
setInterval(() => {
  // Verificar backend
  http.get('http://localhost:3004/health/status', (res) => {
    if (res.statusCode !== 200) {
      console.error('❌ Backend unhealthy:', res.statusCode);
    }
  }).on('error', (err) => {
    console.error('❌ Backend error:', err.message);
  });

  // Verificar Rust
  http.get('http://localhost:3002/status', (res) => {
    if (res.statusCode !== 200) {
      console.error('❌ Rust unhealthy:', res.statusCode);
    }
  }).on('error', (err) => {
    console.error('❌ Rust error:', err.message);
  });

  // Obtener métricas
  http.get('http://localhost:3004/metrics', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const lines = data.split('\n');
      const eventLoop = lines.find(l => l.includes('nodejs_eventloop_lag_seconds'));
      if (eventLoop) {
        const lag = parseFloat(eventLoop.split(' ')[1]);
        if (lag > 0.1) {
          console.warn('⚠️  Event loop lag high:', lag);
        }
      }
    });
  });
}, 5000);

console.log('📊 Monitoreo de rendimiento iniciado...');
