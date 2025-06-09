#!/usr/bin/env python3
"""
Load Testing Script for QR Engine v2
Tests performance with high volume of concurrent requests
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

# Test configuration
# Use backend port since it proxies to Rust service
BASE_URL = "http://localhost:3004"
QR_ENDPOINT = f"{BASE_URL}/api/generate"
# Cache endpoints are on Rust service directly
RUST_URL = "http://localhost:3002"
CACHE_STATS_ENDPOINT = f"{RUST_URL}/api/qr/cache/stats"
CACHE_CLEAR_ENDPOINT = f"{RUST_URL}/api/qr/cache/clear"

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
    {"type": "custom", "with_logo": True},
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
        
        if pattern.get("with_logo"):
            # Base64 encoded 1x1 transparent PNG as placeholder
            options["logo"] = {
                "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "size": 50,
                "padding": 5
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
    """Make a single QR generation request"""
    start_time = time.time()
    
    payload = {
        "barcode_type": "qrcode",
        "data": data,
        "options": options
    }
    
    try:
        async with session.post(QR_ENDPOINT, json=payload) as response:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to ms
            
            if response.status == 200:
                result = await response.json()
                return {
                    "success": result.get("success", False),
                    "response_time": response_time,
                    "cached": result.get("cached", False),
                    "size": len(result.get("svgString", ""))
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

async def get_cache_stats(session: aiohttp.ClientSession) -> Dict:
    """Get cache statistics"""
    try:
        async with session.get(CACHE_STATS_ENDPOINT) as response:
            if response.status == 200:
                return await response.json()
    except:
        pass
    return {}

async def clear_cache(session: aiohttp.ClientSession) -> bool:
    """Clear the cache"""
    try:
        async with session.post(CACHE_CLEAR_ENDPOINT) as response:
            return response.status == 200
    except:
        return False

async def run_load_test(total_requests: int, concurrent_requests: int, 
                       clear_cache_first: bool = True):
    """Run the load test"""
    print(f"\n🚀 Starting QR Engine v2 Load Test")
    print(f"   Total requests: {total_requests}")
    print(f"   Concurrent requests: {concurrent_requests}")
    print(f"   Test patterns: {len(TEST_PATTERNS)}")
    print(f"   Clear cache first: {clear_cache_first}")
    print("-" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Clear cache if requested
        if clear_cache_first:
            print("🧹 Clearing cache...")
            await clear_cache(session)
            await asyncio.sleep(1)
        
        # Get initial cache stats
        initial_stats = await get_cache_stats(session)
        
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
            
            # Delay between batches to avoid overwhelming the server and rate limits
            if batch_num < batch_count - 1:
                await asyncio.sleep(0.5)  # Increased delay to respect rate limits
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Get final cache stats
        final_stats = await get_cache_stats(session)
        
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
        else:
            print("Cache hits: N/A (no successful requests)")
        
        if successful:
            response_times = [r["response_time"] for r in successful]
            cold_times = [r["response_time"] for r in successful if not r.get("cached", False)]
            warm_times = [r["response_time"] for r in successful if r.get("cached", False)]
            
            print(f"\n⏱️  Response Times (all):")
            print(f"   Min: {min(response_times):.2f} ms")
            print(f"   Max: {max(response_times):.2f} ms")
            print(f"   Mean: {statistics.mean(response_times):.2f} ms")
            print(f"   Median: {statistics.median(response_times):.2f} ms")
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
                print(f"   Speedup: {statistics.mean(cold_times) / statistics.mean(warm_times):.2f}x")
            
            print(f"\n📊 Throughput:")
            print(f"   Requests/second: {len(all_results) / total_time:.2f}")
            print(f"   Data processed: {sum(r.get('size', 0) for r in successful) / 1024 / 1024:.2f} MB")
        
        # Cache statistics
        if final_stats.get("success"):
            stats = final_stats.get("stats", {})
            print(f"\n💾 Cache Statistics:")
            print(f"   Total keys: {stats.get('total_keys', 0)}")
            print(f"   Memory used: {stats.get('memory_mb', 0):.2f} MB")
            print(f"   Hit rate: {stats.get('hit_rate', 0):.1f}%")
            print(f"   Mode: {stats.get('mode', 'unknown')}")
        
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
        results_file = f"load_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump({
                "config": {
                    "total_requests": total_requests,
                    "concurrent_requests": concurrent_requests,
                    "clear_cache_first": clear_cache_first
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
                "cache_stats": {
                    "initial": initial_stats,
                    "final": final_stats
                },
                "errors": [r for r in failed]
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {results_file}")

def main():
    parser = argparse.ArgumentParser(description="Load test for QR Engine v2")
    parser.add_argument("-t", "--total", type=int, default=1000,
                       help="Total number of requests (default: 1000)")
    parser.add_argument("-c", "--concurrent", type=int, default=50,
                       help="Number of concurrent requests (default: 50)")
    parser.add_argument("--no-clear-cache", action="store_true",
                       help="Don't clear cache before test")
    parser.add_argument("--warm-up", type=int, default=0,
                       help="Number of warm-up requests before main test")
    
    args = parser.parse_args()
    
    # Run warm-up if requested
    if args.warm_up > 0:
        print(f"🔥 Running {args.warm_up} warm-up requests...")
        asyncio.run(run_load_test(args.warm_up, min(args.warm_up, 10), 
                                 clear_cache_first=not args.no_clear_cache))
        print("\n" + "=" * 60 + "\n")
        time.sleep(2)
    
    # Run main test
    asyncio.run(run_load_test(args.total, args.concurrent, 
                             clear_cache_first=not args.no_clear_cache and args.warm_up == 0))

if __name__ == "__main__":
    main()