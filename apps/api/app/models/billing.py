import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from .base import BaseModel


class EntitlementPlanEnum(str, enum.Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"


class EntitlementStatusEnum(str, enum.Enum):
    active = "active"
    past_due = "past_due"
    cancelled = "cancelled"
    expired = "expired"
    suspended = "suspended"


class UsageStatusEnum(str, enum.Enum):
    reserved = "reserved"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"


class UserEntitlement(BaseModel):
    """
    Centralized entitlement record.
    Tracks plan tier, free usage quotas (3 complimentary uses), and active paid entitlements.
    """
    __tablename__ = "user_entitlements"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    plan: Mapped[str] = mapped_column(String, nullable=False, default="free")
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")

    free_usage_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    free_usage_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    paid_credits: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    dodo_customer_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    dodo_subscription_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)

    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_entitlements_org_plan", "org_id", "plan"),
        Index("idx_entitlements_customer", "dodo_customer_id"),
    )


class UsageEvent(BaseModel):
    """
    Idempotent audit ledger for metered operations.
    Guarantees once-and-only-once credit consumption for expensive compilation & audit pipelines.
    """
    __tablename__ = "usage_events"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    operation_type: Mapped[str] = mapped_column(String, nullable=False)  # "regulation_compilation", "framework_ingestion", "website_audit"
    operation_id: Mapped[str] = mapped_column(String, nullable=False, index=True)  # Unique request/operation ID for strict idempotency
    source: Mapped[str | None] = mapped_column(String, nullable=True, default="web_upload")

    status: Mapped[str] = mapped_column(String, nullable=False, default="reserved")  # reserved, completed, failed, refunded
    credits_consumed: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    meta_data: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

    __table_args__ = (
        UniqueConstraint("org_id", "operation_id", name="uq_usage_events_org_operation"),
        Index("idx_usage_events_created", "org_id", "created_at"),
    )


class PaymentTransaction(BaseModel):
    """
    Authoritative record of Dodo Payments transactions.
    Updated strictly via cryptographically verified Dodo Payments webhooks.
    """
    __tablename__ = "payment_transactions"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    dodo_payment_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    dodo_customer_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    dodo_product_id: Mapped[str | None] = mapped_column(String, nullable=True)

    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # in smallest currency unit / cents
    currency: Mapped[str] = mapped_column(String, nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # succeeded, failed, refunded, pending
    payment_type: Mapped[str | None] = mapped_column(String, nullable=True, default="one_time")

    meta_data: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_payment_org_status", "org_id", "status"),
    )


class WebhookEvent(BaseModel):
    """
    Idempotent ledger for incoming webhook deliveries.
    Prevents replay attacks and duplicate credit grants on retried webhook dispatches.
    """
    __tablename__ = "webhook_events"

    provider: Mapped[str] = mapped_column(String, nullable=False, default="dodo")
    event_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False, default="received")  # received, processed, ignored, failed
    payload_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    error: Mapped[str | None] = mapped_column(String, nullable=True)

    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event"),
    )
