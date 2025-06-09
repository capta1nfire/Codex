#!/usr/bin/env python3
"""
Direct Load Test for QR Engine v2 Rust Service
Bypasses the Express backend to test Rust service performance directly
"""

import asyncio
import aiohttp
import time
import json
import argparse
import statistics
from datetime import datetime
from typing import List, Dict, Tuple
import random
import string

# Direct Rust service configuration
RUST_URL = "http://localhost:3002"
QR_ENDPOINT = f"{RUST_URL}/api/qr/generate"
STATUS_ENDPOINT = f"{RUST_URL}/status"
ANALYTICS_ENDPOINT = f"{RUST_URL}/api/qr/analytics"

# Test data patterns
TEST_PATTERNS = [
    # Basic QR codes
    {"type": "url", "prefix": "https://example.com/", "suffix_length": 10},
    {"type": "text", "prefix": "Product ID: ", "suffix_length": 8},
    {"type": "email", "prefix": "user", "suffix": "@example.com", "suffix_length": 5},
    {"type": "phone", "prefix": "+1-555-", "suffix_length": 7},
    
    # Medium complexity
    {"type": "json", "template": '{"id": "%s", "timestamp": %d, "data": "%s"}'},
    {"type": "vcard", "template": 'BEGIN:VCARD\nVERSION:3.0\nFN:%s\nTEL:%s\nEND:VCARD'},
    
    # High complexity (with customization)
    {"type": "custom", "with_gradient": True},
    {"type": "custom", "with_effects": True},
]

