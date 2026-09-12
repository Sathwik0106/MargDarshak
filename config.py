import os
from pathlib import Path

# Load .env file into os.environ if present
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# Configurations
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/margdarshak")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "sathwik661119@gmail.com")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "faprjoapfjilhlad")

CONTRACTOR_EMAIL = os.getenv("CONTRACTOR_EMAIL", "dc14b.ghmc@gmail.com")
ESCALATION_EMAIL = os.getenv("ESCALATION_EMAIL", "zc.west.ghmc@gmail.com")

# T+3, T+5, T+7 SLA Milestones (in days and seconds)
SLA_T3_INTAKE_DAYS = 3
SLA_T3_INTAKE_SECONDS = SLA_T3_INTAKE_DAYS * 86400  # 72 hours (Day T to T+3: Intake)
SLA_T5_RESPONSE_DAYS = 5
SLA_T5_RESPONSE_SECONDS = SLA_T5_RESPONSE_DAYS * 86400  # 120 hours (Day T+3 to T+5: Response / Plan)
SLA_T7_RESOLUTION_DAYS = 7
SLA_T7_RESOLUTION_SECONDS = SLA_T7_RESOLUTION_DAYS * 86400  # 168 hours (Day T+5 to T+7: Resolution / Escalation)

SLA_TIMEOUT_SECONDS = SLA_T7_RESOLUTION_SECONDS
SLA_CHECK_INTERVAL_SECONDS = int(os.getenv("SLA_CHECK_INTERVAL_SECONDS", "30"))

SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:8000")

# Storage directory for evidence photos (offloaded from database)
EVIDENCE_DIR = Path(__file__).parent / "data" / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
