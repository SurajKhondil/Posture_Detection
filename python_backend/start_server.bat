@echo off
echo ==========================================
echo    MediaPipe Pose Detection Server
echo ==========================================
echo.
echo Starting pose detection server on ws://localhost:8765
echo.
echo Make sure your webcam is connected!
echo.
python pose_server.py
pause
