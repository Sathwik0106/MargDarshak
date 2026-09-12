import os
import time
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Text,
    Index,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from config import (
    DATABASE_URL,
    SLA_TIMEOUT_SECONDS,
    CONTRACTOR_EMAIL,
    ESCALATION_EMAIL,
    SERVER_BASE_URL,
    EVIDENCE_DIR,
)

Base = declarative_base()

# Check if PostGIS extension can be imported
HAS_GEOALCHEMY = False
try:
    from geoalchemy2 import Geometry
    from geoalchemy2.functions import ST_DWithin, ST_SetSRID, ST_MakePoint, ST_GeographyFromText
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False


class OfficerModel(Base):
    """
    Municipal Personnel & Zonal Hierarchy Directory (from GHMC official contact records).
    """
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_wing = Column(String(100), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    designation = Column(String(150), nullable=False)
    department = Column(String(150), nullable=True)
    zone = Column(String(100), nullable=True, index=True)
    circle = Column(String(100), nullable=True, index=True)
    constituency = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    contact_number = Column(String(50), nullable=True)
    email_id = Column(String(150), nullable=True, index=True)


class TicketModel(Base):
    """
    Relational SQL Model for Road Defect Tickets.
    Compatible with PostgreSQL (with PostGIS spatial indexing) and SQLite.
    """
    __tablename__ = "tickets"

    id = Column(String(50), primary_key=True)
    problem = Column(String(100), nullable=False, index=True)
    confidence = Column(Float, nullable=False, default=0.0)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)

    votes = Column(Integer, default=1, index=True)
    # Status progression: FILED -> INTAKE_COMPLETED -> IN_PROGRESS -> RESOLVED / ESCALATED_ZONAL
    status = Column(String(50), default="FILED", index=True)
    contractor_email = Column(String(255), default=CONTRACTOR_EMAIL)
    escalation_email = Column(String(255), default=ESCALATION_EMAIL)

    # Real Assigned Officer & Zonal Higher Authority from GHMC CSV
    assigned_officer_name = Column(String(150), nullable=True)
    assigned_officer_designation = Column(String(150), nullable=True)
    assigned_officer_email = Column(String(150), nullable=True, index=True)
    assigned_officer_phone = Column(String(50), nullable=True)
    assigned_zone = Column(String(100), nullable=True)
    assigned_circle = Column(String(100), nullable=True)

    escalation_officer_name = Column(String(150), nullable=True)
    escalation_officer_designation = Column(String(150), nullable=True)
    escalation_officer_email = Column(String(150), nullable=True, index=True)

    # T+3, T+5, T+7 SLA Milestones
    sla_t3_intake_deadline = Column(Float, nullable=True)      # T + 3 days (Intake & Triage)
    sla_t5_response_deadline = Column(Float, nullable=True)    # T + 5 days (Officer / Contractor Plan of Action)
    sla_t7_resolution_deadline = Column(Float, nullable=True)  # T + 7 days (Final Resolution or Escalation)
    intake_completed_at = Column(String(50), nullable=True)
    current_sla_stage = Column(String(50), default="T_INTAKE", index=True) # T_INTAKE | T_RESPONSE | T_RESOLUTION | RESOLVED | ESCALATED

    created_at = Column(String(50), nullable=False)
    created_timestamp = Column(Float, nullable=False, default=time.time)
    sla_deadline_timestamp = Column(Float, nullable=False)
    last_voted_at = Column(String(50), nullable=False)

    plan_of_action = Column(Text, nullable=True)
    contractor_responded_at = Column(String(50), nullable=True)
    resolved_at = Column(String(50), nullable=True)
    resolution_summary = Column(Text, nullable=True)

    # Disk-stored image filenames (offloaded from database)
    evidence_image_filename = Column(String(255), nullable=True)
    proof_image_filename = Column(String(255), nullable=True)

    # Escalation tracking
    is_escalated = Column(Boolean, default=False, index=True)
    escalated_at = Column(String(50), nullable=True)
    escalation_reason = Column(Text, nullable=True)

    timestamp_sec = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_tickets_coords", "latitude", "longitude"),
        Index("idx_tickets_status_sla", "status", "sla_deadline_timestamp"),
    )


