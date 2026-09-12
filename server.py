import asyncio
import os
import tempfile
import threading
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, Request, Form, File, UploadFile, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel

from config import (
    EVIDENCE_DIR,
    SLA_CHECK_INTERVAL_SECONDS,
    CONTRACTOR_EMAIL,
    ESCALATION_EMAIL,
)
from database import init_db
from email_service import notify_ticket_assigned, notify_ticket_escalated
from ticket_manager import ticket_manager

app = FastAPI(title="MargDarshak Intelligence Backend - Production Architecture")

# Allow React frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory background jobs registry for async video processing
video_jobs: Dict[str, Dict[str, Any]] = {}


class DetectionItem(BaseModel):
    problem: str
    confidence: float
    location: Dict[str, Any]
    image_bytes: Optional[str] = None
    track_id: Optional[int] = None
    timestamp_sec: Optional[float] = None


# ---------------------------------------------------------------------------
# Background SLA Countdown Daemon (48-Hour Auto Escalation)
# ---------------------------------------------------------------------------
async def run_sla_escalation_daemon():
    """
    Continuous background monitor:
    Checks for tickets whose 48-hour SLA deadline has expired.
    Automatically escalates and triggers notification email to Higher Authority.
    """
    print(f"[*] 48-Hour SLA Escalation Daemon started (monitoring every {SLA_CHECK_INTERVAL_SECONDS}s)...")
    while True:
        try:
            escalated_tickets = ticket_manager.check_and_escalate_sla_breaches()
            for ticket in escalated_tickets:
                # Dispatch escalation email asynchronously
                try:
                    notify_ticket_escalated(ticket)
                except Exception as e:
                    print(f"[!] Warning: Failed to send auto-escalation email: {e}")
        except Exception as e:
            print(f"[!] Error in SLA escalation daemon: {e}")

        await asyncio.sleep(SLA_CHECK_INTERVAL_SECONDS)


@app.on_event("startup")
async def on_startup():
    """Initializes persistent database tables and starts background SLA monitor."""
    init_db()
    asyncio.create_task(run_sla_escalation_daemon())


# ---------------------------------------------------------------------------
# Static Image Evidence Serving (Offloaded from DB)
# ---------------------------------------------------------------------------
@app.get("/api/images/{filename}")
async def get_evidence_image(filename: str):
    """Serves defect evidence and contractor proof images from disk storage."""
    file_path = EVIDENCE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/jpeg")


# ---------------------------------------------------------------------------
# Detections Endpoint (with Non-Blocking Background Email Dispatch)
# ---------------------------------------------------------------------------
@app.post("/api/detections")
async def receive_detection(item: DetectionItem, background_tasks: BackgroundTasks):
    """
    Receives detection from video stream or camera array.
    Uses sub-second spatial deduplication (PostGIS ST_DWithin / Indexed Bounding Box):
    - If already detected within 7m -> increments vote priority count.
    - If new defect -> creates ticket in database and queues email in BackgroundTasks.
    """
    result = ticket_manager.process_detection(
        problem=item.problem,
        confidence=item.confidence,
        location=item.location,
        image_bytes=item.image_bytes,
        timestamp_sec=item.timestamp_sec,
    )

    ticket_data = result["ticket"]

    # Non-blocking email dispatch in FastAPI background task
    if result.get("is_new"):
        background_tasks.add_task(notify_ticket_assigned, ticket_data)

    return {
        "status": "success",
        "action": result["action"],
        "ticket_id": ticket_data["id"],
        "votes": ticket_data["votes"],
        "problem": ticket_data["problem"],
        "ticket_status": ticket_data["status"],
    }


# ---------------------------------------------------------------------------
# Asynchronous Video & Image Upload Processing (202 Accepted + Background Worker)
# ---------------------------------------------------------------------------
def _process_video_worker(job_id: str, temp_vid_path: str, model_path: str, latitude: float, longitude: float):
    """Worker function running in a separate background thread for video inference."""
    try:
        video_jobs[job_id]["status"] = "processing"
        video_jobs[job_id]["started_at"] = time.time()

        from video_processor import process_video
        process_video(
            video_path=temp_vid_path,
            model_path=model_path,
            backend_url="http://localhost:8000/api/detections",
            conf_threshold=0.3,
            frame_skip=3,
            start_lat=latitude,
            start_lon=longitude,
        )

        video_jobs[job_id]["status"] = "completed"
        video_jobs[job_id]["completed_at"] = time.time()
        print(f"[+] [JOB COMPLETED] Video processing job {job_id} finished successfully.")

    except Exception as e:
        print(f"[!] [JOB FAILED] Video processing job {job_id} encountered error: {e}")
        video_jobs[job_id]["status"] = "failed"
        video_jobs[job_id]["error"] = str(e)
    finally:
        if os.path.exists(temp_vid_path):
            try:
                os.remove(temp_vid_path)
            except Exception:
                pass


