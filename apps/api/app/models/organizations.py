import enum
import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel

class PlanEnum(str, enum.Enum):
    trial = "trial"
    standard = "standard"
    enterprise = "enterprise"

class RoleEnum(str, enum.Enum):
    admin = "admin"
    compliance_officer = "compliance_officer"
    developer = "developer"
    legal_counsel = "legal_counsel"
    auditor = "auditor"

class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String, nullable=False)
    plan: Mapped[PlanEnum] = mapped_column(nullable=False)

    users: Mapped[list["User"]] = relationship("User", back_populates="organization")


class User(BaseModel):
    __tablename__ = "users"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    clerk_user_id: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    role: Mapped[RoleEnum] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
