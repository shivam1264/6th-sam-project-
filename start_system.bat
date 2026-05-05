@echo off
setlocal enabledelayedexpansion

REM Define Python executable path
set PYTHON_EXE=C:\Users\maury\.venv\Scripts\python.exe

REM Check if Python exists
if not exist "%PYTHON_EXE%" (
    echo ERROR: Python not found at %PYTHON_EXE%
    echo Please ensure Python is installed.
    pause
    exit /b 1
)

echo =========================================
echo   Starting Smart Parking System...
echo =========================================
echo Python: %PYTHON_EXE%
echo.

echo [1] Starting Backend API Server...
cd /d "%~dp0backend"
if not exist venv (
    echo Creating virtual environment for backend...
    "%PYTHON_EXE%" -m venv venv
)
echo Installing backend requirements...
call venv\Scripts\pip.exe install -r requirements.txt --quiet
echo Starting Flask API...
start "Smart Parking - Flask API" cmd /k "call venv\Scripts\activate && python app.py"
cd /d "%~dp0"

echo.
echo [2] Starting Frontend Dashboard...
cd /d "%~dp0frontend"
echo Starting frontend server on http://localhost:8000...
start "Smart Parking - Dashboard" cmd /k "%PYTHON_EXE% -m http.server 8000"
cd /d "%~dp0"

echo.
echo [3] Starting CV Module (License Plate Detection)...
cd /d "%~dp0"
echo Starting camera module...
start "Smart Parking - LPR System" cmd /k "%PYTHON_EXE% lpr_sequential.py"

echo.
echo =========================================
echo   System Started Successfully!
echo =========================================
echo - Dashboard: http://localhost:8000
echo - Backend API: http://localhost:5000
echo - Entry Camera: Running (window 1)
echo.
echo NOTE: MongoDB service should be running!
echo.
echo (Close the terminal windows to stop the servers.)
pause
