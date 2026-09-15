import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2

load_dotenv("apps/api/.env")
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in apps/api/.env")
    sys.exit(1)

INDEXES = [
    ("idx_compliance_checks_org_created", "CREATE INDEX IF NOT EXISTS idx_compliance_checks_org_created ON compliance_checks(org_id, created_at DESC);"),
    ("idx_compliance_checks_policy_res", "CREATE INDEX IF NOT EXISTS idx_compliance_checks_policy_res ON compliance_checks(policy_id, result);"),
    ("idx_audit_log_org_created", "CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(org_id, created_at DESC);"),
    ("idx_audit_log_actor_created", "CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created ON audit_log(actor_id, created_at DESC);"),
    ("idx_requirements_ver_type", "CREATE INDEX IF NOT EXISTS idx_requirements_ver_type ON requirements(regulation_version_id, type);"),
    ("idx_background_jobs_status_created", "CREATE INDEX IF NOT EXISTS idx_background_jobs_status_created ON background_jobs(status, created_at DESC);"),
    ("idx_api_keys_hash", "CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);"),
    ("idx_regulations_jurisdiction", "CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);"),
    ("idx_llm_logs_created_at", "CREATE INDEX IF NOT EXISTS idx_llm_logs_created_at ON llm_logs(created_at DESC);"),
]

def main():
    print(f"Connecting to database to apply high-performance indexes...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    success_count = 0
    for name, sql in INDEXES:
        try:
            print(f"Applying index {name}...")
            cur.execute(sql)
            print(f"  [OK] {name}")
            success_count += 1
        except Exception as e:
            print(f"  [WARN] Failed to apply {name}: {e}")
            
    cur.close()
    conn.close()
    print(f"\nSuccessfully verified/created {success_count}/{len(INDEXES)} performance indexes.")

if __name__ == "__main__":
    main()
