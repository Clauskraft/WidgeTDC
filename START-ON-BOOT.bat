@echo off
title WidgeTDC Cluster Launcher
color 0A

echo ===================================================
echo   STARTING WIDGETTDC NEURAL CLUSTER
echo ===================================================

:: 0. Enforce Development Environment
echo [0/3] Enforcing LOCAL DEVELOPMENT environment...
powershell -ExecutionPolicy Bypass -File "switch-env.ps1" local
if %errorlevel% neq 0 (
    color 0C
    echo ERROR: Could not switch to local environment.
    pause
    exit /b
)

:: 1. Check/Start Docker
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to initialize...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_DOCKER
    echo Docker is ready!
) else (
    echo Docker is already running.
)

:: 2. Start Databases
echo.
echo [2/3] Spinning up Database Layer...
docker-compose up -d postgres redis neo4j prometheus loki

:: 3. Start Applications (New Windows)
echo.
echo [3/3] Launching Backend and Frontend terminals...

:: Start Backend in new window
start "WidgeTDC Backend (MCP)" cmd /k "cd apps/backend && npm run dev"

:: Start Frontend in new window
start "WidgeTDC Frontend" cmd /k "cd apps/widget-board && npm run dev"

echo.
echo ===================================================
echo   CLUSTER LAUNCHED!
echo   Check the new windows for logs.
echo ===================================================
echo.
timeout /t 5
exit