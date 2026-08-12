import enum
import uuid
from datetime import date, datetime
from sqlalchemy import String, ForeignKey, Date, DateTime, JSON, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from .base import BaseModel

class FileTypeEnum(str, enum.Enum):
    pdf = "pdf"
    html = "html"

class Regulation(BaseModel):
    __tablename__ = "regulations"

    name: Mapped[str] = mapped_column(String, nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_known_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # We will use string to avoid circular dependency in declaration, or foreign_keys
    current_version_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regulation_versions.id"), nullable=True)

    versions: Mapped[list["RegulationVersion"]] = relationship("RegulationVersion", back_populates="regulation", foreign_keys="RegulationVersion.regulation_id")


class RegulationVersion(BaseModel):
    __tablename__ = "regulation_versions"

    regulation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("regulations.id", ondelete="CASCADE"), nullable=False, index=True)
    version_label: Mapped[str] = mapped_column(String, nullable=False)
    published_date: Mapped[date] = mapped_column(Date, nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source_document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("source_documents.id"), nullable=False)
    diff_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    regulation: Mapped["Regulation"] = relationship("Regulation", back_populates="versions", foreign_keys=[regulation_id])


class SourceDocument(BaseModel):
    __tablename__ = "source_documents"

    regulation_version_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regulation_versions.id", ondelete="CASCADE"), nullable=True, index=True)
    file_type: Mapped[FileTypeEnum] = mapped_column(nullable=False)
    storage_path: Mapped[str] = mapped_column(String, nullable=False)
    raw_text: Mapped[str] = mapped_column(String, nullable=False)
    ocr_used: Mapped[bool] = mapped_column(Boolean, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False)

    sections: Mapped[list["DocumentSection"]] = relationship("DocumentSection", back_populates="source_document")


class DocumentSection(BaseModel):
    __tablename__ = "document_sections"

    source_document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_label: Mapped[str] = mapped_column(String, nullable=False)
    raw_text: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    source_document: Mapped["SourceDocument"] = relationship("SourceDocument", back_populates="sections")
