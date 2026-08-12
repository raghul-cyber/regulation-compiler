"""make source_document.regulation_version_id nullable

Revision ID: 0563bf9d618b
Revises: a88e60612ab4
Create Date: 2026-08-11 00:09:47.741581

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0563bf9d618b'
down_revision: Union[str, Sequence[str], None] = 'a88e60612ab4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('source_documents', 'regulation_version_id',
               existing_type=sa.UUID(),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('source_documents', 'regulation_version_id',
               existing_type=sa.UUID(),
               nullable=False)