@app.post("/api/analyze-upload", status_code=status.HTTP_202_ACCEPTED)
async def analyze_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    latitude: Optional[float] = 17.3850,
    longitude: Optional[float] = 78.4867,
):
    """
    Production Asynchronous Upload Endpoint:
    - Images: Processed and returned quickly with defect detection.
    - Videos: Immediately returns 202 Accepted with a job_id; YOLO inference runs in background worker thread.
    """
    import cv2
    from ultralytics import YOLO

    filename = file.filename.lower()
    file_bytes = await file.read()

    # Model resolution
    model_path = "yolo26m.pt"
    if not os.path.exists(model_path):
        model_path = "yolov8m.pt"

    try:
        model = YOLO(model_path)
    except Exception:
        model = YOLO("yolov8n.pt")

    # 1. CASE: IMAGE UPLOAD (Synchronous inference)
    if any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]):
        import numpy as np
        np_arr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        results = model.predict(source=img, conf=0.3, verbose=False)
        detected_items = []

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                problem = model.names[cls_id]
                confidence = round(float(box.conf[0].item()), 4)

                ticket_res = ticket_manager.process_detection(
                    problem=problem,
                    confidence=confidence,
                    location={"latitude": latitude, "longitude": longitude},
                    image_bytes=file_bytes,
                )

                if ticket_res.get("is_new"):
                    background_tasks.add_task(notify_ticket_assigned, ticket_res["ticket"])

                detected_items.append({
                    "problem": problem,
                    "confidence": confidence,
                    "action": ticket_res["action"],
                    "ticket_id": ticket_res["ticket"]["id"],
                })

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "type": "image",
                "detections_count": len(detected_items),
                "detections": detected_items,
            },
        )

    # 2. CASE: VIDEO UPLOAD (Returns 202 Accepted with job_id)
    else:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        suffix = os.path.splitext(filename)[1] or ".mp4"

        # Save temporary video file for worker thread
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_vid:
            temp_vid.write(file_bytes)
            temp_vid_path = temp_vid.name

        video_jobs[job_id] = {
            "job_id": job_id,
            "filename": filename,
            "status": "queued",
            "created_at": time.time(),
        }

        # Spawn background processing thread
        thread = threading.Thread(
            target=_process_video_worker,
            args=(job_id, temp_vid_path, model_path, latitude, longitude),
            daemon=True,
        )
        thread.start()

        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "status": "accepted",
                "job_id": job_id,
                "message": f"Video upload accepted. Processing inference in background job {job_id}.",
                "poll_url": f"/api/jobs/{job_id}",
            },
        )


