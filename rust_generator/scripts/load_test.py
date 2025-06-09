#!/usr/bin/env python3
"""
QR Engine v2 Load Testing Script
Tests performance with high volumes and distributed cache
"""

import asyncio
import aiohttp
import json
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any
import argparse
import sys

# ANSI color codes
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

class LoadTester:
    def __init__(self, base_url: str = "http://localhost:3002"):
        self.base_url = base_url
        self.results = []
        
    async def check_services(self):
        """Check if required services are running"""
        print(f"{YELLOW}Checking services...{NC}")
        
        async with aiohttp.ClientSession() as session:
            # Check Rust service
            try:
                async with session.get(f"{self.base_url}/health") as resp:
                    if resp.status == 200:
                        print(f"{GREEN}✓ Rust generator service is running{NC}")
                    else:
                        print(f"{RED}✗ Rust generator service returned status {resp.status}{NC}")
                        return False
            except Exception as e:
                print(f"{RED}✗ Cannot connect to Rust generator service: {e}{NC}")
                return False
                
            # Check cache stats (Redis)
            try:
                async with session.get(f"{self.base_url}/api/qr/cache/stats") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"{GREEN}✓ Redis cache is connected (mode: {data['stats']['mode']}){NC}")
                    else:
                        print(f"{YELLOW}⚠ Redis cache might not be available{NC}")
            except:
                print(f"{YELLOW}⚠ Redis cache endpoint not responding{NC}")
                
        return True
        
    async def clear_cache(self):
        """Clear the cache before testing"""
        print(f"\n{YELLOW}Clearing cache...{NC}")
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/qr/cache/clear") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"{GREEN}✓ Cache cleared: {data['message']}{NC}")
                    
    async def single_request(self, session: aiohttp.ClientSession, endpoint: str, payload: dict) -> dict:
        """Make a single request and measure performance"""
        start_time = time.time()
        
        try:
            async with session.post(f"{self.base_url}{endpoint}", json=payload) as resp:
                response_time = (time.time() - start_time) * 1000  # ms
                
                result = {
                    'status': resp.status,
                    'response_time': response_time,
                    'success': resp.status == 200,
                    'timestamp': time.time()
                }
                
                if resp.status == 200:
                    data = await resp.json()
                    result['cached'] = data.get('cached', False)
                    
                return result
                
        except Exception as e:
            return {
                'status': 0,
                'response_time': (time.time() - start_time) * 1000,
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }
            
    async def run_concurrent_requests(self, endpoint: str, payload: dict, 
                                    num_requests: int, concurrency: int) -> List[dict]:
        """Run multiple concurrent requests"""
        results = []
        
        async with aiohttp.ClientSession() as session:
            # Create tasks in batches
            for i in range(0, num_requests, concurrency):
                batch_size = min(concurrency, num_requests - i)
                tasks = [
                    self.single_request(session, endpoint, payload)
                    for _ in range(batch_size)
                ]
                
                batch_results = await asyncio.gather(*tasks)
                results.extend(batch_results)
                
                # Progress indicator
                completed = i + batch_size
                progress = completed / num_requests * 100
                print(f"\rProgress: {completed}/{num_requests} ({progress:.1f}%)", end='', flush=True)
                
        print()  # New line after progress
        return results
        
    def analyze_results(self, results: List[dict], test_name: str):
        """Analyze and display test results"""
        print(f"\n{BLUE}=== {test_name} Results ==={NC}")
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        response_times = [r['response_time'] for r in successful]
        
        if not response_times:
            print(f"{RED}No successful requests!{NC}")
            return
            
        # Calculate statistics
        total_requests = len(results)
        success_rate = len(successful) / total_requests * 100
        avg_response_time = statistics.mean(response_times)
        median_response_time = statistics.median(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        
        # Calculate percentiles
        sorted_times = sorted(response_times)
        p95 = sorted_times[int(len(sorted_times) * 0.95)]
        p99 = sorted_times[int(len(sorted_times) * 0.99)]
        
        # Calculate throughput
        duration = results[-1]['timestamp'] - results[0]['timestamp']
        throughput = len(successful) / duration if duration > 0 else 0
        
        # Count cache hits
        cache_hits = sum(1 for r in successful if r.get('cached', False))
        cache_hit_rate = cache_hits / len(successful) * 100 if successful else 0
        
        # Display results
        print(f"Total requests:      {total_requests}")
        print(f"Successful:          {len(successful)} ({success_rate:.1f}%)")
        print(f"Failed:              {len(failed)}")
        print(f"Cache hits:          {cache_hits} ({cache_hit_rate:.1f}%)")
        print(f"\nResponse times (ms):")
        print(f"  Average:           {avg_response_time:.2f}")
        print(f"  Median:            {median_response_time:.2f}")
        print(f"  Min:               {min_response_time:.2f}")
        print(f"  Max:               {max_response_time:.2f}")
        print(f"  95th percentile:   {p95:.2f}")
        print(f"  99th percentile:   {p99:.2f}")
        print(f"\nThroughput:          {throughput:.2f} req/s")
        
        # Store for comparison
        self.results.append({
            'test_name': test_name,
            'stats': {
                'total_requests': total_requests,
                'success_rate': success_rate,
                'avg_response_time': avg_response_time,
                'p95': p95,
                'p99': p99,
                'throughput': throughput,
                'cache_hit_rate': cache_hit_rate
            }
        })
        
    async def get_cache_stats(self):
        """Get and display cache statistics"""
        print(f"\n{YELLOW}Cache Statistics:{NC}")
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/qr/cache/stats") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    stats = data['stats']
                    print(f"  Total keys:        {stats['total_keys']}")
                    print(f"  Memory usage:      {stats['memory_mb']:.2f} MB")
                    print(f"  Hit rate:          {stats['hit_rate']:.1f}%")
                    print(f"  Mode:              {stats['mode']}")
                    
    async def run_load_tests(self, args):
        """Run all load tests"""
        print(f"{GREEN}=== QR Engine v2 Load Testing ==={NC}\n")
        
        # Check services
        if not await self.check_services():
            print(f"{RED}Aborting: Required services are not running{NC}")
            return
            
        # Clear cache
        await self.clear_cache()
        
        # Test payloads
        payloads = {
            'basic': {
                'data': 'https://example.com/test',
                'size': 300,
                'customization': None
            },
            'medium': {
                'data': 'https://example.com/test',
                'size': 300,
                'customization': {
                    'eye_shape': 'circle',
                    'data_pattern': 'dots',
                    'foreground_color': '#000000',
                    'background_color': '#FFFFFF'
                }
            },
            'advanced': {
                'data': 'https://example.com/test',
                'size': 500,
                'customization': {
                    'eye_shape': 'rounded',
                    'data_pattern': 'rounded',
                    'gradient': {
                        'type': 'linear',
                        'colors': ['#FF6B6B', '#4ECDC4'],
                        'angle': 45
                    },
                    'frame': {
                        'style': 'rounded',
                        'text': 'Scan Me',
                        'color': '#333333'
                    }
                }
            }
        }
        
        # Test 1: Basic QR generation (cold cache)
        print(f"\n{GREEN}Test 1: Basic QR Generation (Cold Cache){NC}")
        results = await self.run_concurrent_requests(
            '/api/qr/generate', 
            payloads['basic'],
            args.requests,
            args.concurrency
        )
        self.analyze_results(results, "Basic QR (Cold Cache)")
        await self.get_cache_stats()
        
        # Test 2: Basic QR with cache hits
        print(f"\n{GREEN}Test 2: Basic QR Generation (Warm Cache){NC}")
        results = await self.run_concurrent_requests(
            '/api/qr/generate',
            payloads['basic'],
            args.requests,
            args.concurrency
        )
        self.analyze_results(results, "Basic QR (Warm Cache)")
        await self.get_cache_stats()
        
        # Test 3: Medium complexity
        print(f"\n{GREEN}Test 3: Medium Complexity QR{NC}")
        results = await self.run_concurrent_requests(
            '/api/qr/generate',
            payloads['medium'],
            args.requests // 2,  # Fewer requests for heavier operations
            args.concurrency // 2
        )
        self.analyze_results(results, "Medium Complexity QR")
        
        # Test 4: Advanced complexity
        print(f"\n{GREEN}Test 4: Advanced Complexity QR{NC}")
        results = await self.run_concurrent_requests(
            '/api/qr/generate',
            payloads['advanced'],
            args.requests // 4,  # Even fewer for complex operations
            args.concurrency // 4
        )
        self.analyze_results(results, "Advanced Complexity QR")
        
        # Test 5: Batch generation
        print(f"\n{GREEN}Test 5: Batch Generation{NC}")
        batch_payload = {
            'requests': [
                {'id': str(i), 'data': f'https://example.com/{i}', 'size': 200}
                for i in range(5)
            ]
        }
        results = await self.run_concurrent_requests(
            '/api/qr/batch',
            batch_payload,
            args.requests // 10,
            args.concurrency // 5
        )
        self.analyze_results(results, "Batch Generation (5 QRs)")
        
        # Final summary
        self.print_summary()
        
    def print_summary(self):
        """Print summary of all tests"""
        print(f"\n{GREEN}=== Test Summary ==={NC}")
        print(f"{'Test':<30} {'Success Rate':<15} {'Avg Time (ms)':<15} {'P95 (ms)':<12} {'Throughput':<15}")
        print("-" * 90)
        
        for result in self.results:
            stats = result['stats']
            print(f"{result['test_name']:<30} "
                  f"{stats['success_rate']:.1f}%{'':<10} "
                  f"{stats['avg_response_time']:.2f}{'':<10} "
                  f"{stats['p95']:.2f}{'':<7} "
                  f"{stats['throughput']:.2f} req/s")
                  
async def main():
    parser = argparse.ArgumentParser(description='QR Engine v2 Load Testing')
    parser.add_argument('-r', '--requests', type=int, default=1000,
                        help='Total number of requests per test (default: 1000)')
    parser.add_argument('-c', '--concurrency', type=int, default=50,
                        help='Number of concurrent requests (default: 50)')
    parser.add_argument('-u', '--url', type=str, default='http://localhost:3002',
                        help='Base URL for the service (default: http://localhost:3002)')
    
    args = parser.parse_args()
    
    tester = LoadTester(args.url)
    await tester.run_load_tests(args)
    
if __name__ == '__main__':
    asyncio.run(main())