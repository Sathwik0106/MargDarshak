import csv
import os
import time
from datetime import datetime, timezone
import database

def ingest_all():
    print("[*] Connecting to Aiven PostgreSQL and initializing schema...")
    database.init_db()
    session = database.SessionLocal()

    csv_path = r"C:\Users\manvi\OneDrive\Desktop\MargD1\contact_details.csv"
    if not os.path.exists(csv_path):
        print(f"[!] CSV file not found at: {csv_path}")
        return

    # 1. Ingest all 199 rows from contact_details.csv
    print("[*] Parsing and ingesting contact_details.csv into 'officers' table...")
    with open(csv_path, mode="r", encoding="utf-8-sig", errors="ignore") as f:
        reader = csv.DictReader(f)
        officers_added = 0
        for row in reader:
            try:
                row_id = int(row.get("ID", 0))
            except (ValueError, TypeError):
                continue

            officer = database.OfficerModel(
                id=row_id,
                category_wing=(row.get("Category_Wing") or "").strip(),
                name=(row.get("Name") or "").strip(),
                designation=(row.get("Designation") or "").strip(),
                department=(row.get("Department") or "").strip() or None,
                zone=(row.get("Zone") or "").strip() or None,
                circle=(row.get("Circle") or "").strip() or None,
                constituency=(row.get("Constituency") or "").strip() or None,
                address=(row.get("Address") or "").strip() or None,
                contact_number=(row.get("Contact_Number") or "").strip() or None,
                email_id=(row.get("Email_ID") or "").strip() or None,
            )
            session.merge(officer)
            officers_added += 1

        session.commit()
        print(f"[+] Successfully upserted {officers_added} municipal officers into Aiven PostgreSQL!")

    # 2. Update existing 17 tickets with real circle officers and T+3, T+5, T+7 milestones
    print("[*] Updating tickets with real GHMC personnel and T+3/T+5/T+7 SLA lifecycle...")
    now = time.time()
    
    # Real officer profiles extracted from CSV:
    officers_pool = {
        "Kukatpally": {
            "name": "G Anjaneyulu",
            "desig": "DEPUTY COMMISSIONER",
            "email": "dc14b.ghmc@gmail.com",
            "phone": "8008103667",
            "zone": "Kukatpally",
            "circle": "Kukatpally",
            "esc_name": "Sri Mayank Singh IAS",
            "esc_desig": "Zonal Commissioner (Kukatpally)",
            "esc_email": "zckz.ghmc@gmail.com",
        },
        "Serilingampally": {
            "name": "G.SRINIVAS",
            "desig": "DEPUTY COMMISSIONER",
            "email": "dc12.ghmc@gmail.com",
            "phone": "8985046462",
            "zone": "Serilingampally",
            "circle": "Miyapur",
            "esc_name": "Sri Narayan Amit Malempati IAS",
            "esc_desig": "Zonal Commissioner (Serilingampally / West)",
            "esc_email": "zc.west.ghmc@gmail.com",
        },
        "Quthbullapur": {
            "name": "D.Lavanya",
            "desig": "DEPUTY COMMISSIONER",
            "email": "dckompallyghmc@gmail.com",
            "phone": "8639601877",
            "zone": "Quthbullapur",
            "circle": "Kompally",
            "esc_name": "Sri Parmar Pinkeshkumar Lalitkumar, IAS",
            "esc_desig": "Zonal Commissioner (Quthbullapur)",
            "esc_email": "zcquthbullapur.ghmc@gmail.com",
        },
        "Patancheruvu": {
            "name": "Jyoti Reddy",
            "desig": "DEPUTY COMMISSIONER",
            "email": "dc13.ghmc@gmail.com",
            "phone": "7337302638",
            "zone": "Serilingampally",
            "circle": "Patancheruvu",
            "esc_name": "Sri Narayan Amit Malempati IAS",
            "esc_desig": "Zonal Commissioner (West)",
            "esc_email": "zc.west.ghmc@gmail.com",
        },
        "Nizampet": {
            "name": "Md.Saber Ali",
            "desig": "DEPUTY COMMISSIONER",
            "email": "dcnizampet.ghmc@gmail.com",
            "phone": "7729003999",
            "zone": "Quthbullapur",
            "circle": "Nizampet",
            "esc_name": "Sri Parmar Pinkeshkumar Lalitkumar, IAS",
            "esc_desig": "Zonal Commissioner (Quthbullapur)",
            "esc_email": "zcquthbullapur.ghmc@gmail.com",
        },
    }

    tickets = session.query(database.TicketModel).all()
    print(f"[*] Processing {len(tickets)} tickets...")

    zones_list = ["Kukatpally", "Serilingampally", "Quthbullapur", "Patancheruvu", "Nizampet"]

    for idx, t in enumerate(tickets):
        assigned_data = officers_pool[zones_list[idx % len(zones_list)]]
        
        t.assigned_officer_name = assigned_data["name"]
        t.assigned_officer_designation = assigned_data["desig"]
        t.assigned_officer_email = assigned_data["email"]
        t.assigned_officer_phone = assigned_data["phone"]
        t.assigned_zone = assigned_data["zone"]
        t.assigned_circle = assigned_data["circle"]
        
        t.escalation_officer_name = assigned_data["esc_name"]
        t.escalation_officer_designation = assigned_data["esc_desig"]
        t.escalation_officer_email = assigned_data["esc_email"]

        # Backwards compatibility fields
        t.contractor_email = assigned_data["email"]
        t.escalation_email = assigned_data["esc_email"]

        # Map to realistic T+3, T+5, T+7 status progression:
        # 1. RESOLVED tickets
        if t.status == "RESOLVED":
            t.created_timestamp = now - (8 * 86400)
            t.sla_t3_intake_deadline = t.created_timestamp + (3 * 86400)
            t.sla_t5_response_deadline = t.created_timestamp + (5 * 86400)
            t.sla_t7_resolution_deadline = t.created_timestamp + (7 * 86400)
            t.sla_deadline_timestamp = t.sla_t7_resolution_deadline
            t.current_sla_stage = "RESOLVED"
            t.intake_completed_at = datetime.fromtimestamp(t.created_timestamp + 86400, tz=timezone.utc).isoformat()
            t.contractor_responded_at = datetime.fromtimestamp(t.created_timestamp + (3.5 * 86400), tz=timezone.utc).isoformat()
            t.resolved_at = datetime.fromtimestamp(t.created_timestamp + (6 * 86400), tz=timezone.utc).isoformat()

        # 2. ESCALATED tickets (T+7 breached without resolution)
        elif t.status == "ESCALATED_ZONAL":
            t.created_timestamp = now - (9 * 86400)
            t.sla_t3_intake_deadline = t.created_timestamp + (3 * 86400)
            t.sla_t5_response_deadline = t.created_timestamp + (5 * 86400)
            t.sla_t7_resolution_deadline = t.created_timestamp + (7 * 86400)
            t.sla_deadline_timestamp = t.sla_t7_resolution_deadline
            t.current_sla_stage = "ESCALATED"
            t.is_escalated = True
            t.escalated_at = datetime.fromtimestamp(t.created_timestamp + (7.1 * 86400), tz=timezone.utc).isoformat()
            t.escalation_reason = "T+7 Statutory SLA breached. Automatically escalated to Zonal Commissioner."

        # 3. Active tickets partitioned across stages:
        elif idx % 3 == 0:
            # Stage 1: FILED (Day T to T+3: Intake phase, 1.5 days remaining until T+3)
            t.status = "FILED"
            t.created_timestamp = now - (1.5 * 86400)
            t.sla_t3_intake_deadline = t.created_timestamp + (3 * 86400)
            t.sla_t5_response_deadline = t.created_timestamp + (5 * 86400)
            t.sla_t7_resolution_deadline = t.created_timestamp + (7 * 86400)
            t.sla_deadline_timestamp = t.sla_t7_resolution_deadline
            t.current_sla_stage = "T_INTAKE"
            t.intake_completed_at = None
            t.plan_of_action = None

        elif idx % 3 == 1:
            # Stage 2: INTAKE_COMPLETED (Day T+3 to T+5: Response / Plan phase, 1 day remaining until T+5)
            t.status = "INTAKE_COMPLETED"
            t.created_timestamp = now - (3.8 * 86400)
            t.sla_t3_intake_deadline = t.created_timestamp + (3 * 86400)
            t.sla_t5_response_deadline = t.created_timestamp + (5 * 86400)
            t.sla_t7_resolution_deadline = t.created_timestamp + (7 * 86400)
            t.sla_deadline_timestamp = t.sla_t7_resolution_deadline
            t.current_sla_stage = "T_RESPONSE"
            t.intake_completed_at = datetime.fromtimestamp(t.created_timestamp + (2.2 * 86400), tz=timezone.utc).isoformat()

        else:
            # Stage 3: IN_PROGRESS (Day T+5 to T+7: Resolution phase, 1.2 days remaining until T+7)
            t.status = "IN_PROGRESS"
            t.created_timestamp = now - (5.6 * 86400)
            t.sla_t3_intake_deadline = t.created_timestamp + (3 * 86400)
            t.sla_t5_response_deadline = t.created_timestamp + (5 * 86400)
            t.sla_t7_resolution_deadline = t.created_timestamp + (7 * 86400)
            t.sla_deadline_timestamp = t.sla_t7_resolution_deadline
            t.current_sla_stage = "T_RESOLUTION"
            t.intake_completed_at = datetime.fromtimestamp(t.created_timestamp + (2.0 * 86400), tz=timezone.utc).isoformat()
            t.contractor_responded_at = datetime.fromtimestamp(t.created_timestamp + (4.5 * 86400), tz=timezone.utc).isoformat()
            if not t.plan_of_action:
                t.plan_of_action = "Asphalt paving crew dispatched. Road roller & bitumen sprayer scheduled for evening off-peak hours."

    session.commit()
    print("[+] All tickets updated with real municipal personnel and T+3, T+5, T+7 stages!")
    session.close()

if __name__ == "__main__":
    ingest_all()