@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Returns status of an asynchronous video processing job."""
    if job_id not in video_jobs:
        raise HTTPException(status_code=404, detail="Job ID not found")
    return video_jobs[job_id]


# ---------------------------------------------------------------------------
# Tickets Query & Escalation Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/tickets")
async def get_all_tickets():
    """Returns all tickets with persistent 48h SLA countdown and image URLs."""
    return ticket_manager.get_all_tickets()


@app.get("/api/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    ticket = ticket_manager.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.post("/api/tickets/{ticket_id}/vote")
async def vote_ticket(ticket_id: str):
    """Allows citizens to upvote a public defect, increasing its community priority."""
    ticket = ticket_manager.vote_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "voted", "votes": ticket["votes"], "ticket": ticket}


@app.post("/api/tickets/{ticket_id}/escalate")
async def escalate_ticket(
    ticket_id: str,
    background_tasks: BackgroundTasks,
    reason: Optional[str] = "Manual escalation trigger",
):
    """Escalates ticket to Higher Authority and schedules alert email."""
    ticket = ticket_manager.escalate_ticket(ticket_id, reason=reason)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    background_tasks.add_task(notify_ticket_escalated, ticket)
    return {"status": "escalated", "ticket": ticket}


@app.post("/api/tickets/{ticket_id}/intake")
async def intake_ticket(ticket_id: str):
    """Marks ticket intake completed (Day T+3 milestone achieved), advancing status to INTAKE_COMPLETED."""
    ticket = ticket_manager.intake_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "intake_completed", "ticket": ticket}


@app.get("/api/officers")
async def get_officers(wing: Optional[str] = None, zone: Optional[str] = None, circle: Optional[str] = None):
    """Returns official municipal personnel directory from Aiven database."""
    from database import get_db_session, OfficerModel, officer_to_dict
    db = get_db_session()
    try:
        q = db.query(OfficerModel)
        if wing:
            q = q.filter(OfficerModel.category_wing.ilike(f"%{wing}%"))
        if zone:
            q = q.filter(OfficerModel.zone.ilike(f"%{zone}%"))
        if circle:
            q = q.filter(OfficerModel.circle.ilike(f"%{circle}%"))
        officers = q.all()
        return [officer_to_dict(o) for o in officers]
    finally:
        db.close()


# ---------------------------------------------------------------------------
# BUTTON 1: Plan of Action & Status Form
# ---------------------------------------------------------------------------
@app.get("/contractor/plan/{ticket_id}", response_class=HTMLResponse)
async def render_plan_form(ticket_id: str):
    ticket = ticket_manager.get_ticket(ticket_id)
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

    prob = ticket["problem"].capitalize()
    votes = ticket["votes"]
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    current_status = ticket["status"]
    plan_text = ticket.get("plan_of_action") or ""
    remaining_hours = max(0, int(ticket.get("sla_remaining_seconds", 0) // 3600))
    remaining_mins = max(0, int((ticket.get("sla_remaining_seconds", 0) % 3600) // 60))

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Update Action Plan - #{ticket_id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #eef2f6; padding: 20px; }}
            .card {{ max-width: 550px; margin: auto; background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            h2 {{ color: #1a73e8; margin-top: 0; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; background: #e8f0fe; color: #1a73e8; }}
            .sla-pill {{ display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; background: #fef3c7; color: #92400e; margin-left: 8px; }}
            .form-group {{ margin-top: 18px; }}
            label {{ display: block; font-weight: bold; margin-bottom: 6px; color: #333; }}
            select, textarea, input {{ width: 100%; box-sizing: border-box; padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; }}
            button {{ background: #1a73e8; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 20px; }}
            button:hover {{ background: #1558b0; }}
            .info-table {{ width: 100%; margin: 15px 0; border-collapse: collapse; font-size: 14px; }}
            .info-table td {{ padding: 6px 0; }}
            .info-table td.label {{ color: #666; width: 35%; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>MargDarshak Contractor Portal</h2>
            <div class="badge">Ticket #{ticket_id}</div>
            <div class="sla-pill">⏱ SLA: {remaining_hours}h {remaining_mins}m left</div>
            
            <table class="info-table">
                <tr><td class="label">Issue:</td><td><b>{prob}</b></td></tr>
                <tr><td class="label">Priority / Votes:</td><td><b style="color: #d93025;">{votes} Vote(s)</b></td></tr>
                <tr><td class="label">Location:</td><td>{lat:.5f}, {lon:.5f}</td></tr>
                <tr><td class="label">Current Status:</td><td><b>{current_status}</b></td></tr>
            </table>

            <form action="/contractor/plan/{ticket_id}/submit" method="post">
                <div class="form-group">
                    <label>Current Status:</label>
                    <select name="status">
                        <option value="IN_PROGRESS" {"selected" if current_status == "IN_PROGRESS" else ""}>Action Planned / In Progress</option>
                        <option value="DELAYED_PARTS">Delayed (Awaiting Material / Weather)</option>
                        <option value="UNDER_INSPECTION">Under On-site Inspection</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Plan of Action / Reason for Delay:</label>
                    <textarea name="plan_of_action" rows="5" required placeholder="Explain your action plan, repair schedule, or reason for delay...">{plan_text}</textarea>
                </div>

                <button type="submit">Submit Action Plan</button>
            </form>
        </div>
    </body>
    </html>
    """


