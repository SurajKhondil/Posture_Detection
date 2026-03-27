@echo off
echo ==========================================
echo      Starting Pose Engine (React Native)...
echo ==========================================

REM Start Python Server in a new window
echo Starting Python Backend...
start "Pose Engine Backend" cmd /k "cd python_backend && python pose_server.py"

REM Wait a moment for the server to initialize
timeout /t 3 /nobreak >nul

REM Start React Native App
echo Starting React Native App...
cd react-native-app
npm start

echo.
echo Application closed.
pause
