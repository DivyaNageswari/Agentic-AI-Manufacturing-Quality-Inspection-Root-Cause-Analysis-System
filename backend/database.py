"""
Database Layer: SQLAlchemy Models with PostgreSQL and SQLite Fallback.
Stores production batches, sensor telemetries, inspection findings,
incidents, RCA analyses, and human approval audit logs.
"""

import os
from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# Read DATABASE_URL or fallback to local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quality_inspection.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProductionBatchModel(Base):
    __tablename__ = "production_batches"

    id = Column(String, primary_key=True, index=True)
    batch_number = Column(String, unique=True, index=True)
    product_code = Column(String, index=True)
    line_id = Column(String)
    operator_id = Column(String)
    total_units = Column(Integer, default=0)
    passed_units = Column(Integer, default=0)
    quarantined_units = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class QualityIncidentModel(Base):
    __tablename__ = "quality_incidents"

    id = Column(String, primary_key=True, index=True)
    incident_code = Column(String, unique=True, index=True)
    batch_id = Column(String, index=True)
    severity = Column(String, default="MEDIUM")
    status = Column(String, default="OPEN")
    title = Column(String)
    description = Column(Text)
    observed_facts = Column(JSON)
    immediate_containment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class HumanApprovalAuditModel(Base):
    __tablename__ = "human_approval_audits"

    id = Column(String, primary_key=True, index=True)
    entity_id = Column(String, index=True)
    entity_type = Column(String)  # BATCH, INCIDENT, CAPA
    approved_by = Column(String)
    license_badge_id = Column(String)
    action = Column(String)
    notes = Column(Text)
    digital_signature = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
