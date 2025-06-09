#!/usr/bin/env python3
"""
Test the old /generate endpoint directly on Rust service
"""

import asyncio
import aiohttp
import time
import json
import statistics
from datetime import datetime
import random
import string

# Direct Rust service configuration
RUST_URL = "http://localhost:3002"
GENERATE_ENDPOINT = f"{RUST_URL}/generate"
STATUS_ENDPOINT = f"{RUST_URL}/status"

def generate_random_string(length: int) -> str:
    """Generate random alphanumeric string"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

async def make_request(session: aiohttp.ClientSession, index: int) -> dict:
    """Make a single barcode generation request"""
    start_time = time.time()
    
    # Test data
    data = f"Test QR Code {index}: {generate_random_string(20)}"
    
    payload = {
        "barcode_type": "qrcode",
        "data": data,
        "options": {
            "scale": random.choice([2, 3, 4]),
            "margin": random.choice([1, 2, 3]),
        }
    }
    
    try:
        async with session.post(GENERATE_ENDPOINT, json=payload) as response:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to ms
            
            if response.status == 200:
                result = await response.json()
                return {
                    "success": result.get("success", False),
                    "response_time": response_time,
                    "cached": result.get("from_cache", False),
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

async def run_concurrent_batch(session: aiohttp.ClientSession, batch_size: int, start_idx: int) -> list:
    """Run a batch of concurrent requests"""
    tasks = []
    for i in range(batch_size):
        task = make_request(session, start_idx + i)
        tasks.append(task)
    return await asyncio.gather(*tasks)

async def get_status(session: aiohttp.ClientSession) -> dict:
    """Get service status"""
    try:
        async with session.get(STATUS_ENDPOINT) as response:
            if response.status == 200:
                return await response.json()
    except:
        pass
    return {}

async def run_test(total_requests: int = 500, concurrent_requests: int = 20):
    """Run the performance test"""
    print(f"\n🚀 Testing Old Rust Endpoint Performance")
    print(f"   Total requests: {total_requests}")
    print(f"   Concurrent requests: {concurrent_requests}")
    print(f"   Target: {GENERATE_ENDPOINT}")
    print("-" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Get initial status
        initial_status = await get_status(session)
        if initial_status:
            print(f"✅ Service is running")
            print(f"   Cache enabled: {initial_status.get('cache_enabled', False)}")
            print(f"   Cache size: {initial_status.get('cache_size', 0)}")
        
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
            
            batch_results = await run_concurrent_batch(session, batch_size, batch_num * concurrent_requests)
            all_results.extend(batch_results)
            
            # Small delay between batches
            if batch_num < batch_count - 1:
                await asyncio.sleep(0.1)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Get final status
        final_status = await get_status(session)
        
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
        
        # Save results
        results_file = f"old_endpoint_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump({
                "config": {
                    "total_requests": total_requests,
                    "concurrent_requests": concurrent_requests,
                    "target": GENERATE_ENDPOINT
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
                }
            }, f, indent=2)
        
        print(f"\n📄 Results saved to: {results_file}")

if __name__ == "__main__":
    asyncio.run(run_test(1000, 50))