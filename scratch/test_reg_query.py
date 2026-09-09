import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

db_url = os.getenv("DATABASE_URL")
print("DATABASE_URL:", db_url.split("@")[-1] if db_url else "None")

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("Testing raw SQL: SELECT id, name, jurisdiction, created_at FROM regulations LIMIT 3;")
    res = session.execute(text("SELECT id, name, jurisdiction, created_at FROM regulations LIMIT 3;"))
    for row in res:
        print("Row:", row)
except Exception as e:
    print("Raw SQL failed:", type(e), e)
    session.rollback()

try:
    from app.models.regulations import Regulation
    print("Testing ORM query: session.query(Regulation).order_by(Regulation.created_at.desc()).all()")
    regs = session.query(Regulation).order_by(Regulation.created_at.desc()).all()
    print("Found regulations count:", len(regs))
    for r in regs:
        print("Regulation:", r.name, "created_at:", getattr(r, 'created_at', None), "version:", r.current_version_id)
except Exception as e:
    print("ORM query failed:", type(e), e)
    session.rollback()

try:
    from app.models.regulations import FrameworkCatalog
    fc = session.query(FrameworkCatalog).all()
    print("Framework catalog count:", len(fc))
except Exception as e:
    print("Framework catalog query failed:", type(e), e)
    session.rollback()

session.close()
