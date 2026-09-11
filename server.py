import base64
from fastapi import FastAPI, HTTPException, Request, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from ticket_manager import ticket_manager

app = FastAPI(title="MargDarshak Intelligence Backend")

# Allow React frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectionItem(BaseModel):
    problem: str
    confidence: float
    location: Dict[str, Any]
    image_bytes: str
    track_id: Optional[int] = None
    timestamp_sec: Optional[float] = None


@app.post("/api/detections")
async def receive_detection(item: DetectionItem):
    """
    Receives detection from video_processor.
    Processes with the Ticket Manager:
    - If already detected within 7m -> increments votes (priority system)
    - If new -> generates ticket and sends email to abhimanu6729@gmail.com
    """
    result = ticket_manager.process_detection(
        problem=item.problem,
        confidence=item.confidence,
        location=item.location,
        image_bytes=item.image_bytes,
        timestamp_sec=item.timestamp_sec,
    )
    return {
        "status": "success",
        "action": result["action"],
        "ticket_id": result["ticket"]["id"],
        "votes": result["ticket"]["votes"],
        "problem": result["ticket"]["problem"],
        "ticket_status": result["ticket"]["status"],
    }


@app.post("/api/analyze-upload")
async def analyze_upload(
    file: UploadFile = File(...),
    latitude: Optional[float] = 17.3850,
    longitude: Optional[float] = 78.4867,
):
    """
    Real-World System Design Endpoint:
    Allows user to upload either an Image or a Video file directly from the browser.
    Runs YOLO26m inference and automatically routes through the Ticket & Email pipeline.
    """
    import tempfile
    import os
    import cv2
    from ultralytics import YOLO

    filename = file.filename.lower()
    file_bytes = await file.read()

    # Load YOLO model
    model_path = "yolo26m.pt"
    if not os.path.exists(model_path):
        model_path = "yolov8m.pt"
    
    try:
        model = YOLO(model_path)
    except Exception as e:
        model = YOLO("yolov8n.pt")

    # 1. CASE: IMAGE UPLOAD
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

                # Convert image to base64
                b64_img = base64.b64encode(file_bytes).decode("ascii")

                ticket_res = ticket_manager.process_detection(
                    problem=problem,
                    confidence=confidence,
                    location={"latitude": latitude, "longitude": longitude},
                    image_bytes=b64_img,
                )
                detected_items.append({
                    "problem": problem,
                    "confidence": confidence,
                    "action": ticket_res["action"],
                    "ticket_id": ticket_res["ticket"]["id"],
                })

        return {
            "status": "success",
            "type": "image",
            "detections_count": len(detected_items),
            "detections": detected_items,
        }

    # 2. CASE: VIDEO UPLOAD
    else:
        # Save uploaded video temporarily
        suffix = os.path.splitext(filename)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_vid:
            temp_vid.write(file_bytes)
            temp_vid_path = temp_vid.name

        try:
            from video_processor import process_video
            # Process video frame-by-frame with 7m spatial de-duplication
            process_video(
                video_path=temp_vid_path,
                model_path=model_path,
                backend_url="http://localhost:8000/api/detections",
                conf_threshold=0.3,
                frame_skip=3,
                start_lat=latitude,
                start_lon=longitude,
            )
        finally:
            if os.path.exists(temp_vid_path):
                os.remove(temp_vid_path)

        return {
            "status": "success",
            "type": "video",
            "message": "Video processed through YOLO26m with 7m de-duplication & ticketing.",
        }


@app.get("/api/tickets")
async def get_all_tickets():
    """Returns all tickets for the dashboard (with votes, status, coordinates, photos, and proof)."""
    return ticket_manager.get_all_tickets()


@app.get("/api/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    """Returns details of a specific ticket."""
    ticket = ticket_manager.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@app.post("/api/tickets/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str, reason: Optional[str] = "Manual/SLA escalation trigger"):
    """
    Escalates ticket to higher authority (lingarajusaikumar@gmail.com) and sends alert email.
    """
    ticket = ticket_manager.escalate_ticket(ticket_id, reason=reason)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "escalated", "ticket": ticket}


# ==========================================
# BUTTON 1: Plan of Action & Status Form
# ==========================================
@app.get("/contractor/plan/{ticket_id}", response_class=HTMLResponse)
async def render_plan_form(ticket_id: str):
    """Renders the Plan of Action form for the contractor."""
    ticket = ticket_manager.get_ticket(ticket_id)
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

    prob = ticket["problem"].capitalize()
    votes = ticket["votes"]
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    current_status = ticket["status"]
    plan_text = ticket.get("plan_of_action") or ""

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
    """Handles submission of the action plan form."""
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
            <p style="color: #888; font-size: 13px;">This has been synced to the Central Intelligence Dashboard.</p>
        </div>
    </body>
    </html>
    """


# ==========================================
# BUTTON 2: Mark as Solved & Upload Proof Form
# ==========================================
@app.get("/contractor/resolve/{ticket_id}", response_class=HTMLResponse)
async def render_resolve_form(ticket_id: str):
    """Renders the Resolution & Image Proof upload form for the contractor."""
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
                    <textarea name="what_was_done" rows="4" required placeholder="Describe the repair work done (e.g., filled with bitumen cold mix, resurfaced and rolled)..."></textarea>
                </div>

                <div class="form-group">
                    <label>Upload Image as Proof of Resolution:</label>
                    <input type="file" name="proof_image" accept="image/*" required />
                </div>

                <button type="submit">✅ Submit Resolution & Proof</button>
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
    """
    Receives resolution description and photo proof, encodes to base64,
    updates ticket status to RESOLVED, and reflects on backend/dashboard.
    """
    # Read uploaded file bytes
    file_bytes = await proof_image.read()
    b64_proof = base64.b64encode(file_bytes).decode("ascii")

    ticket = ticket_manager.resolve_ticket_with_proof(
        ticket_id=ticket_id,
        what_was_done=what_was_done,
        proof_image_base64=b64_proof,
    )
    if not ticket:
        return HTMLResponse("<h2>Ticket not found</h2>", status_code=404)

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
                <img src="data:image/jpeg;base64,{b64_proof}" style="max-width: 100%; border-radius: 8px; border: 1px solid #ccc; max-height: 250px;" />
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 15px;">Proof has been permanently logged in the Central Intelligence Server.</p>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    import uvicorn

    print("[*] Starting MargDarshak Central Server on http://localhost:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
