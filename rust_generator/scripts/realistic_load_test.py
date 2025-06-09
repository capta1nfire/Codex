#!/usr/bin/env python3
"""
Realistic Load Test for QR Engine v2
Simulates real-world usage patterns with cache behavior
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime
import statistics

# Configuration
BASE_URL = "http://localhost:3004"
RUST_URL = "http://localhost:3002"

async def generate_qr(session, data, options=None):
    """Generate a single QR code"""
    payload = {
        "barcode_type": "qrcode",
        "data": data,
        "options": options or {"size": 300}
    }
    
    start_time = time.time()
    try:
        async with session.post(f"{BASE_URL}/api/generate", json=payload) as response:
            result = await response.json()
            elapsed = (time.time() - start_time) * 1000
            
            return {
                "success": response.status == 200 and result.get("success", False),
                "time_ms": elapsed,
                "cached": result.get("cached", False),
                "status": response.status,
                "size": len(result.get("svgString", "")) if response.status == 200 else 0
            }
    except Exception as e:
        return {
            "success": False,
            "time_ms": (time.time() - start_time) * 1000,
            "error": str(e),
            "status": 0
        }

async def get_rust_stats(session):
    """Get statistics from Rust service"""
    try:
        async with session.get(f"{RUST_URL}/status") as response:
            if response.status == 200:
                return await response.json()
    except:
        pass
    return None

async def run_realistic_test():
    """Run a realistic load test simulating actual usage"""
    print("\n🚀 Realistic QR Engine v2 Load Test")
    print("=" * 60)
    
    # Test scenarios
    scenarios = [
        # Common URLs (will benefit from cache)
        {"name": "Popular URLs", "data": ["https://example.com", "https://google.com", "https://github.com"], "count": 20},
        # Unique product IDs (no cache benefit)
        {"name": "Unique Products", "data": [f"PROD-{i:05d}" for i in range(50)], "count": 1},
        # WiFi credentials (moderate repetition)
        {"name": "WiFi QRs", "data": ["WIFI:T:WPA;S:Guest;P:Welcome123;;", "WIFI:T:WPA;S:Office;P:SecurePass;;"], "count": 10},
        # VCards (some repetition)
        {"name": "Contact Cards", "data": [f"BEGIN:VCARD\nVERSION:3.0\nFN:User {i}\nEND:VCARD" for i in range(10)], "count": 3},
    ]
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        # Get initial stats
        initial_stats = await get_rust_stats(session)
        if initial_stats:
            print(f"Initial cache stats: {initial_stats['cache_stats']['cache_hit_rate_percent']:.1f}% hit rate")
        
        print("\nRunning test scenarios...")
        
        for scenario in scenarios:
            print(f"\n📊 {scenario['name']}:")
            scenario_results = []
            
            for data_item in scenario['data']:
                for _ in range(scenario['count']):
                    result = await generate_qr(session, data_item)
                    scenario_results.append(result)
                    results.append(result)
                    
                    # Realistic delay between requests (50-200ms)
                    await asyncio.sleep(0.1)
            
            # Analyze scenario results
            successful = [r for r in scenario_results if r['success']]
            if successful:
                times = [r['time_ms'] for r in successful]
                cached = [r for r in successful if r.get('cached', False)]
                
                print(f"  - Requests: {len(scenario_results)}")
                print(f"  - Success rate: {len(successful)/len(scenario_results)*100:.1f}%")
                print(f"  - Avg time: {statistics.mean(times):.1f}ms")
                print(f"  - Cache hits: {len(cached)} ({len(cached)/len(successful)*100:.1f}%)")
                
                if cached:
                    cached_times = [r['time_ms'] for r in cached]
                    uncached_times = [r['time_ms'] for r in successful if not r.get('cached', False)]
                    if uncached_times:
                        print(f"  - Cache speedup: {statistics.mean(uncached_times)/statistics.mean(cached_times):.1f}x")
        
        # Get final stats
        final_stats = await get_rust_stats(session)
        
        # Overall results
        print("\n" + "=" * 60)
        print("📈 Overall Results:")
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"\nTotal requests: {len(results)}")
        print(f"Successful: {len(successful)} ({len(successful)/len(results)*100:.1f}%)")
        print(f"Failed: {len(failed)} ({len(failed)/len(results)*100:.1f}%)")
        
        if successful:
            times = [r['time_ms'] for r in successful]
            cached = [r for r in successful if r.get('cached', False)]
            
            print(f"\nResponse times:")
            print(f"  Min: {min(times):.1f}ms")
            print(f"  Max: {max(times):.1f}ms")
            print(f"  Mean: {statistics.mean(times):.1f}ms")
            print(f"  Median: {statistics.median(times):.1f}ms")
            
            if len(times) >= 20:
                print(f"  P95: {sorted(times)[int(len(times)*0.95)]:.1f}ms")
            
            print(f"\nCache performance:")
            print(f"  Cache hits: {len(cached)} ({len(cached)/len(successful)*100:.1f}%)")
            
            if cached:
                cached_times = [r['time_ms'] for r in cached]
                uncached_times = [r['time_ms'] for r in successful if not r.get('cached', False)]
                
                print(f"  Cached avg: {statistics.mean(cached_times):.1f}ms")
                if uncached_times:
                    print(f"  Uncached avg: {statistics.mean(uncached_times):.1f}ms")
                    print(f"  Speedup: {statistics.mean(uncached_times)/statistics.mean(cached_times):.1f}x")
        
        if final_stats:
            cache_stats = final_stats.get('cache_stats', {})
            print(f"\nFinal cache stats:")
            print(f"  Hit rate: {cache_stats.get('cache_hit_rate_percent', 0):.1f}%")
            print(f"  Cache size: {cache_stats.get('cache_size', 0)} entries")
            print(f"  Total hits: {cache_stats.get('cache_hits', 0)}")
            print(f"  Total misses: {cache_stats.get('cache_misses', 0)}")
        
        # Error analysis
        if failed:
            print(f"\nErrors:")
            error_codes = {}
            for r in failed:
                code = r.get('status', 'Unknown')
                error_codes[code] = error_codes.get(code, 0) + 1
            
            for code, count in sorted(error_codes.items()):
                print(f"  HTTP {code}: {count}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"realistic_test_results_{timestamp}.json"
        with open(filename, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "total_requests": len(results),
                "scenarios": [s['name'] for s in scenarios],
                "results": results,
                "initial_stats": initial_stats,
                "final_stats": final_stats
            }, f, indent=2)
        
        print(f"\n📄 Results saved to: {filename}")

if __name__ == "__main__":
    asyncio.run(run_realistic_test())