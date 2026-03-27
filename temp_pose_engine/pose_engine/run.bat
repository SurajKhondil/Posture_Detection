@echo off
echo ==========================================
echo      Starting Pose Engine...
echo ==========================================

REM Start Python Server in a new window
echo Starting Python Backend...
start "Pose Engine Backend" cmd /k "cd python_backend && python pose_server.py"

REM Wait a moment for the server to initialize
timeout /t 3 /nobreak >nul

REM Start Flutter App
echo Starting Flutter App...
flutter run -d windows

echo.
echo Application closed.
pause
