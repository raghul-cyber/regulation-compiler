from sqlalchemy import create_engine, text

db_url = 'postgresql://postgres.lbzgnofdaswbjjkkblnz:Sai%40chan1234567890%40@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
engine = create_engine(db_url)
with engine.connect() as conn:
    user = conn.execute(text("SELECT id, org_id, clerk_user_id, email, role FROM users WHERE clerk_user_id = 'user_3JKDUKZru9dKgWGQ5EBghqYTPCZ';")).first()
    print('User in DB:', user)
    if user:
        org = conn.execute(text(f"SELECT id, name, plan FROM organizations WHERE id = '{user.org_id}';")).first()
        print('Org in DB:', org)
        ent = conn.execute(text(f"SELECT id, org_id, user_id, plan, status, free_usage_limit, free_usage_used FROM user_entitlements WHERE org_id = '{user.org_id}';")).first()
        print('Entitlement in DB:', ent)
