import os
import sys
sys.path.insert(0, os.path.abspath("apps/api"))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)
conn = engine.connect()

print("Current database:", conn.execute(text("SELECT current_database(), current_user, current_schema();")).fetchall())

print("\nAll schemas:")
for r in conn.execute(text("SELECT schema_name FROM information_schema.schemata;")):
    print(" -", r[0])

print("\nAll tables across all schemas:")
for r in conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")):
    print(" -", r[0], ".", r[1])

conn.close()
