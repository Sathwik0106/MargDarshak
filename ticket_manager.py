import base64
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from config import (
    SLA_TIMEOUT_SECONDS,
    CONTRACTOR_EMAIL,
    ESCALATION_EMAIL,
    EVIDENCE_DIR,
)
from database import (
    TicketModel,
    get_db_session,
    ticket_to_dict,
    haversine_distance,
    USE_POSTGIS,
    HAS_GEOALCHEMY,
)
from email_service import notify_ticket_assigned, notify_ticket_escalated

# Bounding box delta for ~15 meters (giving buffer around 7m)
# 1 deg latitude ~ 111,139 meters. 15m ~ 0.000135 deg.
# 1 deg longitude at 17 deg latitude ~ 106,000 meters. 15m ~ 0.000141 deg.
BOUNDING_BOX_DELTA_DEG = 0.00015


class TicketManager:
    """
    Production-Grade Ticket & SLA Manager:
    - Persistent Relational Database (PostgreSQL with PostGIS / persistent SQLite)
    - Sub-second Spatial Index Query (PostGIS ST_DWithin / Indexed Bounding Box)
    - Offloaded image storage (disk storage at data/evidence/ instead of base64 in DB)
    - Automated 48-Hour SLA countdown and auto-escalation daemon
    """

    def __init__(self, proximity_threshold_meters: float = 7.0):
        self.proximity_threshold_meters = proximity_threshold_meters

    def _save_image_to_disk(self, ticket_id: str, image_data: Any, suffix: str = "before") -> Optional[str]:
        """Saves image bytes/base64 to disk and returns the relative filename."""
        if not image_data:
            return None

        filename = f"{ticket_id}_{suffix}.jpg"
        target_path = EVIDENCE_DIR / filename

        try:
            if isinstance(image_data, bytes):
                target_path.write_bytes(image_data)
                return filename
            elif isinstance(image_data, str):
                if image_data.startswith("http://") or image_data.startswith("https://"):
                    return None
                b64_str = image_data.split(",", 1)[1] if "," in image_data else image_data
                img_bytes = base64.b64decode(b64_str)
                target_path.write_bytes(img_bytes)
                return filename
        except Exception as e:
            print(f"[!] Warning: Error saving evidence image to disk: {e}")
            return None
        return None

    def find_active_ticket_near(
        self, session: Session, problem: str, lat: float, lon: float
    ) -> Optional[TicketModel]:
        """
        Finds an existing open defect within 7 meters using Spatial Indexing:
        - PostGIS ST_DWithin if connected to PostgreSQL + PostGIS.
        - Indexed Bounding Box pre-filter + Haversine distance for O(log N) query performance.
        """
        # Exclude already resolved or closed tickets
        query = session.query(TicketModel).filter(
            TicketModel.status.not_in(["RESOLVED", "CLOSED"]),
            func.lower(TicketModel.problem) == problem.lower(),
        )

        if USE_POSTGIS and HAS_GEOALCHEMY:
            from geoalchemy2.functions import ST_DWithin, ST_SetSRID, ST_MakePoint
            point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
            # PostGIS ST_DWithin operates on geography in meters
            ticket = query.filter(
                ST_DWithin(TicketModel.geom, point, self.proximity_threshold_meters)
            ).first()
            if ticket:
                return ticket

        # Bounding-box spatial pre-filter using latitude & longitude B-Tree indices
        min_lat = lat - BOUNDING_BOX_DELTA_DEG
        max_lat = lat + BOUNDING_BOX_DELTA_DEG
        min_lon = lon - BOUNDING_BOX_DELTA_DEG
        max_lon = lon + BOUNDING_BOX_DELTA_DEG

        candidates = query.filter(
            TicketModel.latitude.between(min_lat, max_lat),
            TicketModel.longitude.between(min_lon, max_lon),
        ).all()

        for cand in candidates:
            dist = haversine_distance(lat, lon, cand.latitude, cand.longitude)
            if dist <= self.proximity_threshold_meters:
                return cand

        return None

    def process_detection(
        self,
        problem: str,
        confidence: float,
        location: Dict[str, float],
        image_bytes: Optional[Any] = None,
        timestamp_sec: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes an incoming detection:
        - If matching defect exists within 7m -> increments vote count (+1 priority).
        - If new -> creates TicketModel in database, persists evidence image to disk,
          and prepares notification for the contractor.
        """
        lat = float(location.get("latitude") or location.get("lat") or 17.3850)
        lon = float(location.get("longitude") or location.get("lon") or 78.4867)

        db = get_db_session()
        try:
            existing = self.find_active_ticket_near(db, problem, lat, lon)

            if existing:
                existing.votes += 1
                existing.last_voted_at = datetime.now(timezone.utc).isoformat()
                if confidence > (existing.confidence or 0.0):
                    existing.confidence = confidence
                    # Update disk image if new capture has higher confidence
                    if image_bytes:
                        self._save_image_to_disk(existing.id, image_bytes, suffix="before")

                db.commit()
                db.refresh(existing)
                print(
                    f"[*] [SPATIAL DEDUP VOTE +1] Ticket #{existing.id} ({problem}) "
                    f"now has {existing.votes} vote(s) (within 7m index)."
                )
                return {"action": "voted", "ticket": ticket_to_dict(existing), "is_new": False}

            # Generate new sequential ticket ID
            count = db.query(TicketModel).count()
            ticket_id = f"TICK-{1001 + count}"
            now_epoch = time.time()
            sla_deadline = now_epoch + SLA_TIMEOUT_SECONDS
            iso_now = datetime.now(timezone.utc).isoformat()

            # Save initial camera evidence to disk
            evidence_filename = self._save_image_to_disk(ticket_id, image_bytes, suffix="before")

            new_ticket = TicketModel(
                id=ticket_id,
                problem=problem,
                confidence=confidence,
                latitude=lat,
                longitude=lon,
                votes=1,
                status="ASSIGNED_TO_CONTRACTOR",
                contractor_email=CONTRACTOR_EMAIL,
                escalation_email=ESCALATION_EMAIL,
                created_at=iso_now,
                created_timestamp=now_epoch,
                sla_deadline_timestamp=sla_deadline,
                last_voted_at=iso_now,
                evidence_image_filename=evidence_filename,
                timestamp_sec=timestamp_sec,
            )

            # Assign PostGIS geometry point if enabled
            if USE_POSTGIS and HAS_GEOALCHEMY:
                from geoalchemy2.elements import WKTElement
                new_ticket.geom = WKTElement(f"POINT({lon} {lat})", srid=4326)

            db.add(new_ticket)
            db.commit()
            db.refresh(new_ticket)

            ticket_dict = ticket_to_dict(new_ticket)
            print(f"[+] [DATABASE NEW TICKET] #{ticket_id} created for '{problem}' at ({lat:.5f}, {lon:.5f})")

            return {"action": "created", "ticket": ticket_dict, "is_new": True}

        finally:
            db.close()

    def update_plan_of_action(
        self, ticket_id: str, plan_of_action: str, status: str = "IN_PROGRESS"
    ) -> Optional[Dict[str, Any]]:
        """Updates contractor's status and plan of action in persistent database."""
        db = get_db_session()
        try:
            ticket = db.query(TicketModel).filter(TicketModel.id.ilike(ticket_id)).first()
            if not ticket:
                return None

            ticket.plan_of_action = plan_of_action
            ticket.status = status
            ticket.contractor_responded_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            db.refresh(ticket)
            print(f"[*] Updated Plan of Action for #{ticket_id} (Status: {status})")
            return ticket_to_dict(ticket)
        finally:
            db.close()

    def resolve_ticket_with_proof(
        self, ticket_id: str, what_was_done: str, proof_image_data: Optional[Any] = None
    ) -> Optional[Dict[str, Any]]:
        """Marks ticket as RESOLVED with contractor's summary and uploaded proof image saved to disk."""
        db = get_db_session()
        try:
            ticket = db.query(TicketModel).filter(TicketModel.id.ilike(ticket_id)).first()
            if not ticket:
                return None

            proof_filename = self._save_image_to_disk(ticket.id, proof_image_data, suffix="proof")
            ticket.status = "RESOLVED"
            ticket.resolved_at = datetime.now(timezone.utc).isoformat()
            ticket.resolution_summary = what_was_done
            if proof_filename:
                ticket.proof_image_filename = proof_filename

            db.commit()
            db.refresh(ticket)
            print(f"[+] Ticket #{ticket_id} RESOLVED with proof! Summary: '{what_was_done}'")
            return ticket_to_dict(ticket)
        finally:
            db.close()

    def escalate_ticket(
        self, ticket_id: str, reason: str = "Manual/SLA escalation trigger"
    ) -> Optional[Dict[str, Any]]:
        """Escalates ticket to Zonal Higher Authority."""
        db = get_db_session()
        try:
            ticket = db.query(TicketModel).filter(TicketModel.id.ilike(ticket_id)).first()
            if not ticket:
                return None

            ticket.status = "ESCALATED_ZONAL"
            ticket.is_escalated = True
            ticket.escalated_at = datetime.now(timezone.utc).isoformat()
            ticket.escalation_reason = reason
            db.commit()
            db.refresh(ticket)

            ticket_dict = ticket_to_dict(ticket)
            return ticket_dict
        finally:
            db.close()

    def check_and_escalate_sla_breaches(self) -> List[Dict[str, Any]]:
        """
        Automated 48-Hour SLA Checker:
        Scans for active tickets whose 48-hour countdown has reached 0.
        Automatically updates status to ESCALATED_ZONAL and returns the escalated ticket list.
        """
        now = time.time()
        db = get_db_session()
        escalated_list = []
        try:
            # Query tickets where status is ASSIGNED_TO_CONTRACTOR or IN_PROGRESS and SLA deadline has passed
            breached_tickets = db.query(TicketModel).filter(
                TicketModel.status.in_(["ASSIGNED_TO_CONTRACTOR", "IN_PROGRESS"]),
                TicketModel.sla_deadline_timestamp <= now,
                TicketModel.is_escalated == False,
            ).all()

            for ticket in breached_tickets:
                ticket.status = "ESCALATED_ZONAL"
                ticket.is_escalated = True
                ticket.escalated_at = datetime.now(timezone.utc).isoformat()
                ticket.escalation_reason = "Automated 48-Hour SLA countdown reached 0 without resolution"

                ticket_dict = ticket_to_dict(ticket)
                escalated_list.append(ticket_dict)
                print(f"[!] [48-HR SLA BREACH] Auto-escalated Ticket #{ticket.id} ({ticket.problem}) to {ESCALATION_EMAIL}")

            if breached_tickets:
                db.commit()

            return escalated_list
        finally:
            db.close()

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        db = get_db_session()
        try:
            ticket = db.query(TicketModel).filter(TicketModel.id.ilike(ticket_id)).first()
            return ticket_to_dict(ticket) if ticket else None
        finally:
            db.close()

    def get_all_tickets(self) -> List[Dict[str, Any]]:
        db = get_db_session()
        try:
            tickets = db.query(TicketModel).order_by(TicketModel.created_timestamp.desc()).all()
            return [ticket_to_dict(t) for t in tickets]
        finally:
            db.close()


# Global Singleton Instance
ticket_manager = TicketManager()
