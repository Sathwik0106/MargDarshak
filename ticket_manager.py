import math
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from email_service import notify_ticket_assigned, notify_ticket_escalated, CONTRACTOR_EMAIL, ESCALATION_EMAIL


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two coordinates."""
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


class TicketManager:
    """
    Manages the lifecycle of road defect tickets:
    - Voting system (increments votes when detected again within 7m)
    - Auto-assignment to Ward Contractor (abhimanu6729@gmail.com)
    - Contractor responses (plans of action, status updates)
    - Resolution with uploaded photo proof
    - Automated SLA escalation to Higher Authority (lingarajusaikumar@gmail.com)
    """

    def __init__(self, proximity_threshold_meters: float = 7.0, sla_timeout_seconds: float = 24 * 3600):
        self.tickets: List[Dict] = []
        self.proximity_threshold_meters = proximity_threshold_meters
        self.sla_timeout_seconds = sla_timeout_seconds
        self._next_id = 1001

    def find_active_ticket_near(self, problem: str, lat: float, lon: float) -> Optional[Dict]:
        """
        Finds an open/active ticket of the same problem within the proximity radius.
        """
        for ticket in self.tickets:
            if ticket["status"] in ["RESOLVED", "CLOSED"]:
                continue
            if ticket["problem"].lower() == problem.lower():
                dist = haversine_distance(
                    lat, lon,
                    ticket["location"]["latitude"],
                    ticket["location"]["longitude"],
                )
                if dist <= self.proximity_threshold_meters:
                    return ticket
        return None

    def process_detection(
        self,
        problem: str,
        confidence: float,
        location: Dict[str, float],
        image_bytes: str,
        timestamp_sec: Optional[float] = None,
    ) -> Dict:
        """
        Processes a detection:
        - If existing ticket within 7m: Votes it up (+1 vote).
        - If new: Creates a master ticket and sends email to the Ward Contractor.
        """
        lat = location.get("latitude") or location.get("lat")
        lon = location.get("longitude") or location.get("lon")

        existing_ticket = self.find_active_ticket_near(problem, lat, lon)

        if existing_ticket:
            # Increment votes (Priority system)
            existing_ticket["votes"] += 1
            existing_ticket["last_voted_at"] = datetime.now(timezone.utc).isoformat()
            if confidence > existing_ticket.get("confidence", 0):
                existing_ticket["confidence"] = confidence
                existing_ticket["image_bytes"] = image_bytes

            print(
                f"[*] [TICKET VOTE +1] Ticket #{existing_ticket['id']} ({problem}) "
                f"now has {existing_ticket['votes']} vote(s)!"
            )
            return {"action": "voted", "ticket": existing_ticket}

        # Create New Master Ticket
        ticket_id = f"TICK-{self._next_id}"
        self._next_id += 1

        new_ticket = {
            "id": ticket_id,
            "problem": problem,
            "confidence": confidence,
            "location": {"latitude": lat, "longitude": lon},
            "votes": 1,
            "status": "ASSIGNED_TO_CONTRACTOR",
            "contractor_email": CONTRACTOR_EMAIL,
            "escalation_email": ESCALATION_EMAIL,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_timestamp": time.time(),
            "last_voted_at": datetime.now(timezone.utc).isoformat(),
            "plan_of_action": None,
            "contractor_responded_at": None,
            "resolved_at": None,
            "resolution_summary": None,
            "proof_image_bytes": None,  # Uploaded by contractor as repair proof
            "image_bytes": image_bytes,  # Camera detection image (Before)
            "timestamp_sec": timestamp_sec,
        }

        self.tickets.append(new_ticket)
        print(f"[+] [NEW TICKET GENERATED] #{ticket_id} for '{problem}' at ({lat}, {lon})")

        # Dispatch Email Notification to Ward Contractor
        try:
            notify_ticket_assigned(new_ticket)
        except Exception as e:
            print(f"[!] Warning: Email notification dispatch error: {e}")

        return {"action": "created", "ticket": new_ticket}

    def update_plan_of_action(self, ticket_id: str, plan_of_action: str, status: str = "IN_PROGRESS") -> Optional[Dict]:
        """
        Updates the contractor's plan of action and current status.
        """
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        ticket["plan_of_action"] = plan_of_action
        ticket["status"] = status
        ticket["contractor_responded_at"] = datetime.now(timezone.utc).isoformat()
        print(f"[*] Updated Plan of Action for #{ticket_id} (Status: {status}): '{plan_of_action}'")
        return ticket

    def resolve_ticket_with_proof(
        self, ticket_id: str, what_was_done: str, proof_image_base64: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Marks the ticket as solved with contractor's repair summary and uploaded image proof.
        """
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        ticket["status"] = "RESOLVED"
        ticket["resolved_at"] = datetime.now(timezone.utc).isoformat()
        ticket["resolution_summary"] = what_was_done
        if proof_image_base64:
            ticket["proof_image_bytes"] = proof_image_base64

        print(f"[+] Ticket #{ticket_id} RESOLVED with proof! Action: '{what_was_done}'")
        return ticket

    def escalate_ticket(self, ticket_id: str, reason: str = "SLA expired without contractor response") -> Optional[Dict]:
        """
        Escalates the ticket to higher authority (lingarajusaikumar@gmail.com) and sends alert.
        """
        ticket = self.get_ticket(ticket_id)
        if not ticket:
            return None

        ticket["status"] = "ESCALATED_ZONAL"
        ticket["escalated_at"] = datetime.now(timezone.utc).isoformat()
        ticket["escalation_reason"] = reason

        print(f"[!] Escalating Ticket #{ticket_id} to Higher Authority ({ESCALATION_EMAIL})...")
        try:
            notify_ticket_escalated(ticket)
        except Exception as e:
            print(f"[!] Escalation email error: {e}")

        return ticket

    def get_ticket(self, ticket_id: str) -> Optional[Dict]:
        for t in self.tickets:
            if t["id"].lower() == ticket_id.lower():
                return t
        return None

    def get_all_tickets(self) -> List[Dict]:
        return self.tickets


# Global Singleton
ticket_manager = TicketManager()
