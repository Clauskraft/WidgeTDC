@echo off
title WidgeTDC - GOD MODE
color 0b

echo ===============================================================================
echo    WIDGETTDC - SYNTHETIC INTELLIGENCE CONTAINMENT UNIT
echo    GOD MODE ACTIVATED
echo ===============================================================================
echo.

echo [1/3] Checking Environment...
if not exist "apps\backend\.env" (
    echo Warning: Backend .env not found. Ensure configuration is correct.
)

echo [2/3] Starting Backend - OmniHarvester and Evolution Engine...
start "WidgeTDC Backend" cmd /k "cd apps\backend && npm run dev"

echo [3/3] Starting Frontend (Neural Interface)...
start "WidgeTDC Frontend" cmd /k "cd apps\matrix-frontend && npm run dev"

echo.
echo SYSTEM ONLINE.
echo Frontend should be running. Check the frontend terminal for the exact port (usually 5173 or 8888).
echo.
echo 1. Open the URL shown in the frontend terminal.
echo 2. Open the "App Directory" (App Launcher).
echo 3. Find and launch "Neural Interface" to see the God Mode 3D Brain.
echo.
echo Press any key to terminate all processes.
pause >nul

taskkill /F /IM node.exe
echo System Terminated.
