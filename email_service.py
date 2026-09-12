import base64
import os
import smtplib
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Optional, Dict, Any

from config import (
    SENDER_EMAIL,
    SENDER_PASSWORD,
    CONTRACTOR_EMAIL,
    ESCALATION_EMAIL,
    SERVER_BASE_URL,
    EVIDENCE_DIR,
)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_email(to_email: str, subject: str, html_body: str, image_bytes: Optional[bytes] = None) -> bool:
    """
    Sends an HTML email with optional inline/attached defect image via Gmail SMTP.
    Configured securely through environment variables.
    """
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("[!] SENDER_EMAIL or SENDER_PASSWORD not configured. Skipping email dispatch.")
        return False

    msg = MIMEMultipart("related")
    msg["From"] = f"MargDarshak Autonomous Sensing <{SENDER_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    # Attach HTML Body
    msg.attach(MIMEText(html_body, "html"))

    # Attach image if provided
    if image_bytes:
        try:
            img = MIMEImage(image_bytes, name="defect_evidence.jpg")
            img.add_header("Content-ID", "<defect_evidence>")
            img.add_header("Content-Disposition", "inline", filename="defect_evidence.jpg")
            msg.attach(img)
        except Exception as e:
            print(f"[!] Warning: Could not attach image to email: {e}")

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[+] Email successfully sent to {to_email} | Subject: {subject}")
        return True
    except Exception as e:
        print(f"[!] Failed to send email to {to_email}: {e}")
        return False


def _extract_ticket_image_bytes(ticket: Dict[str, Any]) -> Optional[bytes]:
    """Helper to extract image bytes from disk file or base64 data."""
    filename = ticket.get("evidence_image_filename")
    if filename:
        file_path = EVIDENCE_DIR / filename
        if file_path.exists():
            try:
                return file_path.read_bytes()
            except Exception:
                pass

    raw_data = ticket.get("image_bytes")
    if raw_data and isinstance(raw_data, str) and not raw_data.startswith("http"):
        try:
            b64_str = raw_data.split(",", 1)[1] if "," in raw_data else raw_data
            return base64.b64decode(b64_str)
        except Exception:
            pass
    return None


