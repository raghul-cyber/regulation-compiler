import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel

class CustomerSystem(BaseModel):
    __tablename__ = "customer_systems"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    system_type: Mapped[str | None] = mapped_column(String, nullable=True)

    controls = relationship("CustomerControl", back_populates="system", cascade="all, delete-orphan")

class CustomerControl(BaseModel):
    __tablename__ = "customer_controls"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    system_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("customer_systems.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    control_type: Mapped[str | None] = mapped_column(String, nullable=True)

    system = relationship("CustomerSystem", back_populates="controls")
    evidence = relationship("CustomerEvidence", back_populates="control", cascade="all, delete-orphan")

class CustomerEvidence(BaseModel):
    __tablename__ = "customer_evidence"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    control_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customer_controls.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    control = relationship("CustomerControl", back_populates="evidence")
