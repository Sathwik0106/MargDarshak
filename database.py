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
    status = Column(String(50), default="ASSIGNED_TO_CONTRACTOR", index=True)
    contractor_email = Column(String(255), default=CONTRACTOR_EMAIL)
    escalation_email = Column(String(255), default=ESCALATION_EMAIL)

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


def _is_database_reachable(url: str, timeout_sec: float = 0.5) -> bool:
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


def ticket_to_dict(ticket: TicketModel) -> Dict[str, Any]:
    """Serializes TicketModel to JSON dictionary format matching dashboard expectations."""
    now = time.time()
    remaining_sla = max(0.0, ticket.sla_deadline_timestamp - now) if ticket.sla_deadline_timestamp else 0.0

    evidence_url = f"{SERVER_BASE_URL}/api/images/{ticket.evidence_image_filename}" if ticket.evidence_image_filename else None
    proof_url = f"{SERVER_BASE_URL}/api/images/{ticket.proof_image_filename}" if ticket.proof_image_filename else None

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
        "contractor_email": ticket.contractor_email,
        "escalation_email": ticket.escalation_email,
        "created_at": ticket.created_at,
        "created_timestamp": ticket.created_timestamp,
        "sla_deadline_timestamp": ticket.sla_deadline_timestamp,
        "sla_remaining_seconds": round(remaining_sla, 1),
        "last_voted_at": ticket.last_voted_at,
        "plan_of_action": ticket.plan_of_action,
        "contractor_responded_at": ticket.contractor_responded_at,
        "resolved_at": ticket.resolved_at,
        "resolution_summary": ticket.resolution_summary,
        "evidence_image_filename": ticket.evidence_image_filename,
        "proof_image_filename": ticket.proof_image_filename,
        "evidence_image_url": evidence_url,
        "proof_image_url": proof_url,
        # Backwards compatibility fields for modal
        "image_bytes": evidence_url,
        "proof_image_bytes": proof_url,
        "is_escalated": ticket.is_escalated,
        "escalated_at": ticket.escalated_at,
        "escalation_reason": ticket.escalation_reason,
        "timestamp_sec": ticket.timestamp_sec,
    }