# ---------------------------------------------------------------------------
# Database Engine Initialization with PostGIS & SQLite Graceful Fallback
# ---------------------------------------------------------------------------
USE_POSTGIS = False
engine = None
SessionLocal = None


def _is_database_reachable(url: str, timeout_sec: float = 3.0) -> bool:
    """Fast socket test to check if PostgreSQL port is actively open without hanging."""
    try:
        import socket
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout_sec)
            s.connect((host, port))
            return True
    except Exception:
        return False


def init_db():
    global engine, SessionLocal, USE_POSTGIS

    target_url = DATABASE_URL
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif target_url.startswith("postgresql://"):
        target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    is_postgres = target_url.startswith("postgresql")

    if is_postgres and _is_database_reachable(target_url):
        try:
            print(f"[*] Attempting connection to PostgreSQL: {target_url.split('@')[-1] if '@' in target_url else target_url}")
            test_engine = create_engine(target_url, pool_pre_ping=True)
            with test_engine.connect() as conn:
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                    conn.commit()
                    res = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                    print(f"[+] Connected to PostgreSQL with PostGIS ({res})!")
                    USE_POSTGIS = True
                except Exception as e:
                    print(f"[*] Connected to PostgreSQL (PostGIS extension notice: {e})")
                    USE_POSTGIS = False

            engine = test_engine
        except Exception as e:
            print(f"[!] PostgreSQL connection error ({e}). Falling back to SQLite.")
            engine = None
    elif is_postgres:
        print("[!] PostgreSQL port is not currently responding.")
        print("[!] Seamlessly activating persistent spatial database (SQLite: margdarshak.db).")
        engine = None

    if engine is None:
        # SQLite persistent fallback
        sqlite_path = Path(__file__).parent / "margdarshak.db"
        sqlite_url = f"sqlite:///{sqlite_path.as_posix()}"
        print(f"[+] Initializing persistent database at: {sqlite_url}")
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        USE_POSTGIS = False

    if USE_POSTGIS and HAS_GEOALCHEMY and not hasattr(TicketModel, "geom"):
        setattr(TicketModel, "geom", Column(Geometry("POINT", srid=4326, spatial_index=True), nullable=True))

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables and spatial indices verified.")


def get_db_session() -> Session:
    if SessionLocal is None:
        init_db()
    return SessionLocal()


