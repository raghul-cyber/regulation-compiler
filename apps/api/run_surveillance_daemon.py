"""
24/7 Regulatory Surveillance Daemon CLI Runner
Executes continuous worldwide statutory scraping, regulatory signal ingestion,
automated rule extraction, and AST compilation in PostgreSQL.
"""
import sys
import os
import time
import signal
import logging
import argparse
from datetime import datetime, timezone

# Add current directory to path
sys.path.insert(0, os.path.abspath("."))

from app.db.session import SessionLocal
from app.services.live_feed_scraper import scraper_service
from app.models.regulations import LiveRegulatorySignal, Regulation
from app.models.requirements import Requirement
from app.models.audit import AuditLog

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("surveillance.daemon")

RUNNING = True

def handle_exit(signum, frame):
    global RUNNING
    print("\n[!] Received shutdown signal. Gracefully stopping 24/7 Regulatory Surveillance Daemon...")
    RUNNING = False

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

def print_banner():
    banner = """
==============================================================================
    24/7 AUTONOMOUS REGULATORY SURVEILLANCE DAEMON (LIVE CONTINUOUS)
    Worldwide Statutory Perimeter Monitoring & Automated AST Compilation
==============================================================================
  Monitored Jurisdictions:
   [1] US  - Federal Register API (SEC, HHS, FTC, CFPB, FinCEN, EPA)
   [2] UK  - Financial Conduct Authority (FCA) Real-Time Gazette RSS
   [3] CA  - Canada Gazette & Open Government Portal API
   [4] EU  - European Union EUR-Lex Gazettes (AI Act, DORA, NIS 2)
   [5] SG  - Monetary Authority of Singapore (MAS Cyber Hygiene & TRM)
   [6] GBL - Global Technical Standards (PCI DSS 4.0, ISO/IEC 27001:2022)
==============================================================================
"""
    print(banner)

def run_daemon(interval: int = 15, max_cycles: int = None, single_run: bool = False):
    print_banner()
    logger.info("Connecting to database and initializing 24/7 statutory surveillance...")

    # Test DB
    db = SessionLocal()
    try:
        total_signals = db.query(LiveRegulatorySignal).count()
        total_regs = db.query(Regulation).count()
        total_reqs = db.query(Requirement).count()
        logger.info(f"Database connected: {total_signals} signals, {total_regs} regulations, {total_reqs} statutory requirements.")
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return
    finally:
        db.close()

    cycle = 0
    while RUNNING:
        cycle += 1
        print(f"\n[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}] >>> Executing Surveillance Cycle #{cycle} <<<")
        
        db = SessionLocal()
        start_time = time.time()
        try:
            result = scraper_service.sync_and_extract_live_signals(db, max_extractions_per_run=1)
            duration = round(time.time() - start_time, 2)
            
            # Query updated counts
            signals_count = db.query(LiveRegulatorySignal).count()
            regs_count = db.query(Regulation).count()
            reqs_count = db.query(Requirement).count()
            recent_audit = db.query(AuditLog).order_by(AuditLog.created_at.desc()).first()

            print(f"  Status: SUCCESS ({duration}s)")
            print(f"  Total Signals Ingested: {signals_count} (+{result.get('new_signals_ingested', 0)} new)")
            print(f"  Statutory Regulations Compiled: {regs_count} (+{result.get('regulations_extracted', 0)} new)")
            print(f"  Requirements in AST Index: {reqs_count}")
            if recent_audit:
                print(f"  Latest Audit Trace: [{recent_audit.action}] on {recent_audit.entity_type} ({str(recent_audit.entity_id)[:8]})")

        except Exception as e:
            logger.error(f"Error during surveillance cycle #{cycle}: {e}", exc_info=True)
        finally:
            db.close()
            import gc
            gc.collect()

        if single_run or (max_cycles and cycle >= max_cycles):
            print(f"\n[+] Requested cycles completed ({cycle} cycle(s)). Surveillance run finished.")
            break

        if not RUNNING:
            break

        print(f"  Next statutory perimeter sweep in {interval}s... (Press Ctrl+C to stop)")
        for _ in range(interval):
            if not RUNNING:
                break
            time.sleep(1)

    print("\n[+] 24/7 Regulatory Surveillance Daemon stopped cleanly.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="24/7 Live Regulatory Surveillance Daemon")
    parser.add_argument("--interval", type=int, default=15, help="Interval in seconds between surveillance cycles (default: 15)")
    parser.add_argument("--cycles", type=int, default=None, help="Maximum number of cycles to run (default: infinite)")
    parser.add_argument("--once", action="store_true", help="Run once and exit immediately")
    args = parser.parse_args()

    run_daemon(
        interval=args.interval,
        max_cycles=1 if args.once else args.cycles,
        single_run=args.once
    )
