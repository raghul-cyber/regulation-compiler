import sys
import os
import uuid
sys.path.append(os.path.abspath('.'))
from app.db.session import SessionLocal
from app.models.regulations import Regulation

db = SessionLocal()
new_reg_id = uuid.uuid4()
new_reg = Regulation(
    id=new_reg_id,
    name="PIPEDA Consolidated Text",
    jurisdiction="CA",
    source_url="s3://mock/ca.pdf"
)
db.add(new_reg)
db.commit()

print("2. Added new Regulation for jurisdiction 'CA'")
distinct_jurs_after = db.query(Regulation.jurisdiction).distinct().all()
print("\n3. Real Jurisdictions in DB AFTER insert:")
for j in distinct_jurs_after:
    print(f" - {j[0]}")
