@echo off
title WidgeTDC Launcher
color 0A

echo ===================================================
echo      WidgeTDC - Neural Command Center Launcher
echo ===================================================
echo.
echo [1/3] Stopper gamle Node.js processer...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       - Gamle processer stoppet.
) else (
    echo       - Ingen processer at stoppe.
)

echo.
echo [2/3] Starter Backend (The Brain) i nyt vindue...
start "WidgeTDC Backend (Port 3001)" cmd /k "cd apps\backend && npm run dev"

echo.
echo [3/3] Starter Frontend (The Face) i nyt vindue...
start "WidgeTDC Frontend (Port 8888)" cmd /k "cd apps\widget-board && npm run dev"

echo.
echo ===================================================
echo      SYSTEMET STARTER NU OP!
echo      Backend: http://localhost:3001
echo      Frontend: http://localhost:8888
echo.
echo      Du kan lukke dette vindue, naar de to andre
echo      vinduer er oppe at koere.
echo ===================================================
pause