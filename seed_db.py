"""
Seed the MargDarshak database with REAL YOLO detection data from the M6 Full Video Test.

Reads M1 (road damage) and M2 (waterlogging) detection CSVs, clusters detections
into 50m road segments, picks the highest-confidence representative per
(segment, defect_class) cluster, and inserts them as tickets.

Replaces all previous mock/demo data.
"""
import csv
import math
import time
from datetime import datetime, timezone
from pathlib import Path

from database import get_db_session, TicketModel, init_db, haversine_distance

# --- Configuration ---
M6_DIR = Path(__file__).parent / "M6_Full_Video_Test"
DETECTION_FILES = [
    M6_DIR / "detections" / "M1" / "M1_full_video_detections.csv",
    M6_DIR / "detections" / "M2" / "M2_full_video_detections.csv",
]
CLUSTER_DISTANCE_M = 100.0  # meters per road segment


def _human_problem_name(class_name: str) -> str:
    """Longitudinal_Crack -> Longitudinal Crack"""
    return class_name.replace("_", " ")


def _load_detections() -> list[dict]:
    """Load all detection rows from M1 and M2 CSVs."""
    rows = []
    for csv_path in DETECTION_FILES:
        if not csv_path.exists():
            print(f"[!] Skipping missing file: {csv_path}")
            continue
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                try:
                    rows.append({
                        "model": r["model"],
                        "class_name": r["class_name"],
                        "confidence": float(r["confidence"]),
                        "latitude": float(r["latitude"]),
                        "longitude": float(r["longitude"]),
                        "video_time_sec": float(r["video_time_sec"]),
                        "wall_clock_ist": r.get("wall_clock_ist", ""),
                        "video_id": r.get("video_id", "V1"),
                    })
                except (ValueError, KeyError):
                    continue
    return rows


def _compute_cumulative_distances(rows: list[dict]) -> list[dict]:
    """
    Sort detections by video_time_sec (chronological order along the route),
    then compute cumulative route distance in meters using haversine between
    consecutive GPS points.
    """
    rows.sort(key=lambda r: (r["video_id"], r["video_time_sec"]))

    if not rows:
        return rows

    rows[0]["cum_dist"] = 0.0
    for i in range(1, len(rows)):
        prev = rows[i - 1]
        curr = rows[i]
        # Reset distance counter on new video segment
        if curr["video_id"] != prev["video_id"]:
            # Carry over distance from end of previous video
            curr["cum_dist"] = prev["cum_dist"] + haversine_distance(
                prev["latitude"], prev["longitude"],
                curr["latitude"], curr["longitude"],
            )
        else:
            curr["cum_dist"] = prev["cum_dist"] + haversine_distance(
                prev["latitude"], prev["longitude"],
                curr["latitude"], curr["longitude"],
            )
    return rows


def _cluster_detections(rows: list[dict]) -> list[dict]:
    """
    Cluster detections by 100m segment.
    ONE ticket per segment listing all defect types found.
    """
    # Group all detections by segment
    segments: dict[int, list[dict]] = {}
    for r in rows:
        seg_id = int(r["cum_dist"] // CLUSTER_DISTANCE_M)
        segments.setdefault(seg_id, []).append(r)

    results = []
    for seg_id, members in sorted(segments.items()):
        # Collect unique defect classes with their best confidence
        class_best: dict[str, dict] = {}
        for m in members:
            name = _human_problem_name(m["class_name"])
            if name not in class_best or m["confidence"] > class_best[name]["confidence"]:
                class_best[name] = m

        # Build combined problem string listing all issues
        issue_names = sorted(class_best.keys())
        problem = ", ".join(issue_names)

        # Use the highest-confidence detection overall for location
        best = max(members, key=lambda m: m["confidence"])

        results.append({
            "segment_id": seg_id,
            "problem": problem,
            "confidence": best["confidence"],
            "latitude": best["latitude"],
            "longitude": best["longitude"],
            "votes": len(members),
            "issue_count": len(issue_names),
            "cum_dist": best["cum_dist"],
        })

    return results


def seed_from_m6_detections():
    """Main entry: clear DB, ingest clustered M6 detection data."""
    init_db()
    session = get_db_session()

    try:
        # 1. Load raw detections
        raw = _load_detections()
        print(f"[*] Loaded {len(raw)} raw detections from M6 Full Video Test")

        if not raw:
            print("[!] No detection data found. Aborting seed.")
            return

        # 2. Compute cumulative route distances
        raw = _compute_cumulative_distances(raw)

        # 3. Cluster by 100m segments (one ticket per segment)
        clustered = _cluster_detections(raw)
        print(f"[*] Clustered into {len(clustered)} tickets ({CLUSTER_DISTANCE_M}m segments, one ticket per segment)")

        # 4. Clear old tickets
        deleted = session.query(TicketModel).delete()
        session.commit()
        print(f"[*] Cleared {deleted} existing tickets from database")

        # 5. Insert clustered tickets
        now_epoch = time.time()
        iso_now = datetime.now(timezone.utc).isoformat()

        from ticket_manager import ticket_manager

        for i, c in enumerate(clustered):
            ticket_id = f"TICK-{1001 + i}"

            # Dynamically map responsible CMC officer based on GPS coordinates
            officer = ticket_manager._assign_municipal_officers(session, c["latitude"], c["longitude"], c["problem"])

            # SLA deadlines: T+3, T+5, T+7
            t3_deadline = now_epoch + (3 * 86400)
            t5_deadline = now_epoch + (5 * 86400)
            t7_deadline = now_epoch + (7 * 86400)

            ticket = TicketModel(
                id=ticket_id,
                problem=c["problem"],
                confidence=round(c["confidence"], 4),
                latitude=c["latitude"],
                longitude=c["longitude"],
                votes=c["votes"],
                status="FILED",
                assigned_officer_name=officer["assigned_officer_name"],
                assigned_officer_designation=officer["assigned_officer_designation"],
                assigned_officer_email=officer["assigned_officer_email"],
                assigned_officer_phone=officer["assigned_officer_phone"],
                assigned_zone=officer["assigned_zone"],
                assigned_circle=officer["assigned_circle"],
                escalation_officer_name=officer["escalation_officer_name"],
                escalation_officer_designation=officer["escalation_officer_designation"],
                escalation_officer_email=officer["escalation_officer_email"],
                contractor_email=officer["assigned_officer_email"],
                escalation_email=officer["escalation_officer_email"],
                created_at=iso_now,
                created_timestamp=now_epoch,
                sla_t3_intake_deadline=t3_deadline,
                sla_t5_response_deadline=t5_deadline,
                sla_t7_resolution_deadline=t7_deadline,
                sla_deadline_timestamp=t7_deadline,
                current_sla_stage="T_INTAKE",
                last_voted_at=iso_now,
            )
            session.add(ticket)

        session.commit()
        print(f"[+] Successfully seeded {len(clustered)} real M6 detection tickets!")
        print(f"    Models: M1 (road damage), M2 (waterlogging)")
        print(f"    Clustering: {CLUSTER_DISTANCE_M}m road segments (one ticket per segment)")

        # Summary stats
        total_votes = sum(c["votes"] for c in clustered)
        print(f"\n    --- Ticket Breakdown ---")
        for c in clustered:
            print(f"    TICK-{1001 + clustered.index(c)}: {c['problem']} ({c['votes']} detections)")
        print(f"    Total raw detections absorbed: {total_votes}")

    finally:
        session.close()


if __name__ == "__main__":
    seed_from_m6_detections()