# ---------------------------------------------------------------------------
# Spatial Utilities & Model Conversion
# ---------------------------------------------------------------------------
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in meters between two coordinates."""
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def officer_to_dict(officer: OfficerModel) -> Dict[str, Any]:
    """Serializes OfficerModel to dictionary."""
    return {
        "id": officer.id,
        "category_wing": officer.category_wing,
        "name": officer.name,
        "designation": officer.designation,
        "department": officer.department,
        "zone": officer.zone,
        "circle": officer.circle,
        "constituency": officer.constituency,
        "address": officer.address,
        "contact_number": officer.contact_number,
        "email_id": officer.email_id,
    }


def ticket_to_dict(ticket: TicketModel) -> Dict[str, Any]:
    """Serializes TicketModel to JSON dictionary format matching dashboard expectations."""
    now = time.time()
    
    # Milestone deadlines (T+3, T+5, T+7)
    created_ts = ticket.created_timestamp or now
    t3_deadline = ticket.sla_t3_intake_deadline or (created_ts + 3 * 86400)
    t5_deadline = ticket.sla_t5_response_deadline or (created_ts + 5 * 86400)
    t7_deadline = ticket.sla_t7_resolution_deadline or ticket.sla_deadline_timestamp or (created_ts + 7 * 86400)

    t3_remaining = max(0.0, t3_deadline - now)
    t5_remaining = max(0.0, t5_deadline - now)
    t7_remaining = max(0.0, t7_deadline - now)

    # Active countdown for current stage
    if ticket.status == "FILED":
        active_remaining_sla = t3_remaining
        stage_label = "T+3 Intake"
    elif ticket.status == "INTAKE_COMPLETED":
        active_remaining_sla = t5_remaining
        stage_label = "T+5 Action Plan"
    elif ticket.status == "IN_PROGRESS":
        active_remaining_sla = t7_remaining
        stage_label = "T+7 Resolution"
    elif ticket.status == "RESOLVED":
        active_remaining_sla = 0.0
        stage_label = "Resolved"
    else:  # ESCALATED_ZONAL
        active_remaining_sla = 0.0
        stage_label = "SLA Breached"

    evidence_url = f"{SERVER_BASE_URL}/api/images/{ticket.evidence_image_filename}" if ticket.evidence_image_filename else None
    proof_url = f"{SERVER_BASE_URL}/api/images/{ticket.proof_image_filename}" if ticket.proof_image_filename else None

    # Assigned officer fallback for display
    assigned_email = ticket.assigned_officer_email or ticket.contractor_email or "dc14b.ghmc@gmail.com"
    assigned_name = ticket.assigned_officer_name or "G Anjaneyulu"
    assigned_desig = ticket.assigned_officer_designation or "DEPUTY COMMISSIONER"
    escalation_email = ticket.escalation_officer_email or ticket.escalation_email or "zc.west.ghmc@gmail.com"
    escalation_name = ticket.escalation_officer_name or "Sri Narayan Amit Malempati IAS"

    return {
        "id": ticket.id,
        "problem": ticket.problem,
        "confidence": ticket.confidence,
        "location": {
            "latitude": ticket.latitude,
            "longitude": ticket.longitude,
        },
        "votes": ticket.votes,
        "status": ticket.status,
        
        # Real GHMC Officer Contacts
        "assigned_officer_name": assigned_name,
        "assigned_officer_designation": assigned_desig,
        "assigned_officer_email": assigned_email,
        "assigned_officer_phone": ticket.assigned_officer_phone or "8008103667",
        "assigned_zone": ticket.assigned_zone or "Kukatpally",
        "assigned_circle": ticket.assigned_circle or "Kukatpally",
        "escalation_officer_name": escalation_name,
        "escalation_officer_designation": ticket.escalation_officer_designation or "Zonal Commissioner",
        "escalation_officer_email": escalation_email,
        
        # Backwards compatibility fields
        "contractor_email": assigned_email,
        "escalation_email": escalation_email,
        
        "created_at": ticket.created_at,
        "created_timestamp": ticket.created_timestamp,
        "sla_deadline_timestamp": t7_deadline,
        "sla_remaining_seconds": round(t7_remaining, 1),
        
        # T+3, T+5, T+7 Timers
        "sla_t3_intake_deadline": t3_deadline,
        "sla_t5_response_deadline": t5_deadline,
        "sla_t7_resolution_deadline": t7_deadline,
        "t3_remaining_seconds": round(t3_remaining, 1),
        "t5_remaining_seconds": round(t5_remaining, 1),
        "t7_remaining_seconds": round(t7_remaining, 1),
        "active_remaining_seconds": round(active_remaining_sla, 1),
        "stage_label": stage_label,
        "current_sla_stage": ticket.current_sla_stage or "T_INTAKE",
        "intake_completed_at": ticket.intake_completed_at,
        
        "last_voted_at": ticket.last_voted_at,
        "plan_of_action": ticket.plan_of_action,
        "contractor_responded_at": ticket.contractor_responded_at,
        "resolved_at": ticket.resolved_at,
        "resolution_summary": ticket.resolution_summary,
        "evidence_image_filename": ticket.evidence_image_filename,
        "proof_image_filename": ticket.proof_image_filename,
        "evidence_image_url": evidence_url,
        "proof_image_url": proof_url,
        "image_bytes": evidence_url,
        "proof_image_bytes": proof_url,
        "is_escalated": ticket.is_escalated,
        "escalated_at": ticket.escalated_at,
        "escalation_reason": ticket.escalation_reason,
        "timestamp_sec": ticket.timestamp_sec,
    }
