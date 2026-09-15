"""
Synthetic Uptime & Health Monitoring Probe for Regulation-as-Code Compiler.
Checks /health and /health/ready, measuring latency percentiles and subsystem statuses.
"""

import sys
import time
import json
import argparse
import urllib.request
import urllib.error

API_BASE_URL = "http://127.0.0.1:8080"

def probe_health(endpoint: str = "/health/ready") -> dict:
    url = f"{API_BASE_URL}{endpoint}"
    start_time = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "UptimeMonitor/1.0"})
    
    try:
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            latency_ms = (time.time() - start_time) * 1000
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            return {
                "ok": resp.status == 200,
                "status_code": resp.status,
                "latency_ms": round(latency_ms, 2),
                "data": data,
                "error": None
            }
    except urllib.error.HTTPError as e:
        latency_ms = (time.time() - start_time) * 1000
        return {
            "ok": False,
            "status_code": e.code,
            "latency_ms": round(latency_ms, 2),
            "data": None,
            "error": f"HTTP {e.code}: {e.reason}"
        }
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        return {
            "ok": False,
            "status_code": 0,
            "latency_ms": round(latency_ms, 2),
            "data": None,
            "error": str(e)
        }

def run_uptime_check(verbose: bool = True) -> bool:
    print("\n=======================================================")
    print("      UPTIME & HEALTH TELEMETRY MONITOR                ")
    print("=======================================================")
    
    # 1. Fast Liveness Probe
    live_res = probe_health("/health")
    print(f"[*] Fast Liveness Probe (/health):")
    print(f"    Status: {'PASS' if live_res['ok'] else 'FAIL'} | Latency: {live_res['latency_ms']}ms")
    
    # 2. Deep Readiness Probe
    deep_res = probe_health("/health/ready")
    print(f"[*] Deep Readiness Probe (/health/ready):")
    print(f"    Status: {'PASS' if deep_res['ok'] else 'FAIL'} | Latency: {deep_res['latency_ms']}ms")
    
    if deep_res["data"]:
        checks = deep_res["data"].get("checks", {})
        print("    Subsystem Checks:")
        for name, status in checks.items():
            print(f"      - {name.ljust(18)}: {status}")
            
    is_healthy = live_res["ok"] and deep_res["ok"]
    print("-------------------------------------------------------")
    print(f"OVERALL POSTURE: {'HEALTHY (100% ONLINE)' if is_healthy else 'DEGRADED / OFFLINE'}")
    print("=======================================================\n")
    return is_healthy

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uptime Monitor")
    parser.add_argument("--once", action="store_true", default=True, help="Run a single health probe check")
    parser.add_argument("--interval", type=int, default=30, help="Continuous loop interval in seconds")
    args = parser.parse_args()

    if args.once:
        success = run_uptime_check()
        sys.exit(0 if success else 1)
    else:
        while True:
            run_uptime_check()
            time.sleep(args.interval)
