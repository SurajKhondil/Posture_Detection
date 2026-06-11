# How to Run the Posture Coach Project Manually in VS Code

This guide explains how to spin up each component of the Posture Coach ecosystem using separate terminal instances in VS Code.

---

## Prerequisites
- **Node.js (v18+)** and npm installed on your system.
- **Python (v3.10+)** added to your system environment PATH variables.
- **Expo Go** app installed on your physical mobile device (Android or iOS).

---

## Option A: Running the Stand-alone Pose Engine App
This setup uses the standalone `react-native-app` which connects directly to the MediaPipe WebSocket server to monitor upper-body posture coordinates.

### Step 1: Start the MediaPipe AI Server
1. In VS Code, open a new terminal: **Terminal** -> **New Terminal**.
2. Change directory into the python backend folder:
   ```powershell
   cd python_backend
   ```
3. (First time only) Install python package requirements:
   ```powershell
   pip install -r requirements.txt
   ```
4. Launch the websocket server:
   ```powershell
   python pose_server.py
   ```
5. Keep this terminal open! You should see: `🚀 Starting server on ws://0.0.0.0:8765`.

### Step 2: Start the React Native App
1. Open a **second** terminal window in VS Code (click the `+` icon in the terminal panel).
2. Change directory into the React Native app folder:
   ```powershell
   cd react-native-app
   ```
3. (First time only) Install node packages:
   ```powershell
   npm install
   ```
4. Start the Expo development server:
   ```powershell
   npm start
   ```
5. Scan the QR code shown in your terminal using the **Expo Go** application on your physical phone (make sure both your PC and phone are connected to the same local Wi-Fi network).

---

## Option B: Running the Full Posture Coach Platform
This configuration launches the central FastAPI user database backend, the collaborative Expo frontend app, and the MediaPipe WebSocket server.

### Step 1: Start the MediaPipe AI Server
(Follow the same instructions as Step 1 in Option A above).

### Step 2: Start the FastAPI Backend
1. Open a new terminal instance and navigate to the backend folder:
   ```powershell
   cd posture-coach-team-copy/backend
   ```
2. Activate your python virtual environment:
   - **Windows (PowerShell)**: `.\venv\Scripts\Activate.ps1`
   - **macOS/Linux**: `source venv/bin/activate`
3. Launch the FastAPI Uvicorn server:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
4. Verify server running status; documentation is accessible at `http://localhost:8000/docs`.

### Step 3: Start the Combined Expo App
1. Open another terminal instance and navigate to the frontend directory:
   ```powershell
   cd posture-coach-team-copy/frontend
   ```
2. (First time only) Install dependencies:
   ```powershell
   npm install
   ```
3. Start the application:
   ```powershell
   npm start
   ```
4. Scan the Expo QR code with your mobile device.

---

## 🛠️ Troubleshooting
- **"Address already in use" (Error: Port 8765 or 8000)**: A previous instance of the server is still running in the background. Press `Ctrl + C` in the corresponding terminal, or close active console processes in the background.
- **WebSocket Connection Failure**: Ensure that the mobile phone and your laptop are connected to the exact same Wi-Fi network, and that any local firewall configurations permit connections on ports `8765` and `8000`. If you are testing on a remote network, configure an ngrok tunnel as described in `TEAM_SETUP_INSTRUCTIONS.md`.
