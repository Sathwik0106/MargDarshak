import base64
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "sathwik661119@gmail.com"
SENDER_PASSWORD = "faprjoapfjilhlad"

CONTRACTOR_EMAIL = "abhimanu6729@gmail.com"
ESCALATION_EMAIL = "lingarajusaikumar@gmail.com"
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:8000")


def send_email(to_email: str, subject: str, html_body: str, image_bytes: bytes = None):
    """
    Sends an HTML email with optional inline/attached evidence image via Gmail SMTP.
    """
    msg = MIMEMultipart("related")
    msg["From"] = f"MargDarshak Control Center <{SENDER_EMAIL}>"
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


def notify_ticket_assigned(ticket: dict):
    """
    Sends notification to the Ward Contractor with TWO distinct buttons:
    1. Update Status & Plan of Action
    2. Mark as Solved & Upload Proof
    """
    ticket_id = ticket["id"]
    problem = ticket["problem"].capitalize()
    votes = ticket["votes"]
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    maps_url = f"https://www.google.com/maps?q={lat},{lon}"

    # Action URLs for the two buttons
    plan_url = f"{SERVER_BASE_URL}/contractor/plan/{ticket_id}"
    resolve_url = f"{SERVER_BASE_URL}/contractor/resolve/{ticket_id}"

    subject = f"[MargDarshak Alert] New Road Issue Assigned: {problem} (#{ticket_id}) - {votes} Vote(s)"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: #1a73e8; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">City Road Intelligence Alert</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px;">MargDarshak Mobile Fleet Sensing System</p>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px;">Hello <b>Ward Contractor</b>,</p>
                <p>A road defect has been detected by transit bus cameras and assigned to your jurisdiction:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px 12px; background: #f8f9fa; font-weight: bold; width: 35%;">Ticket ID:</td>
                        <td style="padding: 8px 12px; background: #f8f9fa;"><b>#{ticket_id}</b></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold;">Issue / Defect:</td>
                        <td style="padding: 8px 12px; color: #d93025; font-weight: bold;">{problem}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; background: #f8f9fa; font-weight: bold;">Priority / Votes:</td>
                        <td style="padding: 8px 12px; background: #f8f9fa;"><span style="background: #e8f0fe; color: #1a73e8; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{votes} Citizen/Fleet Vote(s)</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold;">Location:</td>
                        <td style="padding: 8px 12px;">{lat:.5f}, {lon:.5f} 
                            (<a href="{maps_url}" target="_blank" style="color: #1a73e8; font-weight: bold;">View on Google Maps</a>)
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; background: #f8f9fa; font-weight: bold;">SLA Deadline:</td>
                        <td style="padding: 8px 12px; background: #f8f9fa; color: #e37400; font-weight: bold;">Action Required within 24 Hours</td>
                    </tr>
                </table>

                <div style="margin: 20px 0; text-align: center;">
                    <p style="font-weight: bold; margin-bottom: 8px; text-align: left;">Camera Evidence Snapshot (Before):</p>
                    <img src="cid:defect_evidence" alt="Defect Evidence" style="max-width: 100%; border-radius: 6px; border: 1px solid #ccc;" />
                </div>

                <div style="background-color: #fef7e0; border-left: 4px solid #f9ab00; padding: 12px; margin: 20px 0; font-size: 13px;">
                    <b>Notice:</b> Please respond within 24 hours to prevent automated escalation to <b>Zonal Higher Authority</b> ({ESCALATION_EMAIL}).
                </div>

                <!-- Two Distinct Action Buttons -->
                <div style="text-align: center; margin-top: 25px;">
                    <a href="{plan_url}" style="background-color: #1a73e8; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 6px;">
                        📝 Update Status & Plan of Action
                    </a>
                    <a href="{resolve_url}" style="background-color: #34a853; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 6px;">
                        ✅ Mark as Solved & Upload Proof
                    </a>
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 12px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
                MargDarshak Autonomous City Sensing Platform &bull; Automated Dispatch
            </div>
        </div>
    </body>
    </html>
    """

    img_bytes = None
    if ticket.get("image_bytes"):
        try:
            b64_str = ticket["image_bytes"]
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_str)
        except Exception:
            pass

    return send_email(CONTRACTOR_EMAIL, subject, html_body, image_bytes=img_bytes)


def notify_ticket_escalated(ticket: dict):
    """
    Sends escalation notification to Higher Authority (lingarajusaikumar@gmail.com).
    """
    ticket_id = ticket["id"]
    problem = ticket["problem"].capitalize()
    votes = ticket["votes"]
    lat = ticket["location"]["latitude"]
    lon = ticket["location"]["longitude"]
    maps_url = f"https://www.google.com/maps?q={lat},{lon}"

    subject = f"[URGENT ESCALATION] SLA Breach: Unresolved {problem} (#{ticket_id}) - {votes} Vote(s)"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #fbeae5; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; border: 2px solid #d93025; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #d93025; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 22px;">SLA ESCALATION ALERT</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Zonal Administration Immediate Attention Required</p>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px;">Hello <b>Higher Authority / Zonal Officer</b>,</p>
                <p>The designated Ward Contractor (<b>{CONTRACTOR_EMAIL}</b>) has <b>failed to respond or take action</b> within the mandatory 24-hour SLA window for the following issue:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px 12px; background: #fdf2f2; font-weight: bold; width: 35%;">Ticket ID:</td>
                        <td style="padding: 8px 12px; background: #fdf2f2;"><b>#{ticket_id}</b></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold;">Issue / Defect:</td>
                        <td style="padding: 8px 12px; color: #d93025; font-weight: bold;">{problem}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; background: #fdf2f2; font-weight: bold;">Citizen/Fleet Priority:</td>
                        <td style="padding: 8px 12px; background: #fdf2f2;"><span style="background: #fce8e6; color: #c5221f; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{votes} Vote(s) (Critical Priority)</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold;">Defect Location:</td>
                        <td style="padding: 8px 12px;">{lat:.5f}, {lon:.5f} 
                            (<a href="{maps_url}" target="_blank" style="color: #1a73e8; font-weight: bold;">Open Coordinates in Maps</a>)
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; background: #fdf2f2; font-weight: bold;">Assigned Contractor:</td>
                        <td style="padding: 8px 12px; background: #fdf2f2;">{CONTRACTOR_EMAIL} (Non-Responsive)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold;">Current Status:</td>
                        <td style="padding: 8px 12px; color: #d93025; font-weight: bold;">ESCALATED TO ZONAL LEVEL</td>
                    </tr>
                </table>

                <div style="margin: 20px 0; text-align: center;">
                    <p style="font-weight: bold; margin-bottom: 8px; text-align: left;">Camera Evidence Snapshot:</p>
                    <img src="cid:defect_evidence" alt="Defect Evidence" style="max-width: 100%; border-radius: 6px; border: 1px solid #ccc;" />
                </div>

                <div style="background-color: #fdf2f2; border-left: 4px solid #d93025; padding: 12px; margin: 20px 0; font-size: 13px;">
                    <b>Action Required:</b> Please reassign this task or summon contractor <b>{CONTRACTOR_EMAIL}</b> for non-compliance.
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 12px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
                MargDarshak Autonomous City Sensing Platform &bull; Automated SLA Escalation
            </div>
        </div>
    </body>
    </html>
    """

    img_bytes = None
    if ticket.get("image_bytes"):
        try:
            b64_str = ticket["image_bytes"]
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_str)
        except Exception:
            pass

    return send_email(ESCALATION_EMAIL, subject, html_body, image_bytes=img_bytes)