def notify_ticket_assigned(ticket: Dict[str, Any]) -> bool:
    """
    Sends notification to the Ward Contractor with TWO distinct action buttons:
    1. Update Status & Plan of Action (/contractor/plan/{ticket_id})
    2. Mark as Solved & Upload Proof (/contractor/resolve/{ticket_id})
    """
    ticket_id = ticket["id"]
    problem = ticket["problem"].capitalize()
    votes = ticket.get("votes", 1)
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    maps_url = f"https://www.google.com/maps?q={lat},{lon}"

    plan_url = f"{SERVER_BASE_URL}/contractor/plan/{ticket_id}"
    resolve_url = f"{SERVER_BASE_URL}/contractor/resolve/{ticket_id}"

    subject = f"[MargDarshak Alert] New Road Defect Assigned: {problem} (#{ticket_id}) - {votes} Vote(s)"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }}
            .container {{ max-width: 620px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            .header {{ background: #0b2545; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }}
            .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #90caf9; }}
            .content {{ padding: 28px; }}
            .badge-priority {{ display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: 1px solid #fca5a5; }}
            .info-box {{ width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }}
            .info-box td {{ padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }}
            .info-box td.label {{ font-weight: 600; color: #64748b; width: 35%; }}
            .info-box td.val {{ font-weight: 600; color: #0f172a; }}
            .btn-table {{ width: 100%; margin: 25px 0 10px 0; }}
            .btn-action {{ display: block; text-align: center; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; color: #ffffff !important; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }}
            .btn-blue {{ background-color: #1a73e8; }}
            .btn-green {{ background-color: #16a34a; }}
            .countdown-note {{ background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 12px; border-radius: 6px; font-size: 13px; margin: 18px 0; }}
            .footer {{ background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MARGDARSHAK MUNICIPAL DEFECT DISPATCH</h1>
                <p>Automated Hyderabad City Transit Sensing &bull; Ticket #{ticket_id}</p>
            </div>
            <div class="content">
                <p>Hello Ward Maintenance Contractor (<b>{CONTRACTOR_EMAIL}</b>),</p>
                <p>A new municipal roadway defect was detected and autonomously verified by fleet video sensors:</p>

                <div style="margin: 12px 0;">
                    <span class="badge-priority">{votes} Detection Vote(s) - High Citizen &amp; Transit Impact</span>
                </div>

                <table class="info-box">
                    <tr><td class="label">Ticket ID:</td><td class="val">#{ticket_id}</td></tr>
                    <tr><td class="label">Defect Type:</td><td class="val" style="color: #d93025; font-size: 16px;">{problem}</td></tr>
                    <tr><td class="label">GPS Coordinates:</td><td class="val">{lat:.5f}, {lon:.5f}</td></tr>
                    <tr><td class="label">Map Route:</td><td class="val"><a href="{maps_url}" target="_blank" style="color: #1a73e8; font-weight: bold;">Open Coordinates in Google Maps</a></td></tr>
                    <tr><td class="label">Current Status:</td><td class="val"><span style="color: #1a73e8;">ASSIGNED TO WARD</span></td></tr>
                </table>

                <div class="countdown-note">
                    ⏱ <b>Strict 48-Hour SLA Notice:</b> You have a <b>48-hour countdown</b> to begin work or resolve this ticket. If unaddressed when the countdown reaches zero, this ticket is automatically escalated to Zonal Administration (<b>{ESCALATION_EMAIL}</b>).
                </div>

                <div style="margin: 20px 0; text-align: center;">
                    <p style="font-weight: 600; margin-bottom: 8px; text-align: left; font-size: 13px; color: #475569;">Fleet Camera Evidence:</p>
                    <img src="cid:defect_evidence" alt="Camera Defect Evidence" style="max-width: 100%; border-radius: 8px; border: 1px solid #cbd5e1;" />
                </div>

                <table class="btn-table" cellpadding="0" cellspacing="10">
                    <tr>
                        <td width="50%">
                            <a href="{plan_url}" target="_blank" class="btn-action btn-blue">
                                📝 Update Status &amp; Action Plan
                            </a>
                        </td>
                        <td width="50%">
                            <a href="{resolve_url}" target="_blank" class="btn-action btn-green">
                                ✅ Mark as Solved &amp; Upload Proof
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="footer">
                MargDarshak Central Intelligence Platform &bull; Hyderabad Municipal Governance
            </div>
        </div>
    </body>
    </html>
    """

    img_bytes = _extract_ticket_image_bytes(ticket)
    return send_email(CONTRACTOR_EMAIL, subject, html_body, image_bytes=img_bytes)


def notify_ticket_escalated(ticket: Dict[str, Any]) -> bool:
    """
    Sends Statutory T+7 SLA Escalation Alert to Zonal Commissioner.
    Triggered automatically when the T+7 resolution deadline has expired without verified resolution.
    """
    ticket_id = ticket["id"]
    problem = ticket["problem"].capitalize()
    votes = ticket.get("votes", 1)
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    maps_url = f"https://www.google.com/maps?q={lat},{lon}"

    assigned_email = ticket.get("assigned_officer_email") or ticket.get("contractor_email") or CONTRACTOR_EMAIL
    assigned_name = ticket.get("assigned_officer_name") or "Circle Executive Engineer"
    escalation_email = ticket.get("escalation_officer_email") or ticket.get("escalation_email") or ESCALATION_EMAIL
    escalation_name = ticket.get("escalation_officer_name") or "Zonal Commissioner"

    subject = f"[URGENT T+7 SLA BREACH] Statutory Escalation: {problem} (#{ticket_id}) - {votes} Vote(s)"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #fef2f2; margin: 0; padding: 20px; color: #333; }}
            .container {{ max-width: 620px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 2px solid #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.15); }}
            .header {{ background: #dc2626; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }}
            .content {{ padding: 28px; }}
            .alert-banner {{ background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; margin: 15px 0; font-size: 14px; color: #991b1b; }}
            .info-box {{ width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff5f5; border-radius: 8px; border: 1px solid #fecaca; }}
            .info-box td {{ padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #fecaca; }}
            .info-box td.label {{ font-weight: 600; color: #7f1d1d; width: 35%; }}
            .info-box td.val {{ font-weight: 600; color: #111827; }}
            .footer {{ background: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ STATUTORY T+7 SLA ESCALATION NOTICE</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #fecaca;">Zonal Higher Authority Executive Action Required</p>
            </div>
            <div class="content">
                <p>Respected <b>{escalation_name}</b>,</p>
                <div class="alert-banner">
                    <b>Statutory Violation:</b> The <b>T+7 Resolution SLA (7 Days)</b> has expired for Ticket <b>#{ticket_id}</b>. The assigned municipal division (<b>{assigned_name} &bull; {assigned_email}</b>) has not marked verified resolution.
                </div>

                <table class="info-box">
                    <tr><td class="label">Ticket ID:</td><td class="val">#{ticket_id}</td></tr>
                    <tr><td class="label">Issue / Defect:</td><td class="val" style="color: #dc2626; font-size: 16px;">{problem}</td></tr>
                    <tr><td class="label">Citizen Priority:</td><td class="val"><span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{votes} Detection Vote(s) (Critical)</span></td></tr>
                    <tr><td class="label">Defect Location:</td><td class="val">{lat:.5f}, {lon:.5f} (<a href="{maps_url}" target="_blank" style="color: #2563eb; font-weight: bold;">Google Maps</a>)</td></tr>
                    <tr><td class="label">Assigned Officer:</td><td class="val">{assigned_name} ({assigned_email})</td></tr>
                    <tr><td class="label">Escalation Authority:</td><td class="val">{escalation_name} ({escalation_email})</td></tr>
                    <tr><td class="label">Governance Status:</td><td class="val" style="color: #dc2626; font-weight: bold;">ESCALATED_ZONAL (T+7 Breached)</td></tr>
                </table>

                <div style="margin: 20px 0; text-align: center;">
                    <p style="font-weight: 600; margin-bottom: 8px; text-align: left; font-size: 13px; color: #475569;">Fleet Camera Evidence Snapshot:</p>
                    <img src="cid:defect_evidence" alt="Defect Evidence" style="max-width: 100%; border-radius: 8px; border: 1px solid #cbd5e1;" />
                </div>

                <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 13px; color: #334155;">
                    <b>Executive Action Options:</b>
                    <ul style="margin: 6px 0 0 0; padding-left: 20px;">
                        <li>Dispatch municipal emergency repair flying squad</li>
                        <li>Issue show-cause notice to Circle Maintenance Division</li>
                        <li>Summon contractor for physical road quality compliance review</li>
                    </ul>
                </div>
            </div>
            <div class="footer">
                MargDarshak Autonomous City Sensing Platform &bull; T+3, T+5, T+7 Statutory SLA Governance
            </div>
        </div>
    </body>
    </html>
    """

    img_bytes = _extract_ticket_image_bytes(ticket)
    return send_email(escalation_email, subject, html_body, image_bytes=img_bytes)
