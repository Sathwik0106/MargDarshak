import subprocess
import sys
import time
import os

def start_margdarshak():
    print("=" * 65)
    print("   MARGDARSHAK - CITY ROAD INTELLIGENCE PLATFORM")
    print("=" * 65)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    # 1. Start FastAPI Backend
    print("[1/2] Starting Central Intelligence Server (FastAPI on Port 8000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, "server.py"],
        cwd=root_dir,
    )

    # 2. Start React Vite Frontend
    print("[2/2] Starting Command Dashboard (React + OpenStreetMap on Port 5173)...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        cwd=frontend_dir,
        shell=True,
    )

    time.sleep(2)
    print("\n" + "=" * 65)
    print("  MARGDARSHAK SYSTEM IS NOW ONLINE!")
    print("  Dashboard UI:   http://localhost:5173")
    print("  Backend API:    http://localhost:8000/api/tickets")
    print("  API Docs:       http://localhost:8000/docs")
    print("=" * 65)
    print("\nPress Ctrl+C to stop all servers.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Stopping MargDarshak services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[*] All services stopped cleanly.")

if __name__ == "__main__":
    start_margdarshak()
