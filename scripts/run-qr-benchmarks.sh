#!/bin/bash

# QR Engine v2 Benchmarking Script
# This script runs comprehensive benchmarks for the QR Engine v2

echo "🚀 QR Engine v2 Benchmarking Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if services are running
check_service() {
    local service=$1
    local port=$2
    
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service is running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not running on port $port"
        return 1
    fi
}

echo "🔍 Checking services..."
SERVICES_OK=true

if ! check_service "Backend" 3004; then
    SERVICES_OK=false
fi

if ! check_service "Rust Generator" 3002; then
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = false ]; then
    echo -e "\n${RED}Error: Required services are not running${NC}"
    echo "Please start services with: ./pm2-start.sh"
    exit 1
fi

echo -e "\n${GREEN}All services are running!${NC}\n"

# Run Rust benchmarks
echo "📊 Running Rust benchmarks..."
echo "----------------------------"
cd rust_generator

# Check if criterion is installed
if ! grep -q "criterion" Cargo.toml; then
    echo -e "${YELLOW}Installing benchmark dependencies...${NC}"
    cargo add --dev criterion
fi

# Run benchmarks
echo "Running performance benchmarks..."
cargo bench --quiet

# Check if benchmark completed successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Rust benchmarks completed${NC}"
    echo "Results saved in: rust_generator/target/criterion/"
    
    # Open HTML report if available
    if [ -f "target/criterion/report/index.html" ]; then
        echo -e "Opening benchmark report..."
        if command -v open &> /dev/null; then
            open target/criterion/report/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open target/criterion/report/index.html
        fi
    fi
else
    echo -e "${RED}✗ Rust benchmarks failed${NC}"
fi

cd ..

# Run Node.js integration benchmarks
echo -e "\n📊 Running Node.js integration benchmarks..."
echo "-------------------------------------------"

# Create benchmark script
cat > backend/benchmark-qr.js << 'EOF'
const axios = require('axios');
const { performance } = require('perf_hooks');

const API_URL = 'http://localhost:3004';

async function runBenchmark(name, fn, iterations = 100) {
    console.log(`\nRunning: ${name}`);
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
        
        if ((i + 1) % 10 === 0) {
            process.stdout.write('.');
        }
    }
    
    console.log('\n');
    
    // Calculate statistics
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const avg = times.reduce((a, b) => a + b) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Avg: ${avg.toFixed(2)}ms`);
    console.log(`  Median: ${median.toFixed(2)}ms`);
    console.log(`  P95: ${p95.toFixed(2)}ms`);
    console.log(`  P99: ${p99.toFixed(2)}ms`);
    
    return { name, min, max, avg, median, p95, p99 };
}

async function main() {
    console.log('QR Engine v2 Integration Benchmarks');
    console.log('===================================');
    
    const results = [];
    
    // Basic QR generation
    results.push(await runBenchmark('Basic QR Generation', async () => {
        await axios.post(`${API_URL}/api/qr/generate`, {
            data: 'https://example.com'
        });
    }));
    
    // QR with customization
    results.push(await runBenchmark('QR with Eye Shape', async () => {
        await axios.post(`${API_URL}/api/qr/generate`, {
            data: 'https://example.com',
            options: {
                eyeShape: 'rounded-square',
                dataPattern: 'dots'
            }
        });
    }));
    
    // QR with gradient
    results.push(await runBenchmark('QR with Gradient', async () => {
        await axios.post(`${API_URL}/api/qr/generate`, {
            data: 'https://example.com',
            options: {
                gradient: {
                    type: 'linear',
                    colors: ['#000000', '#0000FF'],
                    angle: 45
                }
            }
        });
    }, 50)); // Fewer iterations for complex operations
    
    // Batch generation
    results.push(await runBenchmark('Batch Generation (10 codes)', async () => {
        const codes = Array(10).fill(null).map((_, i) => ({
            data: `https://example.com/item/${i}`
        }));
        
        await axios.post(`${API_URL}/api/qr/batch`, {
            codes,
            options: { maxConcurrent: 5 }
        });
    }, 20));
    
    // Preview endpoint
    results.push(await runBenchmark('Preview Generation', async () => {
        await axios.get(`${API_URL}/api/qr/preview`, {
            params: {
                data: 'https://example.com',
                eyeShape: 'circle',
                size: 300
            }
        });
    }));
    
    // Print summary
    console.log('\n\nBenchmark Summary');
    console.log('=================');
    console.log('');
    
    const table = results.map(r => ({
        'Benchmark': r.name,
        'Avg (ms)': r.avg.toFixed(2),
        'P95 (ms)': r.p95.toFixed(2),
        'P99 (ms)': r.p99.toFixed(2)
    }));
    
    console.table(table);
    
    // Performance assertions
    console.log('\nPerformance Checks:');
    
    const basicQR = results.find(r => r.name === 'Basic QR Generation');
    if (basicQR && basicQR.avg < 50) {
        console.log(`✅ Basic QR generation meets target (<50ms): ${basicQR.avg.toFixed(2)}ms`);
    } else {
        console.log(`❌ Basic QR generation exceeds target (>50ms): ${basicQR?.avg.toFixed(2)}ms`);
    }
    
    const batchQR = results.find(r => r.name.includes('Batch'));
    if (batchQR && batchQR.avg < 200) {
        console.log(`✅ Batch generation meets target (<200ms): ${batchQR.avg.toFixed(2)}ms`);
    } else {
        console.log(`❌ Batch generation exceeds target (>200ms): ${batchQR?.avg.toFixed(2)}ms`);
    }
}

main().catch(console.error);
EOF

cd backend
echo "Installing benchmark dependencies..."
npm install --save-dev axios

echo "Running integration benchmarks..."
node benchmark-qr.js

# Clean up
rm benchmark-qr.js
cd ..

echo -e "\n${GREEN}🎉 Benchmarking complete!${NC}"
echo ""
echo "📊 Results locations:"
echo "  - Rust benchmarks: rust_generator/target/criterion/"
echo "  - Integration results: See console output above"
echo ""
echo "💡 Tips:"
echo "  - Run benchmarks multiple times for consistency"
echo "  - Close other applications for accurate results"
echo "  - Compare results after optimizations"