"""
Concurrency & Simultaneous Users Load Testing Suite for Regulation-as-Code Compiler.
Simulates 25-50 simultaneous concurrent users making parallel requests.
Measures throughput, latency percentiles (p50, p90, p99), error rates, and confirms zero deadlocks.
"""

import sys
import time
import statistics
import concurrent.futures
import urllib.request
import urllib.error
import json

API_BASE_URL = "http://127.0.0.1:8080"
NUM_SIMULTANEOUS_USERS = 30
REQUESTS_PER_USER = 3

ENDPOINTS = [
    "/health",
    "/health/ready",
    "/api/v1/regulations",
]

def make_request(endpoint: str) -> dict:
    url = f"{API_BASE_URL}{endpoint}"
    start = time.time()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "LoadTestConcurrencyBot/1.0",
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15.0) as resp:
            latency_ms = (time.time() - start) * 1000
            return {
                "endpoint": endpoint,
                "status_code": resp.status,
                "latency_ms": latency_ms,
                "success": resp.status in [200, 429]  # 429 is expected rate limit under burst load
            }
    except urllib.error.HTTPError as e:
        latency_ms = (time.time() - start) * 1000
        # 429 is a valid rate-limiting defense response under high concurrency
        return {
            "endpoint": endpoint,
            "status_code": e.code,
            "latency_ms": latency_ms,
            "success": e.code in [200, 429]
        }
    except Exception as e:
        latency_ms = (time.time() - start) * 1000
        return {
            "endpoint": endpoint,
            "status_code": 500,
            "latency_ms": latency_ms,
            "success": False,
            "error": str(e)
        }

def user_worker(user_id: int) -> list:
    results = []
    for _ in range(REQUESTS_PER_USER):
        for ep in ENDPOINTS:
            res = make_request(ep)
            res["user_id"] = user_id
            results.append(res)
    return results

def run_concurrency_test():
    total_tasks = NUM_SIMULTANEOUS_USERS * REQUESTS_PER_USER * len(ENDPOINTS)
    print("\n=======================================================")
    print(f"      HIGH CONCURRENCY & SIMULTANEOUS USERS TEST        ")
    print("=======================================================")
    print(f"Simultaneous Concurrent Users: {NUM_SIMULTANEOUS_USERS}")
    print(f"Requests per user:             {REQUESTS_PER_USER * len(ENDPOINTS)}")
    print(f"Total Parallel HTTP Requests:  {total_tasks}")
    print(f"Target Gateway:                {API_BASE_URL}")
    print("-------------------------------------------------------")
    print("Dispatching parallel threads...")

    start_time = time.time()
    all_results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_SIMULTANEOUS_USERS) as executor:
        futures = [executor.submit(user_worker, uid) for uid in range(NUM_SIMULTANEOUS_USERS)]
        for fut in concurrent.futures.as_completed(futures):
            all_results.extend(fut.result())
            
    total_duration = time.time() - start_time
    
    successful = [r for r in all_results if r["success"]]
    internal_errors = [r for r in all_results if r["status_code"] >= 500]
    rate_limited = [r for r in all_results if r["status_code"] == 429]
    ok_200 = [r for r in all_results if r["status_code"] == 200]
    
    latencies = [r["latency_ms"] for r in all_results]
    latencies.sort()
    
    p50 = statistics.median(latencies) if latencies else 0
    p90 = latencies[int(len(latencies) * 0.90)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
    avg_latency = statistics.mean(latencies) if latencies else 0
    throughput = len(all_results) / total_duration if total_duration > 0 else 0

    print("\n--- RESULTS SUMMARY ---")
    print(f"Total Requests Executed:    {len(all_results)}")
    print(f"Test Duration:              {total_duration:.2f} seconds")
    print(f"Throughput:                 {throughput:.1f} req/sec")
    print(f"HTTP 200 (OK):              {len(ok_200)}")
    print(f"HTTP 429 (Rate-Limited):    {len(rate_limited)} (Rate Limiting Working Properly)")
    print(f"HTTP 500+ (Server Errors):  {len(internal_errors)}")
    print(f"Success / Handled Rate:     {(len(successful) / len(all_results) * 100):.1f}%")
    print(f"\nLatency Distribution:")
    print(f"  Average: {avg_latency:.2f} ms")
    print(f"  p50:     {p50:.2f} ms")
    print(f"  p90:     {p90:.2f} ms")
    print(f"  p99:     {p99:.2f} ms")
    print("-------------------------------------------------------")
    
    if len(internal_errors) == 0:
        print("[PASS] Concurrency test passed: 0 server errors or deadlocks observed.")
        print("=======================================================\n")
        return True
    else:
        print(f"[FAIL] Observed {len(internal_errors)} unhandled server errors.")
        print("=======================================================\n")
        return False

if __name__ == "__main__":
    success = run_concurrency_test()
    sys.exit(0 if success else 1)
