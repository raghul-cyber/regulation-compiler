"""Add billing, entitlements, usage events, payment transactions, and webhook idempotency tables

Revision ID: d0d0_billing_entitlements
Revises: b669bf67f471
Create Date: 2026-09-20 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd0d0_billing_entitlements'
down_revision: Union[str, Sequence[str], None] = 'b669bf67f471'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_entitlements
    op.create_table(
        'user_entitlements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('org_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('plan', sa.String(), nullable=False, server_default='free'),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('free_usage_limit', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('free_usage_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('paid_credits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('dodo_customer_id', sa.String(), nullable=True),
        sa.Column('dodo_subscription_id', sa.String(), nullable=True),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('org_id', name='uq_user_entitlements_org_id')
    )
    op.create_index('idx_entitlements_org_plan', 'user_entitlements', ['org_id', 'plan'])
    op.create_index('idx_entitlements_customer', 'user_entitlements', ['dodo_customer_id'])
    op.create_index(op.f('ix_user_entitlements_org_id'), 'user_entitlements', ['org_id'])
    op.create_index(op.f('ix_user_entitlements_user_id'), 'user_entitlements', ['user_id'])

    # 2. usage_events
    op.create_table(
        'usage_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('org_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('operation_type', sa.String(), nullable=False),
        sa.Column('operation_id', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=True, server_default='web_upload'),
        sa.Column('status', sa.String(), nullable=False, server_default='reserved'),
        sa.Column('credits_consumed', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('org_id', 'operation_id', name='uq_usage_events_org_operation')
    )
    op.create_index('idx_usage_events_created', 'usage_events', ['org_id', 'created_at'])
    op.create_index(op.f('ix_usage_events_operation_id'), 'usage_events', ['operation_id'])
    op.create_index(op.f('ix_usage_events_org_id'), 'usage_events', ['org_id'])
    op.create_index(op.f('ix_usage_events_user_id'), 'usage_events', ['user_id'])

    # 3. payment_transactions
    op.create_table(
        'payment_transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('org_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('dodo_payment_id', sa.String(), nullable=False),
        sa.Column('dodo_customer_id', sa.String(), nullable=True),
        sa.Column('dodo_product_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='USD'),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('payment_type', sa.String(), nullable=True, server_default='one_time'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('dodo_payment_id')
    )
    op.create_index('idx_payment_org_status', 'payment_transactions', ['org_id', 'status'])
    op.create_index(op.f('ix_payment_transactions_dodo_customer_id'), 'payment_transactions', ['dodo_customer_id'])
    op.create_index(op.f('ix_payment_transactions_dodo_payment_id'), 'payment_transactions', ['dodo_payment_id'])
    op.create_index(op.f('ix_payment_transactions_org_id'), 'payment_transactions', ['org_id'])
    op.create_index(op.f('ix_payment_transactions_user_id'), 'payment_transactions', ['user_id'])

    # 4. webhook_events
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False, server_default='dodo'),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='received'),
        sa.Column('payload_hash', sa.String(), nullable=True),
        sa.Column('error', sa.String(), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'event_id', name='uq_webhook_provider_event')
    )
    op.create_index(op.f('ix_webhook_events_event_id'), 'webhook_events', ['event_id'])


def downgrade() -> None:
    op.drop_table('webhook_events')
    op.drop_table('payment_transactions')
    op.drop_table('usage_events')
    op.drop_table('user_entitlements')
