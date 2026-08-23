from app.db.session import engine
from sqlalchemy import text
with engine.begin() as conn:
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS framework_catalog (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        acronym VARCHAR UNIQUE NOT NULL,
        jurisdiction VARCHAR NOT NULL,
        source_url VARCHAR NOT NULL,
        is_fetchable BOOLEAN NOT NULL DEFAULT FALSE,
        description VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    """))
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS team_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL,
        role roleenum NOT NULL,
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        token VARCHAR UNIQUE NOT NULL,
        status VARCHAR DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
    """))
print("Tables created successfully.")