@app.post("/contractor/plan/{ticket_id}/submit", response_class=HTMLResponse)
async def submit_plan_form(ticket_id: str, status: str = Form(...), plan_of_action: str = Form(...)):
    ticket = ticket_manager.update_plan_of_action(ticket_id, plan_of_action=plan_of_action, status=status)
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

    return f"""
    <!DOCTYPE html>
    <html>
    <head><title>Plan Submitted</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px; background: #eef2f6;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1a73e8;">Action Plan Successfully Recorded!</h2>
            <p>Ticket <b>#{ticket_id}</b> status updated to: <b>{ticket['status']}</b></p>
            <p style="color: #555; background: #f8f9fa; padding: 12px; border-radius: 6px;"><b>Plan:</b> {plan_of_action}</p>
            <p style="color: #888; font-size: 13px;">This has been synced to the Central Intelligence Database.</p>
        </div>
    </body>
    </html>
    """


# ---------------------------------------------------------------------------
# BUTTON 2: Mark as Solved & Upload Proof Form
# ---------------------------------------------------------------------------
@app.get("/contractor/resolve/{ticket_id}", response_class=HTMLResponse)
async def render_resolve_form(ticket_id: str):
    ticket = ticket_manager.get_ticket(ticket_id)
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

    prob = ticket["problem"].capitalize()
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Mark as Solved - #{ticket_id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #eef2f6; padding: 20px; }}
            .card {{ max-width: 550px; margin: auto; background: white; border-radius: 12px; padding: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            h2 {{ color: #34a853; margin-top: 0; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 13px; background: #e6f4ea; color: #137333; }}
            .form-group {{ margin-top: 18px; }}
            label {{ display: block; font-weight: bold; margin-bottom: 6px; color: #333; }}
            textarea, input {{ width: 100%; box-sizing: border-box; padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px; }}
            button {{ background: #34a853; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 20px; }}
            button:hover {{ background: #2d9247; }}
            .info-table {{ width: 100%; margin: 15px 0; border-collapse: collapse; font-size: 14px; }}
            .info-table td {{ padding: 6px 0; }}
            .info-table td.label {{ color: #666; width: 35%; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Mark Problem as Solved</h2>
            <div class="badge">Ticket #{ticket_id}</div>
            
            <table class="info-table">
                <tr><td class="label">Issue:</td><td><b>{prob}</b></td></tr>
                <tr><td class="label">Location:</td><td>{lat:.5f}, {lon:.5f}</td></tr>
            </table>

            <form action="/contractor/resolve/{ticket_id}/submit" method="post" enctype="multipart/form-data">
                <div class="form-group">
                    <label>What was done to solve the problem?</label>
                    <textarea name="what_was_done" rows="4" required placeholder="Describe repair work done (e.g., filled with bitumen cold mix, rolled and sealed)..."></textarea>
                </div>

                <div class="form-group">
                    <label>Upload Image as Proof of Resolution:</label>
                    <input type="file" name="proof_image" accept="image/*" required />
                </div>

                <button type="submit">✅ Submit Resolution &amp; Proof</button>
            </form>
        </div>
    </body>
    </html>
    """


@app.post("/contractor/resolve/{ticket_id}/submit", response_class=HTMLResponse)
async def submit_resolve_form(
    ticket_id: str,
    what_was_done: str = Form(...),
    proof_image: UploadFile = File(...),
):
    file_bytes = await proof_image.read()
    ticket = ticket_manager.resolve_ticket_with_proof(
        ticket_id=ticket_id,
        what_was_done=what_was_done,
        proof_image_data=file_bytes,
    )
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

    proof_url = ticket.get("proof_image_url") or ""

    return f"""
    <!DOCTYPE html>
    <html>
    <head><title>Ticket Solved</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px; background: #eef2f6;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #34a853;">Resolution Proof Accepted!</h2>
            <p>Ticket <b>#{ticket_id}</b> has been marked as: <b style="color: #137333;">RESOLVED</b></p>
            <p style="color: #555;"><b>Work Done:</b> {what_was_done}</p>
            <div style="margin-top: 20px;">
                <p style="font-weight: bold; font-size: 14px;">Uploaded Repair Proof:</p>
                <img src="{proof_url}" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc; max-height: 250px;" />
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 15px;">Proof has been permanently logged in the Central Spatial Database.</p>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn

    print("[*] Starting MargDarshak Production Backend on http://localhost:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
