import subprocess
import threading
import sys
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# Force UTF-8 so emoji in Python server logs don't crash on Windows
os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

SERVERS = [
    {
        "name": "MediaPipe",
        "cwd": os.path.join(BASE, "python_backend"),
        "cmd": [sys.executable, "pose_server.py"],
    },
    {
        "name": "Team2 Backend",
        "cwd": os.path.join(BASE, "posture-coach-team-copy", "backend"),
        "cmd": [
            os.path.join(BASE, "posture-coach-team-copy", "backend", "venv", "Scripts", "python.exe"),
            "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"
        ],
    },
    {
        "name": "Expo Frontend",
        "cwd": os.path.join(BASE, "posture-coach-team-copy", "frontend"),
        "cmd": None,  # Launched separately in its own interactive window
    },
]

processes = []

def stream_output(proc, label):
    for line in iter(proc.stdout.readline, b""):
        text = line.decode("utf-8", errors="replace").rstrip()
        if text:
            print(f"[{label}] {text}", flush=True)

print("=" * 55)
print("  PostureCoach — Starting All Servers")
print("=" * 55)

# Launch Expo in its OWN interactive window so QR code renders
expo_cwd = os.path.join(BASE, "posture-coach-team-copy", "frontend")
print("\n[1/3] Starting Expo Frontend (opens in new window for QR code)...")
subprocess.Popen(
    "start \"Expo QR Code\" cmd /k npm start",
    cwd=expo_cwd,
    shell=True,
)

for server in SERVERS:
    if server["cmd"] is None:
        continue  # Already launched separately (e.g. Expo)
    print(f"\n▶ Starting {server['name']}...")
    proc = subprocess.Popen(
        server["cmd"],
        cwd=server["cwd"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"},
    )
    processes.append(proc)
    t = threading.Thread(target=stream_output, args=(proc, server["name"]), daemon=True)
    t.start()

print("\n✅ All servers launched! Logs are streaming below.")
print("   Press Ctrl+C to stop everything.\n")
print("-" * 55)

try:
    for proc in processes:
        proc.wait()
except KeyboardInterrupt:
    print("\n\n🛑 Stopping all servers...")
    for proc in processes:
        proc.terminate()
    print("✅ All servers stopped.")
