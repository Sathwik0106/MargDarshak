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

CONTRACTOR_EMAIL = os.getenv("CONTRACTOR_EMAIL", "abhimanu6729@gmail.com")
ESCALATION_EMAIL = os.getenv("ESCALATION_EMAIL", "lingarajusaikumar@gmail.com")

SLA_TIMEOUT_HOURS = float(os.getenv("SLA_TIMEOUT_HOURS", "48"))
SLA_TIMEOUT_SECONDS = SLA_TIMEOUT_HOURS * 3600
SLA_CHECK_INTERVAL_SECONDS = int(os.getenv("SLA_CHECK_INTERVAL_SECONDS", "30"))

SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:8000")

# Storage directory for evidence photos (offloaded from database)
EVIDENCE_DIR = Path(__file__).parent / "data" / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
