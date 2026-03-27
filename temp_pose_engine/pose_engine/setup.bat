@echo off
echo ==========================================
echo      Pose Engine - Initial Setup
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
echo Installing Flutter dependencies...
call flutter pub get
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run flutter pub get.
    echo Please make sure Flutter is installed and added to PATH.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      Setup Complete!
echo ==========================================
echo You can now run 'run.bat' to start the application.
echo.
pause
