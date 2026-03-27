@echo off
title PostureCoach Launcher
echo ==================================================
echo   PostureCoach - Starting All Servers
echo ==================================================
echo.

echo [1/3] Starting MediaPipe Pose Server (port 8765)...
start "MediaPipe Server" cmd /k "cd /d "%~dp0python_backend" && python pose_server.py"

echo Waiting 3 seconds...
timeout /t 3 /nobreak

echo [2/3] Starting Team 2 AI Backend (port 8000)...
start "Team2 Backend" cmd /k "cd /d "%~dp0posture-coach-team-copy\backend" && venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 3 seconds...
timeout /t 3 /nobreak

echo [3/3] Starting Expo React Native App...
start "Expo Frontend" cmd /k "cd /d "%~dp0posture-coach-team-copy\frontend" && npm start"

echo.
echo ==================================================
echo   All servers launched! Check the 3 new windows.
echo   Scan the QR code in the Expo window with your phone.
echo ==================================================
pause