def generate_random_string(length: int) -> str:
    """Generate random alphanumeric string"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def generate_test_data(pattern: Dict, index: int) -> Tuple[str, Dict]:
    """Generate test data based on pattern"""
    if pattern["type"] == "url":
        data = pattern["prefix"] + generate_random_string(pattern["suffix_length"])
        options = {"size": 300}
    
    elif pattern["type"] == "text":
        data = pattern["prefix"] + generate_random_string(pattern["suffix_length"])
        options = {"size": 250}
    
    elif pattern["type"] == "email":
        data = pattern["prefix"] + generate_random_string(pattern["suffix_length"]) + pattern["suffix"]
        options = {"size": 280}
    
    elif pattern["type"] == "phone":
        data = pattern["prefix"] + ''.join(random.choices(string.digits, k=pattern["suffix_length"]))
        options = {"size": 200}
    
    elif pattern["type"] == "json":
        data = pattern["template"] % (
            generate_random_string(8),
            int(time.time() * 1000),
            generate_random_string(16)
        )
        options = {"size": 400, "error_correction": "H"}
    
    elif pattern["type"] == "vcard":
        data = pattern["template"] % (
            f"User {index}",
            f"+1-555-{random.randint(1000000, 9999999)}"
        )
        options = {"size": 350}
    
    elif pattern["type"] == "custom":
        data = f"Complex QR {index}: " + generate_random_string(20)
        options = {
            "size": 400,
            "margin": 2,
            "eye_shape": random.choice(["square", "circle", "rounded"]),
            "data_pattern": random.choice(["square", "dots", "rounded"]),
        }
        
        if pattern.get("with_gradient"):
            options["gradient"] = {
                "type": "linear",
                "colors": ["#FF0000", "#00FF00", "#0000FF"],
                "angle": 45
            }
        
        if pattern.get("with_effects"):
            options["effects"] = [
                {"type": "shadow", "intensity": 0.3, "color": "#000000"}
            ]
    
    else:
        data = f"Test {index}"
        options = {"size": 300}
    
    return data, options

async def make_request(session: aiohttp.ClientSession, data: str, options: Dict) -> Dict:
    """Make a single QR generation request directly to Rust service"""
    start_time = time.time()
    
    # QR v2 expects nested options structure
    qr_options = {
        "size": options.get("size", 300),
        "margin": options.get("margin", 4),
        "error_correction": options.get("error_correction", "M"),
        "eye_shape": options.get("eye_shape"),
        "data_pattern": options.get("data_pattern"),
        "foreground_color": "#000000",
        "background_color": "#FFFFFF",
    }
    
    # Add gradient if present
    if "gradient" in options:
        qr_options["gradient"] = options["gradient"]
    
    # Add effects if present
    if "effects" in options:
        qr_options["effects"] = options["effects"]
    
    payload = {
        "data": data,
        "options": qr_options
    }
    
    try:
        async with session.post(QR_ENDPOINT, json=payload) as response:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to ms
            
            if response.status == 200:
                result = await response.json()
                return {
                    "success": True,
                    "response_time": response_time,
                    "cached": result.get("cached", False),
                    "size": len(result.get("svg", ""))
                }
            else:
                return {
                    "success": False,
                    "response_time": response_time,
                    "error": f"HTTP {response.status}",
                    "cached": False
                }
    except Exception as e:
        return {
            "success": False,
            "response_time": (time.time() - start_time) * 1000,
            "error": str(e),
            "cached": False
        }

async def get_rust_stats(session: aiohttp.ClientSession) -> Dict:
    """Get statistics from Rust service"""
    try:
        async with session.get(STATUS_ENDPOINT) as response:
            if response.status == 200:
                return await response.json()
    except:
        pass
    return {}

async def get_analytics(session: aiohttp.ClientSession) -> Dict:
    """Get analytics from Rust service"""
    try:
        async with session.get(ANALYTICS_ENDPOINT) as response:
            if response.status == 200:
                return await response.json()
    except:
        pass
    return {}

async def run_concurrent_batch(session: aiohttp.ClientSession, batch_size: int, 
                              pattern_index: int) -> List[Dict]:
    """Run a batch of concurrent requests"""
    tasks = []
    pattern = TEST_PATTERNS[pattern_index % len(TEST_PATTERNS)]
    
    for i in range(batch_size):
        data, options = generate_test_data(pattern, i)
        task = make_request(session, data, options)
        tasks.append(task)
    
    return await asyncio.gather(*tasks)

async def run_direct_load_test(total_requests: int, concurrent_requests: int):
    """Run the load test directly against Rust service"""
    print(f"\n🚀 Starting Direct QR Engine v2 Load Test (Rust Service)")
    print(f"   Total requests: {total_requests}")
    print(f"   Concurrent requests: {concurrent_requests}")
    print(f"   Test patterns: {len(TEST_PATTERNS)}")
    print(f"   Target: {RUST_URL}")
    print("-" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Get initial stats
        initial_stats = await get_rust_stats(session)
        initial_analytics = await get_analytics(session)
        
        if initial_stats.get("status") == "operational":
            print(f"✅ Rust service is operational (v{initial_stats.get('version', 'unknown')})")
            cache_stats = initial_stats.get('cache_stats', {})
            print(f"   Initial cache hit rate: {cache_stats.get('cache_hit_rate_percent', 0):.1f}%")
        else:
            print("⚠️  Could not get initial stats from Rust service")
        
        # Results storage
        all_results = []
        batch_count = (total_requests + concurrent_requests - 1) // concurrent_requests
        
        print(f"\n📊 Running {batch_count} batches...")
        start_time = time.time()
        
        # Run batches
        for batch_num in range(batch_count):
            remaining = total_requests - (batch_num * concurrent_requests)
            batch_size = min(concurrent_requests, remaining)
            
            print(f"\r   Batch {batch_num + 1}/{batch_count} ({batch_size} requests)...", end="", flush=True)
            
            batch_results = await run_concurrent_batch(session, batch_size, batch_num)
            all_results.extend(batch_results)
            
            # Small delay between batches
            if batch_num < batch_count - 1:
                await asyncio.sleep(0.1)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Get final stats
        final_stats = await get_rust_stats(session)
        final_analytics = await get_analytics(session)
        
        # Analyze results
        print(f"\n\n✅ Test completed in {total_time:.2f} seconds")
        print("\n📈 Performance Results:")
        print("-" * 60)
        
        successful = [r for r in all_results if r["success"]]
        failed = [r for r in all_results if not r["success"]]
        cached = [r for r in successful if r.get("cached", False)]
        
        print(f"Total requests: {len(all_results)}")
        print(f"Successful: {len(successful)} ({len(successful)/len(all_results)*100:.1f}%)")
        print(f"Failed: {len(failed)} ({len(failed)/len(all_results)*100:.1f}%)")
        if successful:
            print(f"Cache hits: {len(cached)} ({len(cached)/len(successful)*100:.1f}% of successful)")
        
        if successful:
            response_times = [r["response_time"] for r in successful]
            cold_times = [r["response_time"] for r in successful if not r.get("cached", False)]
            warm_times = [r["response_time"] for r in successful if r.get("cached", False)]
            
            print(f"\n⏱️  Response Times (all):")
            print(f"   Min: {min(response_times):.2f} ms")
            print(f"   Max: {max(response_times):.2f} ms")
            print(f"   Mean: {statistics.mean(response_times):.2f} ms")
            print(f"   Median: {statistics.median(response_times):.2f} ms")
            if len(response_times) >= 20:
                print(f"   P95: {sorted(response_times)[int(len(response_times) * 0.95)]:.2f} ms")
                print(f"   P99: {sorted(response_times)[int(len(response_times) * 0.99)]:.2f} ms")
            
            if cold_times:
                print(f"\n❄️  Cold Cache Response Times:")
                print(f"   Mean: {statistics.mean(cold_times):.2f} ms")
                print(f"   Median: {statistics.median(cold_times):.2f} ms")
            
            if warm_times:
                print(f"\n🔥 Warm Cache Response Times:")
                print(f"   Mean: {statistics.mean(warm_times):.2f} ms")
                print(f"   Median: {statistics.median(warm_times):.2f} ms")
                if cold_times:
                    print(f"   Speedup: {statistics.mean(cold_times) / statistics.mean(warm_times):.2f}x")
            
            print(f"\n📊 Throughput:")
            print(f"   Requests/second: {len(all_results) / total_time:.2f}")
            print(f"   Data processed: {sum(r.get('size', 0) for r in successful) / 1024 / 1024:.2f} MB")
        
        # Final cache statistics
        if final_stats.get("status") == "operational":
            cache_stats = final_stats.get('cache_stats', {})
            print(f"\n💾 Final Cache Statistics:")
            print(f"   Hit rate: {cache_stats.get('cache_hit_rate_percent', 0):.1f}%")
            print(f"   Total hits: {cache_stats.get('cache_hits', 0)}")
            print(f"   Total misses: {cache_stats.get('cache_misses', 0)}")
            print(f"   Cache size: {cache_stats.get('cache_size', 0)} entries")
        
        # Analytics if available
        if final_analytics:
            print(f"\n📊 QR Engine Analytics:")
            perf = final_analytics.get('performance', {})
            for barcode_type, stats in perf.items():
                if stats.get('count', 0) > 0:
                    print(f"   {barcode_type}:")
                    print(f"     Count: {stats['count']}")
                    print(f"     Avg time: {stats['avg_ms']:.2f} ms")
                    print(f"     Min time: {stats['min_ms']:.2f} ms")
                    print(f"     Max time: {stats['max_ms']:.2f} ms")
        
        # Error analysis
        if failed:
            print(f"\n❌ Error Analysis:")
            error_counts = {}
            for r in failed:
                error = r.get("error", "Unknown")
                error_counts[error] = error_counts.get(error, 0) + 1
            
            for error, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"   {error}: {count}")
        
        print("\n" + "=" * 60)
        
        # Save detailed results
        results_file = f"direct_rust_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump({
                "config": {
                    "total_requests": total_requests,
                    "concurrent_requests": concurrent_requests,
                    "target": RUST_URL
                },
                "summary": {
                    "total_time": total_time,
                    "successful": len(successful),
                    "failed": len(failed),
                    "cache_hits": len(cached),
                    "throughput_rps": len(all_results) / total_time
                },
                "response_times": {
                    "all": response_times if successful else [],
                    "cold": cold_times if successful else [],
                    "warm": warm_times if successful else []
                },
                "stats": {
                    "initial": initial_stats,
                    "final": final_stats,
                    "analytics": final_analytics
                },
                "errors": [r for r in failed]
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {results_file}")

def main():
    parser = argparse.ArgumentParser(description="Direct load test for QR Engine v2 Rust service")
    parser.add_argument("-t", "--total", type=int, default=1000,
                       help="Total number of requests (default: 1000)")
    parser.add_argument("-c", "--concurrent", type=int, default=50,
                       help="Number of concurrent requests (default: 50)")
    
    args = parser.parse_args()
    
    # Run test
    asyncio.run(run_direct_load_test(args.total, args.concurrent))

if __name__ == "__main__":
    main()