@echo off
echo ==========================================
echo      Pose Engine (React Native) - Setup
echo ==========================================
echo.
echo Installing Python dependencies...
cd python_backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install Python dependencies.
    echo Please make sure Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo Installing Node dependencies for React Native...
cd react-native-app
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run npm install.
    echo Please make sure Node.js and npm are installed.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ==========================================
echo      Setup Complete!
echo ==========================================
echo You can now run 'run_rn.bat' to start the application.
echo.
pause
