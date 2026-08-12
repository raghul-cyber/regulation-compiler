import enum
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Numeric, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from pgvector.sqlalchemy import Vector

from .base import BaseModel

class RequirementTypeEnum(str, enum.Enum):
    obligation = "obligation"
    prohibition = "prohibition"
    permission = "permission"

class SeverityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ValidationStatusEnum(str, enum.Enum):
    draft = "draft"
    pending_review = "pending_review"
    approved = "approved"
    enforceable = "enforceable"

class PolicyStatusEnum(str, enum.Enum):
    draft = "draft"
    deployed = "deployed"

class ComplianceResultEnum(str, enum.Enum):
    pass_ = "pass"
    fail = "fail"
    partial = "partial"


class Requirement(BaseModel):
    __tablename__ = "requirements"

    regulation_version_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("regulation_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("document_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[RequirementTypeEnum] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    conditions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    actions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    severity: Mapped[SeverityEnum] = mapped_column(nullable=False)
    evidence_required: Mapped[dict] = mapped_column(JSONB, nullable=False)
    references: Mapped[dict] = mapped_column(JSONB, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric, nullable=False)
    validation_status: Mapped[ValidationStatusEnum] = mapped_column(nullable=False)
    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta_data: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default='{}')

    __table_args__ = (
        Index("ix_requirements_version_severity_status", "regulation_version_id", "severity", "validation_status"),
        Index("ix_requirements_description_tsvector", "description", postgresql_using="gin", postgresql_ops={"description": "gin_trgm_ops"}),
    )


class Policy(BaseModel):
    __tablename__ = "policies"

    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    regulation_version_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("regulation_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    status: Mapped[PolicyStatusEnum] = mapped_column(nullable=False)
    deployed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ComplianceCheck(BaseModel):
    __tablename__ = "compliance_checks"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    policy_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("policies.id", ondelete="CASCADE"), nullable=False, index=True)
    input_payload_ref: Mapped[str] = mapped_column(String, nullable=False)
    result: Mapped[ComplianceResultEnum] = mapped_column(nullable=False)
    violations: Mapped[dict] = mapped_column(JSONB, nullable=False)


class SystemMapping(BaseModel):
    __tablename__ = "system_mappings"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    system_name: Mapped[str] = mapped_column(String, nullable=False)
    mapped_requirement_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)


class RequirementEmbedding(BaseModel):
    __tablename__ = "requirement_embeddings"
    
    # Override id to be the foreign key to requirement
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"), primary_key=True)
    embedding = mapped_column(Vector(768), nullable=False)
    model_used: Mapped[str] = mapped_column(String, nullable=False)

class ImpactRecord(BaseModel):
    __tablename__ = "impact_records"

    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    system_mapping_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("system_mappings.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    change_type: Mapped[str] = mapped_column(String, nullable=False) # 'modified' or 'removed'
    severity: Mapped[SeverityEnum] = mapped_column(nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
