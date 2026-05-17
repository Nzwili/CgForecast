@echo off
title CG Forecast - Production Environment
echo =======================================================================
echo    CG Forecast - Faith Organization Growth Forecasting System
echo =======================================================================
echo.
echo  [1/4] Checking system prerequisites...
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ to run the web application.
    pause
    exit /b 1
)

:: Check Python
if not exist "ml\venv" (
    echo [ERROR] Python virtual environment was not found at ml\venv!
    echo Please ensure the ML microservice setup has been run successfully.
    pause
    exit /b 1
)

echo  [OK] System prerequisites verified.
echo.
echo -----------------------------------------------------------------------
echo  [2/4] Initializing Database & Running Migrations...
echo -----------------------------------------------------------------------
echo.

cd server
:: Run Prisma migration (non-interactive deploy mode)
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Migration deploy failed or no migrations found. 
    echo Attempting to push schema to ensure database structure is ready...
    call npx prisma db push --skip-generate
)

:: Seed database to ensure presentation data is fully loaded
echo.
echo Seeding database with audit and presentation datasets...
call npx prisma db seed
cd ..

echo.
echo  [OK] Database initialized successfully.
echo.
echo -----------------------------------------------------------------------
echo  [3/4] Launching Machine Learning Intelligence Engine (Port 5001)...
echo -----------------------------------------------------------------------
echo.

:: Launch the FastAPI ML service in a minimized background shell
start /min "CG Forecast ML Engine" cmd /c "cd ml && .\venv\Scripts\uvicorn service:app --port 5001"
echo  [OK] ML Engine started in background.
echo.

:: Brief pause to let ML microservice initialize
timeout /t 3 /nobreak > nul

echo -----------------------------------------------------------------------
echo  [4/4] Starting Web Server (Port 3001) & Opening Browser...
echo -----------------------------------------------------------------------
echo.

:: Launch default web browser to the production server URL
start http://localhost:3001

:: Start full-stack Node.js + React production server
cd server
node index.js

pause
